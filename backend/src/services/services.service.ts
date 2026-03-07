import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';
import { UserRole, AuditEventType } from '../common/enums';

@Injectable()
export class ServicesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateServiceDto, userId: string, userRole: UserRole, institutionId: string) {
    // Solo ADMIN puede crear servicios
    if (userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo ADMIN puede crear servicios');
    }

    // Determinar la institución: usar la del DTO si es SUPER_ADMIN, sino usar la del usuario
    const targetInstitutionId = userRole === UserRole.SUPER_ADMIN && dto.institutionId 
      ? dto.institutionId 
      : institutionId;

    // Verificar que no exista un servicio con el mismo nombre en la institución
    const existing = await this.prisma.service.findFirst({
      where: {
        name: dto.name,
        institutionId: targetInstitutionId,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException('Ya existe un servicio con ese nombre');
    }

    const service = await this.prisma.service.create({
      data: {
        name: dto.name,
        description: dto.description,
        institutionId: targetInstitutionId,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });

    // Auditar creación
    await this.auditService.log({
      eventType: AuditEventType.SERVICE_CREATED,
      userId,
      institutionId: targetInstitutionId,
      entityType: 'Service',
      entityId: service.id,
      details: {
        name: service.name,
        description: service.description,
      },
    });

    return service;
  }

  async findAll(userRole: UserRole, institutionId?: string, filters?: { search?: string; isActive?: boolean }) {
    const where: any = {
      deletedAt: null,
    };

    // Multi-tenancy: si no es SUPER_ADMIN, filtrar por institución
    if (userRole !== UserRole.SUPER_ADMIN) {
      where.institutionId = institutionId;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const services = await this.prisma.service.findMany({
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
      services,
      total: services.length,
    };
  }

  async findOne(id: string, userRole: UserRole, institutionId?: string) {
    const service = await this.prisma.service.findFirst({
      where: {
        id,
        deletedAt: null,
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

    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }

    return service;
  }

  async update(id: string, dto: UpdateServiceDto, userId: string, userRole: UserRole, institutionId?: string) {
    // Solo ADMIN puede actualizar
    if (userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo ADMIN puede actualizar servicios');
    }

    const service = await this.findOne(id, userRole, institutionId);

    // Si se cambia el nombre, verificar que no exista otro con ese nombre
    if (dto.name && dto.name !== service.name) {
      const existing = await this.prisma.service.findFirst({
        where: {
          name: dto.name,
          institutionId: service.institutionId,
          deletedAt: null,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException('Ya existe un servicio con ese nombre');
      }
    }

    const beforeData = { ...service };

    const updated = await this.prisma.service.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    // Auditar actualización
    await this.auditService.log({
      eventType: AuditEventType.SERVICE_UPDATED,
      userId,
      institutionId: service.institutionId,
      entityType: 'Service',
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
      throw new ForbiddenException('Solo ADMIN puede eliminar servicios');
    }

    const service = await this.findOne(id, userRole, institutionId);

    // Soft delete
    const deleted = await this.prisma.service.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    // Auditar eliminación
    await this.auditService.log({
      eventType: AuditEventType.SERVICE_DELETED,
      userId,
      institutionId: service.institutionId,
      entityType: 'Service',
      entityId: id,
      details: {
        name: service.name,
      },
    });

    return { message: 'Servicio eliminado exitosamente' };
  }
}
