import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateHolidayDto, UpdateHolidayDto } from './dto/holiday.dto';
import { UserRole, AuditEventType } from '../common/enums';

@Injectable()
export class HolidaysService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    createDto: CreateHolidayDto,
    userId: string,
    userRole: UserRole,
    userInstitutionId?: string,
  ) {
    // Validar multi-tenancy: solo SUPER_ADMIN puede crear festivos nacionales (institutionId null)
    if (!createDto.institutionId && userRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Solo SUPER_ADMIN puede crear festivos nacionales');
    }

    // Validar que ADMIN solo cree festivos para su institución
    if (userRole === UserRole.ADMIN && createDto.institutionId !== userInstitutionId) {
      throw new ForbiddenException('No puedes crear festivos para otra institución');
    }

    // Verificar que la institución existe si se especifica
    if (createDto.institutionId) {
      const institution = await this.prisma.institution.findUnique({
        where: { id: createDto.institutionId },
      });

      if (!institution) {
        throw new BadRequestException('La institución especificada no existe');
      }
    }

    // Verificar duplicados (misma fecha y mismo scope)
    const existing = await this.prisma.holiday.findFirst({
      where: {
        holidayDate: new Date(createDto.holidayDate),
        institutionId: createDto.institutionId || null,
      },
    });

    if (existing) {
      throw new BadRequestException(
        createDto.institutionId
          ? 'Ya existe un festivo en esa fecha para esta institución'
          : 'Ya existe un festivo nacional en esa fecha',
      );
    }

    // Crear festivo
    const holiday = await this.prisma.holiday.create({
      data: {
        holidayDate: new Date(createDto.holidayDate),
        name: createDto.name,
        countryCode: createDto.countryCode,
        institutionId: createDto.institutionId || null,
      },
      include: {
        institution: createDto.institutionId
          ? {
              select: {
                id: true,
                name: true,
                code: true,
              },
            }
          : false,
      },
    });

    // Registrar evento de auditoría
    await this.auditService.log({
      userId,
      institutionId: createDto.institutionId || undefined,
      eventType: AuditEventType.HOLIDAY_CREATED,
      entityType: 'Holiday',
      entityId: holiday.id,
      details: JSON.stringify({
        name: holiday.name,
        holidayDate: holiday.holidayDate,
        scope: createDto.institutionId ? 'institutional' : 'national',
      }),
    });

    return holiday;
  }

  async findAll(
    userRole: UserRole,
    userInstitutionId?: string,
    filters?: { year?: number; month?: number; countryCode?: string },
  ) {
    const where: any = {
      OR: [
        { institutionId: null }, // Festivos nacionales siempre visibles
      ],
    };

    // Añadir festivos institucionales según el rol
    if (userRole !== UserRole.SUPER_ADMIN && userInstitutionId) {
      where.OR.push({ institutionId: userInstitutionId });
    } else if (userRole === UserRole.SUPER_ADMIN) {
      // SUPER_ADMIN ve todos los festivos
      delete where.OR;
    }

    // Filtro por año
    if (filters?.year) {
      const startDate = new Date(`${filters.year}-01-01`);
      const endDate = new Date(`${filters.year}-12-31`);
      where.holidayDate = {
        gte: startDate,
        lte: endDate,
      };
    }

    // Filtro por mes (requiere año)
    if (filters?.month && filters?.year) {
      const startDate = new Date(`${filters.year}-${String(filters.month).padStart(2, '0')}-01`);
      const endDate = new Date(filters.year, filters.month, 0); // Último día del mes
      where.holidayDate = {
        gte: startDate,
        lte: endDate,
      };
    }

    // Filtro por país
    if (filters?.countryCode) {
      where.countryCode = filters.countryCode;
    }

    const holidays = await this.prisma.holiday.findMany({
      where,
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        holidayDate: 'asc',
      },
    });

    return holidays;
  }

  async findOne(id: string, userRole: UserRole, userInstitutionId?: string) {
    const holiday = await this.prisma.holiday.findUnique({
      where: { id },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!holiday) {
      throw new NotFoundException('Festivo no encontrado');
    }

    // Validar acceso: festivos nacionales son públicos, institucionales requieren pertenencia
    if (
      holiday.institutionId &&
      userRole !== UserRole.SUPER_ADMIN &&
      holiday.institutionId !== userInstitutionId
    ) {
      throw new ForbiddenException('No tienes acceso a este festivo');
    }

    return holiday;
  }

  async update(
    id: string,
    updateDto: UpdateHolidayDto,
    userId: string,
    userRole: UserRole,
    userInstitutionId?: string,
  ) {
    const holiday = await this.findOne(id, userRole, userInstitutionId);

    // Solo SUPER_ADMIN puede editar festivos nacionales
    if (!holiday.institutionId && userRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Solo SUPER_ADMIN puede editar festivos nacionales');
    }

    // ADMIN solo edita festivos de su institución
    if (holiday.institutionId && userRole === UserRole.ADMIN && holiday.institutionId !== userInstitutionId) {
      throw new ForbiddenException('No puedes editar festivos de otra institución');
    }

    // Verificar duplicados si se cambia la fecha
    if (updateDto.holidayDate && updateDto.holidayDate !== holiday.holidayDate.toISOString().split('T')[0]) {
      const existing = await this.prisma.holiday.findFirst({
        where: {
          holidayDate: new Date(updateDto.holidayDate),
          institutionId: holiday.institutionId,
          id: { not: id },
        },
      });

      if (existing) {
        throw new BadRequestException('Ya existe un festivo en esa fecha para este alcance');
      }
    }

    // Actualizar
    const updated = await this.prisma.holiday.update({
      where: { id },
      data: {
        ...(updateDto.holidayDate && { holidayDate: new Date(updateDto.holidayDate) }),
        ...(updateDto.name && { name: updateDto.name }),
        ...(updateDto.countryCode && { countryCode: updateDto.countryCode }),
      },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Auditoría
    await this.auditService.log({
      userId,
      institutionId: holiday.institutionId || undefined,
      eventType: AuditEventType.HOLIDAY_UPDATED,
      entityType: 'Holiday',
      entityId: id,
      details: JSON.stringify({
        changes: updateDto,
      }),
    });

    return updated;
  }

  async delete(id: string, userId: string, userRole: UserRole, userInstitutionId?: string) {
    const holiday = await this.findOne(id, userRole, userInstitutionId);

    // Solo SUPER_ADMIN puede eliminar festivos nacionales
    if (!holiday.institutionId && userRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Solo SUPER_ADMIN puede eliminar festivos nacionales');
    }

    // ADMIN solo elimina festivos de su institución
    if (holiday.institutionId && userRole === UserRole.ADMIN && holiday.institutionId !== userInstitutionId) {
      throw new ForbiddenException('No puedes eliminar festivos de otra institución');
    }

    // Eliminar
    await this.prisma.holiday.delete({
      where: { id },
    });

    // Auditoría
    await this.auditService.log({
      userId,
      institutionId: holiday.institutionId || undefined,
      eventType: AuditEventType.HOLIDAY_DELETED,
      entityType: 'Holiday',
      entityId: id,
      details: JSON.stringify({
        name: holiday.name,
        holidayDate: holiday.holidayDate,
      }),
    });

    return { message: 'Festivo eliminado exitosamente' };
  }
}
