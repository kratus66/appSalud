import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateDoctorDto, UpdateDoctorDto } from './dto/doctor.dto';
import { UserRole, AuditEventType } from '../common/enums';

const DOCTOR_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  isActive: true,
  createdAt: true,
  doctorProfile: {
    include: {
      specialty: {
        select: { id: true, name: true, color: true },
      },
    },
  },
};

@Injectable()
export class DoctorsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(
    dto: CreateDoctorDto,
    actorId: string,
    actorRole: UserRole,
    actorInstitutionId: string,
  ) {
    const targetInstitutionId =
      actorRole === UserRole.SUPER_ADMIN && dto.institutionId
        ? dto.institutionId
        : actorInstitutionId;

    // Verificar email único
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Ya existe un usuario con ese correo electrónico');
    }

    // Verificar especialidad existente
    const specialty = await this.prisma.specialty.findFirst({
      where: { id: dto.specialtyId, institutionId: targetInstitutionId, deletedAt: null },
    });
    if (!specialty) {
      throw new NotFoundException('Especialidad no encontrada en esta institución');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    // Transacción: crear User + DoctorProfile
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          password: hashedPassword,
          role: UserRole.DOCTOR,
          specialty: specialty.name, // campo legacy - mantenido para compatibilidad
          institutionId: targetInstitutionId,
        },
      });

      const profile = await tx.doctorProfile.create({
        data: {
          userId: user.id,
          specialtyId: dto.specialtyId,
          licenseNumber: dto.licenseNumber,
          phone: dto.phone,
          consultingRoom: dto.consultingRoom,
          bio: dto.bio,
          institutionId: targetInstitutionId,
        },
      });

      return { user, profile };
    });

    await this.auditService.log({
      eventType: AuditEventType.DOCTOR_CREATED,
      userId: actorId,
      institutionId: targetInstitutionId,
      entityType: 'DoctorProfile',
      entityId: result.profile.id,
      details: JSON.stringify({
        name: `${dto.firstName} ${dto.lastName}`,
        email: dto.email,
        specialty: specialty.name,
      }),
    });

    return this.findOne(result.user.id, actorRole, targetInstitutionId);
  }

  async findAll(
    userRole: UserRole,
    institutionId?: string,
    filters?: { search?: string; specialtyId?: string; includeInactive?: boolean },
  ) {
    const where: any = {
      role: UserRole.DOCTOR,
      deletedAt: null,
    };

    if (!filters?.includeInactive) {
      where.isActive = true;
    }

    if (userRole !== UserRole.SUPER_ADMIN) {
      where.institutionId = institutionId;
    }

    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        {
          doctorProfile: {
            OR: [
              { licenseNumber: { contains: filters.search, mode: 'insensitive' } },
              { specialty: { name: { contains: filters.search, mode: 'insensitive' } } },
            ],
          },
        },
      ];
    }

    if (filters?.specialtyId) {
      where.doctorProfile = { ...where.doctorProfile, specialtyId: filters.specialtyId };
    }

    const doctors = await this.prisma.user.findMany({
      where,
      select: DOCTOR_SELECT,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });

    return { doctors, total: doctors.length };
  }

  async findOne(id: string, userRole: UserRole, institutionId?: string) {
    const doctor = await this.prisma.user.findFirst({
      where: {
        id,
        role: UserRole.DOCTOR,
        deletedAt: null,
        ...(userRole !== UserRole.SUPER_ADMIN && { institutionId }),
      },
      select: {
        ...DOCTOR_SELECT,
        doctorProfile: {
          include: {
            specialty: {
              select: { id: true, name: true, color: true, description: true },
            },
          },
        },
        doctorAppointments: {
          where: { deletedAt: null },
          orderBy: { appointmentDate: 'desc' },
          take: 5,
          include: {
            patient: {
              select: { id: true, firstName: true, lastName: true, documentNumber: true },
            },
          },
        },
      },
    });

    if (!doctor) {
      throw new NotFoundException('Médico no encontrado');
    }

    return doctor;
  }

  async update(
    id: string,
    dto: UpdateDoctorDto,
    actorId: string,
    userRole: UserRole,
    institutionId?: string,
  ) {
    const doctor = await this.findOne(id, userRole, institutionId);

    // Verificar email único si cambia
    if (dto.email && dto.email !== doctor.email) {
      const conflict = await this.prisma.user.findFirst({
        where: { email: dto.email, NOT: { id } },
      });
      if (conflict) {
        throw new ConflictException('Ya existe un usuario con ese correo');
      }
    }

    const userUpdates: any = {};
    if (dto.firstName !== undefined) userUpdates.firstName = dto.firstName;
    if (dto.lastName !== undefined) userUpdates.lastName = dto.lastName;
    if (dto.email !== undefined) userUpdates.email = dto.email;
    if (dto.isActive !== undefined) userUpdates.isActive = dto.isActive;
    if (dto.password) {
      userUpdates.password = await bcrypt.hash(dto.password, 12);
    }

    const profileUpdates: any = {};
    if (dto.specialtyId !== undefined) {
      const specialty = await this.prisma.specialty.findFirst({
        where: { id: dto.specialtyId, deletedAt: null },
      });
      if (!specialty) throw new NotFoundException('Especialidad no encontrada');
      profileUpdates.specialtyId = dto.specialtyId;
      userUpdates.specialty = specialty.name; // legacy field sync
    }
    if (dto.licenseNumber !== undefined) profileUpdates.licenseNumber = dto.licenseNumber;
    if (dto.phone !== undefined) profileUpdates.phone = dto.phone;
    if (dto.consultingRoom !== undefined) profileUpdates.consultingRoom = dto.consultingRoom;
    if (dto.bio !== undefined) profileUpdates.bio = dto.bio;
    if (dto.isActive !== undefined) profileUpdates.isActive = dto.isActive;

    await this.prisma.$transaction(async (tx) => {
      if (Object.keys(userUpdates).length > 0) {
        await tx.user.update({ where: { id }, data: userUpdates });
      }
      if (Object.keys(profileUpdates).length > 0 && (doctor as any).doctorProfile) {
        await tx.doctorProfile.update({
          where: { userId: id },
          data: profileUpdates,
        });
      }
    });

    await this.auditService.log({
      eventType: AuditEventType.DOCTOR_UPDATED,
      userId: actorId,
      institutionId: (doctor as any).institutionId ?? institutionId,
      entityType: 'DoctorProfile',
      entityId: id,
      details: JSON.stringify({ changes: dto }),
    });

    return this.findOne(id, userRole, institutionId);
  }

  async delete(
    id: string,
    actorId: string,
    userRole: UserRole,
    institutionId?: string,
  ) {
    const doctor = await this.findOne(id, userRole, institutionId);

    // Verificar citas futuras activas
    const futureCitas = await this.prisma.appointment.count({
      where: {
        doctorId: id,
        deletedAt: null,
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
        appointmentDate: { gte: new Date() },
      },
    });

    if (futureCitas > 0) {
      throw new ConflictException(
        `No se puede eliminar: el médico tiene ${futureCitas} cita(s) futuras activas`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      if ((doctor as any).doctorProfile) {
        await tx.doctorProfile.update({
          where: { userId: id },
          data: { deletedAt: new Date(), isActive: false },
        });
      }
      await tx.user.update({
        where: { id },
        data: { deletedAt: new Date(), isActive: false },
      });
    });

    await this.auditService.log({
      eventType: AuditEventType.DOCTOR_DELETED,
      userId: actorId,
      institutionId: (doctor as any).institutionId ?? institutionId,
      entityType: 'DoctorProfile',
      entityId: id,
      details: JSON.stringify({
        name: `${doctor.firstName} ${doctor.lastName}`,
      }),
    });

    return { message: 'Médico eliminado correctamente' };
  }
}
