import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateSpecialtyDto, UpdateSpecialtyDto } from './dto/specialty.dto';
import { UserRole, AuditEventType } from '../common/enums';

@Injectable()
export class SpecialtiesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(
    dto: CreateSpecialtyDto,
    userId: string,
    userRole: UserRole,
    institutionId: string,
  ) {
    const targetInstitutionId =
      userRole === UserRole.SUPER_ADMIN && dto.institutionId
        ? dto.institutionId
        : institutionId;

    const existing = await this.prisma.specialty.findFirst({
      where: {
        name: dto.name,
        institutionId: targetInstitutionId,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException('Ya existe una especialidad con ese nombre');
    }

    const specialty = await this.prisma.specialty.create({
      data: {
        name: dto.name,
        description: dto.description,
        color: dto.color ?? '#3b82f6',
        institutionId: targetInstitutionId,
      },
    });

    await this.auditService.log({
      eventType: AuditEventType.SPECIALTY_CREATED,
      userId,
      institutionId: targetInstitutionId,
      entityType: 'Specialty',
      entityId: specialty.id,
      details: JSON.stringify({ name: specialty.name }),
    });

    return specialty;
  }

  async findAll(
    userRole: UserRole,
    institutionId?: string,
    filters?: { search?: string; includeInactive?: boolean },
  ) {
    const where: any = {};

    if (!filters?.includeInactive) {
      where.deletedAt = null;
      where.isActive = true;
    }

    if (userRole !== UserRole.SUPER_ADMIN) {
      where.institutionId = institutionId;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const specialties = await this.prisma.specialty.findMany({
      where,
      include: {
        _count: { select: { doctors: true } },
      },
      orderBy: { name: 'asc' },
    });

    return { specialties, total: specialties.length };
  }

  async findOne(id: string, userRole: UserRole, institutionId?: string) {
    const specialty = await this.prisma.specialty.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(userRole !== UserRole.SUPER_ADMIN && { institutionId }),
      },
      include: {
        doctors: {
          where: { deletedAt: null, isActive: true },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!specialty) {
      throw new NotFoundException('Especialidad no encontrada');
    }

    return specialty;
  }

  async update(
    id: string,
    dto: UpdateSpecialtyDto,
    userId: string,
    userRole: UserRole,
    institutionId?: string,
  ) {
    const specialty = await this.findOne(id, userRole, institutionId);

    if (dto.name && dto.name !== specialty.name) {
      const conflict = await this.prisma.specialty.findFirst({
        where: {
          name: dto.name,
          institutionId: specialty.institutionId,
          deletedAt: null,
          NOT: { id },
        },
      });
      if (conflict) {
        throw new ConflictException('Ya existe una especialidad con ese nombre');
      }
    }

    const updated = await this.prisma.specialty.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        color: dto.color,
        isActive: dto.isActive,
      },
    });

    await this.auditService.log({
      eventType: AuditEventType.SPECIALTY_UPDATED,
      userId,
      institutionId: specialty.institutionId,
      entityType: 'Specialty',
      entityId: id,
      details: JSON.stringify({ changes: dto }),
    });

    return updated;
  }

  async delete(
    id: string,
    userId: string,
    userRole: UserRole,
    institutionId?: string,
  ) {
    const specialty = await this.findOne(id, userRole, institutionId);

    // Verificar que no tenga médicos activos
    const activeDoctors = await this.prisma.doctorProfile.count({
      where: { specialtyId: id, deletedAt: null, isActive: true },
    });

    if (activeDoctors > 0) {
      throw new ConflictException(
        `No se puede eliminar: la especialidad tiene ${activeDoctors} médico(s) activo(s)`,
      );
    }

    await this.prisma.specialty.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await this.auditService.log({
      eventType: AuditEventType.SPECIALTY_DELETED,
      userId,
      institutionId: specialty.institutionId,
      entityType: 'Specialty',
      entityId: id,
      details: JSON.stringify({ name: specialty.name }),
    });

    return { message: 'Especialidad eliminada correctamente' };
  }
}
