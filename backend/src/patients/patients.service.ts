import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreatePatientDto, UpdatePatientDto } from './dto/patient.dto';
import { UserRole, AuditEventType } from '../common/enums';

@Injectable()
export class PatientsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreatePatientDto, userId: string, userRole: UserRole, institutionId: string) {
    // Determinar institución
    const targetInstitutionId = userRole === UserRole.SUPER_ADMIN && dto.institutionId 
      ? dto.institutionId 
      : institutionId;

    // Verificar paciente duplicado
    const existing = await this.prisma.patient.findFirst({
      where: {
        documentNumber: dto.documentNumber,
        institutionId: targetInstitutionId,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException('Ya existe un paciente con ese número de documento');
    }

    const patient = await this.prisma.patient.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        documentType: dto.documentType,
        documentNumber: dto.documentNumber,
        email: dto.email,
        phone: dto.phone,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
        gender: dto.gender,
        address: dto.address,
        institutionId: targetInstitutionId,
      },
    });

    await this.auditService.log({
      eventType: AuditEventType.PATIENT_CREATED,
      userId,
      institutionId: targetInstitutionId,
      entityType: 'Patient',
      entityId: patient.id,
      details: JSON.stringify({
        name: `${patient.firstName} ${patient.lastName}`,
        documentNumber: patient.documentNumber,
      }),
    });

    return patient;
  }

  async findAll(userRole: UserRole, institutionId?: string, filters?: { search?: string }) {
    const where: any = {
      deletedAt: null,
    };

    if (userRole !== UserRole.SUPER_ADMIN) {
      where.institutionId = institutionId;
    }

    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { documentNumber: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const patients = await this.prisma.patient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return { patients, total: patients.length };
  }

  async findOne(id: string, userRole: UserRole, institutionId?: string) {
    const patient = await this.prisma.patient.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(userRole !== UserRole.SUPER_ADMIN && { institutionId }),
      },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    return patient;
  }

  async update(id: string, dto: UpdatePatientDto, userId: string, userRole: UserRole, institutionId?: string) {
    const patient = await this.findOne(id, userRole, institutionId);

    const updated = await this.prisma.patient.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        gender: dto.gender,
        address: dto.address,
      },
    });

    await this.auditService.log({
      eventType: AuditEventType.PATIENT_UPDATED,
      userId,
      institutionId: patient.institutionId,
      entityType: 'Patient',
      entityId: id,
      details: JSON.stringify({ changes: dto }),
    });

    return updated;
  }

  async delete(id: string, userId: string, userRole: UserRole, institutionId?: string) {
    const patient = await this.findOne(id, userRole, institutionId);

    await this.prisma.patient.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditService.log({
      eventType: AuditEventType.PATIENT_DELETED,
      userId,
      institutionId: patient.institutionId,
      entityType: 'Patient',
      entityId: id,
      details: JSON.stringify({
        name: `${patient.firstName} ${patient.lastName}`,
      }),
    });

    return { message: 'Paciente eliminado exitosamente' };
  }
}
