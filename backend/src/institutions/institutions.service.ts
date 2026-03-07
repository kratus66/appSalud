import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateInstitutionDto, UpdateInstitutionDto } from './dto/institution.dto';
import { InstitutionStatus, AuditEventType } from '../common/enums';

@Injectable()
export class InstitutionsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateInstitutionDto, userId: string) {
    // Verificar que el código no exista
    const existing = await this.prisma.institution.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException('El código de institución ya existe');
    }

    const institution = await this.prisma.institution.create({
      data: {
        name: dto.name,
        code: dto.code,
        metadata: dto.metadata ? JSON.stringify(dto.metadata) : null,
      },
    });

    // Auditar creación
    await this.auditService.log({
      eventType: AuditEventType.INSTITUTION_CREATED,
      userId,
      institutionId: institution.id,
      entityType: 'Institution',
      entityId: institution.id,
      details: {
        name: institution.name,
        code: institution.code,
      },
    });

    return institution;
  }

  async findAll(filters?: { status?: InstitutionStatus; search?: string }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [institutions, total] = await Promise.all([
      this.prisma.institution.findMany({
        where,
        include: {
          _count: {
            select: { users: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.institution.count({ where }),
    ]);

    return {
      institutions: institutions.map((inst) => ({
        ...inst,
        metadata: inst.metadata ? JSON.parse(inst.metadata) : null,
        userCount: inst._count.users,
      })),
      total,
    };
  }

  async findOne(id: string) {
    const institution = await this.prisma.institution.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!institution) {
      throw new NotFoundException('Institución no encontrada');
    }

    return {
      ...institution,
      metadata: institution.metadata ? JSON.parse(institution.metadata) : null,
      userCount: institution._count.users,
    };
  }

  async update(id: string, dto: UpdateInstitutionDto, userId: string) {
    const institution = await this.findOne(id);

    const updateData: any = { ...dto };
    if (dto.metadata) {
      updateData.metadata = JSON.stringify(dto.metadata);
    }

    const updated = await this.prisma.institution.update({
      where: { id },
      data: updateData,
    });

    // Auditar actualización
    await this.auditService.log({
      eventType: AuditEventType.INSTITUTION_UPDATED,
      userId,
      institutionId: id,
      entityType: 'Institution',
      entityId: id,
      details: {
        changes: dto,
      },
    });

    return {
      ...updated,
      metadata: updated.metadata ? JSON.parse(updated.metadata) : null,
    };
  }

  async suspend(id: string, userId: string) {
    await this.findOne(id);

    const suspended = await this.prisma.institution.update({
      where: { id },
      data: { status: InstitutionStatus.SUSPENDED },
    });

    // Auditar suspensión
    await this.auditService.log({
      eventType: AuditEventType.INSTITUTION_SUSPENDED,
      userId,
      institutionId: id,
      entityType: 'Institution',
      entityId: id,
      details: {
        previousStatus: 'ACTIVE',
        newStatus: 'SUSPENDED',
      },
    });

    return {
      ...suspended,
      metadata: suspended.metadata ? JSON.parse(suspended.metadata) : null,
    };
  }

  async getStats() {
    const [total, active, suspended, inactive] = await Promise.all([
      this.prisma.institution.count(),
      this.prisma.institution.count({ where: { status: InstitutionStatus.ACTIVE } }),
      this.prisma.institution.count({ where: { status: InstitutionStatus.SUSPENDED } }),
      this.prisma.institution.count({ where: { status: InstitutionStatus.INACTIVE } }),
    ]);

    const recent = await this.prisma.institution.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
        createdAt: true,
      },
    });

    return {
      total,
      byStatus: {
        active,
        suspended,
        inactive,
      },
      recent,
    };
  }
}
