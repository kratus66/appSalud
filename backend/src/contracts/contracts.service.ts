import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateContractDto, UpdateContractDto } from './dto/contract.dto';
import { UserRole, AuditEventType } from '../common/enums';

@Injectable()
export class ContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    createDto: CreateContractDto,
    userId: string,
    userRole: UserRole,
    userInstitutionId?: string,
  ) {
    // Validar multi-tenancy
    if (userRole === UserRole.ADMIN && createDto.institutionId !== userInstitutionId) {
      throw new ForbiddenException('No puedes crear contratos para otra institución');
    }

    // Verificar que la institución existe
    const institution = await this.prisma.institution.findUnique({
      where: { id: createDto.institutionId },
    });

    if (!institution) {
      throw new BadRequestException('La institución especificada no existe');
    }

    // Verificar duplicados (nombre único por institución)
    const existing = await this.prisma.contract.findFirst({
      where: {
        name: createDto.name,
        institutionId: createDto.institutionId,
      },
    });

    if (existing) {
      throw new BadRequestException('Ya existe un contrato con ese nombre en esta institución');
    }

    // Validar rulesConfig si viene como JSON
    if (createDto.rulesConfig) {
      try {
        JSON.parse(createDto.rulesConfig);
      } catch (error) {
        throw new BadRequestException('El campo rulesConfig debe ser un JSON válido');
      }
    }

    // Crear contrato
    const contract = await this.prisma.contract.create({
      data: createDto,
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

    // Registrar evento de auditoría
    await this.auditService.log({
      userId,
      institutionId: createDto.institutionId,
      eventType: AuditEventType.CONTRACT_CREATED,
      entityType: 'Contract',
      entityId: contract.id,
      details: JSON.stringify({
        name: contract.name,
        weeklyHours: contract.weeklyHours,
        maxConsecutiveNights: contract.maxConsecutiveNights,
        requiredRestHours: contract.requiredRestHours,
      }),
    });

    return contract;
  }

  async findAll(
    userRole: UserRole,
    userInstitutionId?: string,
    filters?: { search?: string; isActive?: boolean },
  ) {
    const where: any = {
      isActive: true, // Por defecto solo mostrar contratos activos
    };

    // Filtrar por institución según rol
    if (userRole === UserRole.ADMIN || userRole === UserRole.PLANIFICADOR || userRole === UserRole.APROBADOR) {
      where.institutionId = userInstitutionId;
    }

    // Filtro de búsqueda
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Permitir explícitamente buscar inactivos si se especifica
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const contracts = await this.prisma.contract.findMany({
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
        createdAt: 'desc',
      },
    });

    return contracts;
  }

  async findOne(id: string, userRole: UserRole, userInstitutionId?: string) {
    const contract = await this.prisma.contract.findUnique({
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

    if (!contract) {
      throw new NotFoundException('Contrato no encontrado');
    }

    // Validar acceso multi-tenant
    if (
      (userRole === UserRole.ADMIN || userRole === UserRole.PLANIFICADOR || userRole === UserRole.APROBADOR) &&
      contract.institutionId !== userInstitutionId
    ) {
      throw new ForbiddenException('No tienes acceso a este contrato');
    }

    return contract;
  }

  async update(
    id: string,
    updateDto: UpdateContractDto,
    userId: string,
    userRole: UserRole,
    userInstitutionId?: string,
  ) {
    const contract = await this.findOne(id, userRole, userInstitutionId);

    // Verificar duplicados si se cambia el nombre
    if (updateDto.name && updateDto.name !== contract.name) {
      const existing = await this.prisma.contract.findFirst({
        where: {
          name: updateDto.name,
          institutionId: contract.institutionId,
          id: { not: id },
        },
      });

      if (existing) {
        throw new BadRequestException('Ya existe un contrato con ese nombre en esta institución');
      }
    }

    // Validar rulesConfig si viene como JSON
    if (updateDto.rulesConfig) {
      try {
        JSON.parse(updateDto.rulesConfig);
      } catch (error) {
        throw new BadRequestException('El campo rulesConfig debe ser un JSON válido');
      }
    }

    // Actualizar
    const updated = await this.prisma.contract.update({
      where: { id },
      data: updateDto,
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
      institutionId: contract.institutionId,
      eventType: AuditEventType.CONTRACT_UPDATED,
      entityType: 'Contract',
      entityId: id,
      details: JSON.stringify({
        changes: updateDto,
      }),
    });

    return updated;
  }

  async delete(id: string, userId: string, userRole: UserRole, userInstitutionId?: string) {
    const contract = await this.findOne(id, userRole, userInstitutionId);

    // Desactivar el contrato (soft delete)
    await this.prisma.contract.update({
      where: { id },
      data: { isActive: false },
    });

    // Auditoría
    await this.auditService.log({
      userId,
      institutionId: contract.institutionId,
      eventType: AuditEventType.CONTRACT_DELETED,
      entityType: 'Contract',
      entityId: id,
      details: JSON.stringify({
        name: contract.name,
        weeklyHours: contract.weeklyHours,
      }),
    });

    return { message: 'Contrato eliminado exitosamente' };
  }
}
