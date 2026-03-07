import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateShiftDto, UpdateShiftDto } from './dto/shift.dto';
import { UserRole, AuditEventType } from '../common/enums';

@Injectable()
export class ShiftsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  // Validar que el horario sea coherente
  private validateShiftTimes(startTime: string, endTime: string) {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    // Permitir turnos nocturnos que cruzan medianoche
    // Ejemplo: 23:00 - 07:00 es válido
    if (startMinutes === endMinutes) {
      throw new BadRequestException('El horario de inicio y fin no pueden ser iguales');
    }

    // No validar que end > start porque turnos nocturnos cruzan medianoche
    return true;
  }

  async create(dto: CreateShiftDto, userId: string, userRole: UserRole, institutionId: string) {
    // Solo ADMIN puede crear turnos
    if (userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo ADMIN puede crear turnos');
    }

    // Validar horarios
    this.validateShiftTimes(dto.startTime, dto.endTime);

    // Determinar la institución: usar la del DTO si es SUPER_ADMIN, sino usar la del usuario
    const targetInstitutionId = userRole === UserRole.SUPER_ADMIN && dto.institutionId 
      ? dto.institutionId 
      : institutionId;

    // Verificar que no exista un turno con el mismo nombre en la institución
    const existing = await this.prisma.shift.findFirst({
      where: {
        name: dto.name,
        institutionId: targetInstitutionId,
      },
    });

    if (existing) {
      throw new ConflictException('Ya existe un turno con ese nombre');
    }

    const shift = await this.prisma.shift.create({
      data: {
        name: dto.name,
        startTime: dto.startTime,
        endTime: dto.endTime,
        shiftType: dto.shiftType,
        color: dto.color || '#3b82f6',
        institutionId: targetInstitutionId,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });

    // Auditar creación
    await this.auditService.log({
      eventType: AuditEventType.SHIFT_CREATED,
      userId,
      institutionId: targetInstitutionId,
      entityType: 'Shift',
      entityId: shift.id,
      details: {
        name: shift.name,
        startTime: shift.startTime,
        endTime: shift.endTime,
        shiftType: shift.shiftType,
      },
    });

    return shift;
  }

  async findAll(userRole: UserRole, institutionId?: string, filters?: { search?: string; isActive?: boolean }) {
    const where: any = {
      isActive: true, // Por defecto solo mostrar turnos activos
    };

    // Multi-tenancy
    if (userRole !== UserRole.SUPER_ADMIN) {
      where.institutionId = institutionId;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Permitir explícitamente buscar inactivos si se especifica
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const shifts = await this.prisma.shift.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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

    return {
      shifts,
      total: shifts.length,
    };
  }

  async findOne(id: string, userRole: UserRole, institutionId?: string) {
    const shift = await this.prisma.shift.findFirst({
      where: {
        id,
        ...(userRole !== UserRole.SUPER_ADMIN && { institutionId }),
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

    if (!shift) {
      throw new NotFoundException('Turno no encontrado');
    }

    return shift;
  }

  async update(id: string, dto: UpdateShiftDto, userId: string, userRole: UserRole, institutionId?: string) {
    // Solo ADMIN puede actualizar
    if (userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo ADMIN puede actualizar turnos');
    }

    const shift = await this.findOne(id, userRole, institutionId);

    // Validar horarios si se están actualizando
    const newStartTime = dto.startTime || shift.startTime;
    const newEndTime = dto.endTime || shift.endTime;
    
    if (dto.startTime || dto.endTime) {
      this.validateShiftTimes(newStartTime, newEndTime);
    }

    // Si se cambia el nombre, verificar que no exista otro con ese nombre
    if (dto.name && dto.name !== shift.name) {
      const existing = await this.prisma.shift.findFirst({
        where: {
          name: dto.name,
          institutionId: shift.institutionId,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException('Ya existe un turno con ese nombre');
      }
    }

    const beforeData = { ...shift };

    const updated = await this.prisma.shift.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.startTime && { startTime: dto.startTime }),
        ...(dto.endTime && { endTime: dto.endTime }),
        ...(dto.shiftType && { shiftType: dto.shiftType }),
        ...(dto.color && { color: dto.color }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    // Auditar actualización
    await this.auditService.log({
      eventType: AuditEventType.SHIFT_UPDATED,
      userId,
      institutionId: shift.institutionId,
      entityType: 'Shift',
      entityId: id,
      details: {
        before: beforeData,
        after: updated,
      },
    });

    return updated;
  }

  async delete(id: string, userId: string, userRole: UserRole, institutionId?: string) {
    // Solo ADMIN puede eliminar
    if (userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo ADMIN puede eliminar turnos');
    }

    const shift = await this.findOne(id, userRole, institutionId);

    // Desactivar el turno
    const deleted = await this.prisma.shift.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    // Auditar eliminación
    await this.auditService.log({
      eventType: AuditEventType.SHIFT_DELETED,
      userId,
      institutionId: shift.institutionId,
      entityType: 'Shift',
      entityId: id,
      details: {
        name: shift.name,
      },
    });

    return { message: 'Turno eliminado exitosamente' };
  }
}
