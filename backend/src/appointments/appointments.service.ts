import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateAppointmentDto, UpdateAppointmentDto, AppointmentFiltersDto } from './dto/appointment.dto';
import { UserRole, AuditEventType, AppointmentStatus } from '../common/enums';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /** Convierte "HH:MM" a minutos desde medianoche */
  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  /**
   * Validar conflictos de horario (doble reserva)
   */
  private async checkDoubleBooking(
    doctorId: string,
    appointmentDate: Date,
    startTime: string,
    endTime: string,
    excludeAppointmentId?: string,
  ) {
    const dateStr = appointmentDate.toISOString().split('T')[0];

    const conflicts = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        appointmentDate: new Date(dateStr),
        status: {
          in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
        },
        deletedAt: null,
        ...(excludeAppointmentId && { id: { not: excludeAppointmentId } }),
        OR: [
          // Nueva cita inicia durante una existente
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          // Nueva cita termina durante una existente
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          // Nueva cita envuelve una existente
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
    });

    if (conflicts.length > 0) {
      throw new ConflictException(
        `El doctor ya tiene una cita programada entre ${conflicts[0].startTime} y ${conflicts[0].endTime}`,
      );
    }
  }

  async create(dto: CreateAppointmentDto, userId: string, userRole: UserRole, institutionId: string) {
    // Validar que paciente existe
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, deletedAt: null },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    // Validar que doctor existe y tiene rol DOCTOR
    const doctor = await this.prisma.user.findFirst({
      where: { 
        id: dto.doctorId, 
        role: UserRole.DOCTOR,
        isActive: true,
      },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor no encontrado o inactivo');
    }

    // Verificar que pertenecen a la misma institución
    if (userRole !== UserRole.SUPER_ADMIN) {
      if (patient.institutionId !== institutionId || doctor.institutionId !== institutionId) {
        throw new BadRequestException('El paciente y el doctor deben pertenecer a la misma institución');
      }
    }

    // Validar que startTime < endTime
    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException('La hora de inicio debe ser menor a la hora de fin');
    }

    // Validar horario laboral del médico (parsear localmente para evitar desfase UTC en getDay())
    const [ay, am, ad] = (dto.appointmentDate as string).split('-').map(Number);
    const localApptDate = new Date(ay, am - 1, ad);
    const dayOfWeek = localApptDate.getDay(); // 0=Dom … 6=Sáb

    const schedule = await this.prisma.doctorSchedule.findFirst({
      where: { doctorId: dto.doctorId, dayOfWeek, isActive: true },
    });

    if (schedule) {
      const apptStart = this.timeToMinutes(dto.startTime);
      const apptEnd = this.timeToMinutes(dto.endTime);
      const schedStart = this.timeToMinutes(schedule.startTime);
      const schedEnd = this.timeToMinutes(schedule.endTime);

      if (apptStart < schedStart || apptEnd > schedEnd) {
        throw new BadRequestException(
          `El médico solo atiende de ${schedule.startTime} a ${schedule.endTime} ese día`,
        );
      }
    }

    // Validar bloqueos de agenda (new Date('YYYY-MM-DD') = UTC midnight, igual que como se almacenan los bloques)
    const dateOnly = new Date(dto.appointmentDate as string);
    const blocks = await this.prisma.timeBlock.findMany({
      where: { doctorId: dto.doctorId, date: dateOnly },
    });

    for (const block of blocks) {
      const blockStart = this.timeToMinutes(block.startTime);
      const blockEnd = this.timeToMinutes(block.endTime);
      const apptStart = this.timeToMinutes(dto.startTime);
      const apptEnd = this.timeToMinutes(dto.endTime);
      if (apptStart < blockEnd && apptEnd > blockStart) {
        throw new BadRequestException(
          `El médico tiene su agenda bloqueada en ese horario${block.reason ? ': ' + block.reason : ''}.`,
        );
      }
    }

    // Verificar doble reserva
    await this.checkDoubleBooking(
      dto.doctorId,
      new Date(dto.appointmentDate),
      dto.startTime,
      dto.endTime,
    );

    const appointment = await this.prisma.appointment.create({
      data: {
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        appointmentDate: new Date(dto.appointmentDate),
        startTime: dto.startTime,
        endTime: dto.endTime,
        reason: dto.reason,
        notes: dto.notes,
        status: dto.status || AppointmentStatus.SCHEDULED,
        institutionId: patient.institutionId,
      },
      include: {
        patient: true,
        doctor: true,
      },
    });

    await this.auditService.log({
      eventType: AuditEventType.APPOINTMENT_CREATED,
      userId,
      institutionId: patient.institutionId,
      entityType: 'Appointment',
      entityId: appointment.id,
      details: JSON.stringify({
        patient: `${patient.firstName} ${patient.lastName}`,
        doctor: `${doctor.firstName} ${doctor.lastName}`,
        date: dto.appointmentDate,
        time: `${dto.startTime} - ${dto.endTime}`,
      }),
    });

    return appointment;
  }

  async findAll(userRole: UserRole, institutionId: string, userId: string, filters?: AppointmentFiltersDto) {
    const where: any = {
      deletedAt: null,
    };

    // Filtros por institución o por doctor
    if (userRole === UserRole.DOCTOR) {
      where.doctorId = userId;
    } else if (userRole !== UserRole.SUPER_ADMIN) {
      where.institutionId = institutionId;
    }

    // Filtros adicionales
    if (filters?.startDate && filters?.endDate) {
      where.appointmentDate = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    } else if (filters?.startDate) {
      where.appointmentDate = {
        gte: new Date(filters.startDate),
      };
    } else if (filters?.endDate) {
      where.appointmentDate = {
        lte: new Date(filters.endDate),
      };
    }

    if (filters?.doctorId) {
      where.doctorId = filters.doctorId;
    }

    if (filters?.patientId) {
      where.patientId = filters.patientId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    const appointments = await this.prisma.appointment.findMany({
      where,
      include: {
        patient: true,
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            specialty: true,
          },
        },
      },
      orderBy: [
        { appointmentDate: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return { appointments, total: appointments.length };
  }

  async findOne(id: string, userRole: UserRole, institutionId?: string, userId?: string) {
    const where: any = {
      id,
      deletedAt: null,
    };

    if (userRole === UserRole.DOCTOR) {
      where.doctorId = userId;
    } else if (userRole !== UserRole.SUPER_ADMIN) {
      where.institutionId = institutionId;
    }

    const appointment = await this.prisma.appointment.findFirst({
      where,
      include: {
        patient: true,
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            specialty: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    return appointment;
  }

  async update(
    id: string,
    dto: UpdateAppointmentDto,
    userId: string,
    userRole: UserRole,
    institutionId?: string,
  ) {
    const appointment = await this.findOne(id, userRole, institutionId, userId);

    // Si se cambian fecha/hora, validar doble reserva
    if (dto.appointmentDate || dto.startTime || dto.endTime) {
      const newDate = dto.appointmentDate ? new Date(dto.appointmentDate) : appointment.appointmentDate;
      const newStart = dto.startTime || appointment.startTime;
      const newEnd = dto.endTime || appointment.endTime;

      if (newStart >= newEnd) {
        throw new BadRequestException('La hora de inicio debe ser menor a la hora de fin');
      }

      await this.checkDoubleBooking(
        appointment.doctorId,
        newDate,
        newStart,
        newEnd,
        id,
      );
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        appointmentDate: dto.appointmentDate ? new Date(dto.appointmentDate) : undefined,
        startTime: dto.startTime,
        endTime: dto.endTime,
        reason: dto.reason,
        notes: dto.notes,
        status: dto.status,
      },
      include: {
        patient: true,
        doctor: true,
      },
    });

    await this.auditService.log({
      eventType: AuditEventType.APPOINTMENT_UPDATED,
      userId,
      institutionId: appointment.institutionId,
      entityType: 'Appointment',
      entityId: id,
      details: JSON.stringify({ changes: dto }),
    });

    return updated;
  }

  async cancel(id: string, userId: string, userRole: UserRole, institutionId?: string) {
    const appointment = await this.findOne(id, userRole, institutionId, userId);

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CANCELLED },
      include: {
        patient: true,
        doctor: true,
      },
    });

    await this.auditService.log({
      eventType: AuditEventType.APPOINTMENT_CANCELLED,
      userId,
      institutionId: updated.institutionId,
      entityType: 'Appointment',
      entityId: id,
      details: JSON.stringify({
        patient: `${updated.patient.firstName} ${updated.patient.lastName}`,
        date: updated.appointmentDate,
      }),
    });

    return updated;
  }

  async delete(id: string, userId: string, userRole: UserRole, institutionId?: string) {
    const appointment = await this.findOne(id, userRole, institutionId, userId);

    await this.prisma.appointment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditService.log({
      eventType: AuditEventType.APPOINTMENT_DELETED,
      userId,
      institutionId: appointment.institutionId,
      entityType: 'Appointment',
      entityId: id,
      details: JSON.stringify({
        patient: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
      }),
    });

    return { message: 'Cita eliminada exitosamente' };
  }

  /**
   * Obtener disponibilidad de un doctor en una fecha específica
   */
  async getDoctorAvailability(doctorId: string, date: string) {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        appointmentDate: new Date(date),
        status: {
          in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
        },
        deletedAt: null,
      },
      orderBy: { startTime: 'asc' },
    });

    return appointments;
  }
}
