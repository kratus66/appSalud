import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateScheduleDto,
  UpdateScheduleDto,
  CreateBlockDto,
  CreateRecurringAppointmentDto,
} from './dto/availability.dto';
import {
  UserRole,
  AuditEventType,
  AppointmentStatus,
  RecurringFrequency,
  SlotStatus,
} from '../common/enums';

@Injectable()
export class AvailabilityService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  // ─── Helpers ────────────────────────────────────────────────────

  /** Convierte "HH:MM" a minutos desde medianoche */
  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  /** Convierte minutos a "HH:MM" */
  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60).toString().padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  /** Verifica que el médico pertenece a la institución */
  private async assertDoctor(doctorId: string, institutionId: string) {
    const doctor = await this.prisma.user.findFirst({
      where: { id: doctorId, role: UserRole.DOCTOR, institutionId, isActive: true },
    });
    if (!doctor) throw new NotFoundException('Médico no encontrado o no pertenece a la institución');
    return doctor;
  }

  // ─── Doctor Schedule CRUD ───────────────────────────────────────

  async createOrUpdateSchedule(
    dto: CreateScheduleDto,
    userId: string,
    institutionId: string,
  ) {
    const doctor = await this.assertDoctor(dto.doctorId, institutionId);

    if (this.timeToMinutes(dto.startTime) >= this.timeToMinutes(dto.endTime)) {
      throw new BadRequestException('La hora de inicio debe ser menor a la hora de fin');
    }

    const schedule = await this.prisma.doctorSchedule.upsert({
      where: { doctorId_dayOfWeek: { doctorId: dto.doctorId, dayOfWeek: dto.dayOfWeek } },
      create: {
        doctorId: dto.doctorId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        slotDuration: dto.slotDuration ?? 30,
        institutionId,
      },
      update: {
        startTime: dto.startTime,
        endTime: dto.endTime,
        slotDuration: dto.slotDuration ?? 30,
        isActive: true,
      },
    });

    await this.auditService.log({
      eventType: AuditEventType.SCHEDULE_CREATED,
      userId,
      institutionId,
      entityType: 'DoctorSchedule',
      entityId: schedule.id,
      details: JSON.stringify({
        doctor: `${doctor.firstName} ${doctor.lastName}`,
        dayOfWeek: dto.dayOfWeek,
        time: `${dto.startTime} - ${dto.endTime}`,
      }),
    });

    return schedule;
  }

  async getScheduleByDoctor(doctorId: string, institutionId: string) {
    const schedules = await this.prisma.doctorSchedule.findMany({
      where: { doctorId, institutionId, isActive: true },
      orderBy: { dayOfWeek: 'asc' },
    });
    return schedules;
  }

  async deleteSchedule(id: string, userId: string, institutionId: string) {
    const schedule = await this.prisma.doctorSchedule.findFirst({
      where: { id, institutionId },
    });
    if (!schedule) throw new NotFoundException('Horario no encontrado');

    await this.prisma.doctorSchedule.update({
      where: { id },
      data: { isActive: false },
    });

    await this.auditService.log({
      eventType: AuditEventType.SCHEDULE_DELETED,
      userId,
      institutionId,
      entityType: 'DoctorSchedule',
      entityId: id,
    });

    return { message: 'Horario eliminado' };
  }

  // ─── Time Blocks ────────────────────────────────────────────────

  async createBlock(dto: CreateBlockDto, userId: string, institutionId: string) {
    await this.assertDoctor(dto.doctorId, institutionId);

    if (this.timeToMinutes(dto.startTime) >= this.timeToMinutes(dto.endTime)) {
      throw new BadRequestException('La hora de inicio debe ser menor a la hora de fin');
    }

    // Verificar que no se superponga con citas existentes confirmadas
    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        doctorId: dto.doctorId,
        appointmentDate: new Date(dto.date),
        status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] },
        deletedAt: null,
      },
      include: { patient: true },
    });

    const blockStart = this.timeToMinutes(dto.startTime);
    const blockEnd = this.timeToMinutes(dto.endTime);

    for (const apt of existingAppointments) {
      const aptStart = this.timeToMinutes(apt.startTime);
      const aptEnd = this.timeToMinutes(apt.endTime);
      if (aptStart < blockEnd && aptEnd > blockStart) {
        throw new ConflictException(
          `Existe una cita programada con ${apt.patient.firstName} ${apt.patient.lastName} a las ${apt.startTime}. Cancele la cita primero.`,
        );
      }
    }

    const block = await this.prisma.timeBlock.create({
      data: {
        doctorId: dto.doctorId,
        date: new Date(dto.date),
        startTime: dto.startTime,
        endTime: dto.endTime,
        reason: dto.reason,
        institutionId,
      },
    });

    await this.auditService.log({
      eventType: AuditEventType.BLOCK_CREATED,
      userId,
      institutionId,
      entityType: 'TimeBlock',
      entityId: block.id,
      details: JSON.stringify({ date: dto.date, time: `${dto.startTime}-${dto.endTime}`, reason: dto.reason }),
    });

    return block;
  }

  async getBlocksByDoctor(doctorId: string, institutionId: string, fromDate?: string) {
    const where: any = { doctorId, institutionId };
    if (fromDate) {
      where.date = { gte: new Date(fromDate) };
    }
    return this.prisma.timeBlock.findMany({
      where,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }

  async deleteBlock(id: string, userId: string, institutionId: string) {
    const block = await this.prisma.timeBlock.findFirst({ where: { id, institutionId } });
    if (!block) throw new NotFoundException('Bloqueo no encontrado');

    await this.prisma.timeBlock.delete({ where: { id } });

    await this.auditService.log({
      eventType: AuditEventType.BLOCK_DELETED,
      userId,
      institutionId,
      entityType: 'TimeBlock',
      entityId: id,
    });

    return { message: 'Bloqueo eliminado' };
  }

  // ─── Availability Slots ─────────────────────────────────────────

  /**
   * Retorna los slots de disponibilidad de un médico en una fecha dada.
   * Estado: FREE | BOOKED | BLOCKED
   */
  async getAvailabilitySlots(
    doctorId: string,
    dateStr: string,
    institutionId: string,
  ) {
    // Para getDay() se parsea localmente (new Date('YYYY-MM-DD') = UTC midnight → día incorrecto en UTC-5)
    const [py, pm, pd] = dateStr.split('-').map(Number);
    const localDate = new Date(py, pm - 1, pd);
    const dayOfWeek = localDate.getDay(); // 0=Dom, coincide con nuestro campo dayOfWeek
    // Para queries a la BD usamos UTC midnight (consistente con cómo se almacena)
    const date = new Date(dateStr);

    // 1. Horario laboral del médico ese día
    const schedule = await this.prisma.doctorSchedule.findFirst({
      where: { doctorId, dayOfWeek, isActive: true },
    });

    if (!schedule) {
      return {
        doctorId,
        date: dateStr,
        dayOfWeek,
        hasSchedule: false,
        slots: [],
        message: 'El médico no trabaja ese día',
      };
    }

    // 2. Citas existentes ese día
    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        appointmentDate: date,
        status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] },
        deletedAt: null,
      },
      include: { patient: { select: { firstName: true, lastName: true } } },
    });

    // 3. Bloqueos ese día
    const blocks = await this.prisma.timeBlock.findMany({
      where: { doctorId, date },
    });

    // 4. Generar slots
    const slots: Array<{
      time: string;
      endTime: string;
      status: SlotStatus;
      appointmentId?: string;
      patientName?: string;
      reason?: string;
      blockReason?: string;
    }> = [];

    const slotDuration = schedule.slotDuration;
    const scheduleStart = this.timeToMinutes(schedule.startTime);
    const scheduleEnd = this.timeToMinutes(schedule.endTime);

    for (let t = scheduleStart; t + slotDuration <= scheduleEnd; t += slotDuration) {
      const slotStart = t;
      const slotEnd = t + slotDuration;
      const timeStr = this.minutesToTime(slotStart);
      const endTimeStr = this.minutesToTime(slotEnd);

      // ¿Está bloqueado?
      const block = blocks.find(
        (b) =>
          this.timeToMinutes(b.startTime) <= slotStart &&
          this.timeToMinutes(b.endTime) >= slotEnd,
      );

      if (block) {
        slots.push({ time: timeStr, endTime: endTimeStr, status: SlotStatus.BLOCKED, blockReason: block.reason ?? undefined });
        continue;
      }

      // ¿Tiene cita?
      const apt = appointments.find(
        (a) =>
          this.timeToMinutes(a.startTime) <= slotStart &&
          this.timeToMinutes(a.endTime) >= slotEnd,
      );

      if (apt) {
        slots.push({
          time: timeStr,
          endTime: endTimeStr,
          status: SlotStatus.BOOKED,
          appointmentId: apt.id,
          patientName: `${apt.patient.firstName} ${apt.patient.lastName}`,
          reason: apt.reason ?? undefined,
        });
        continue;
      }

      slots.push({ time: timeStr, endTime: endTimeStr, status: SlotStatus.FREE });
    }

    return {
      doctorId,
      date: dateStr,
      dayOfWeek,
      hasSchedule: true,
      scheduleStart: schedule.startTime,
      scheduleEnd: schedule.endTime,
      slotDuration,
      slots,
      summary: {
        total: slots.length,
        free: slots.filter((s) => s.status === SlotStatus.FREE).length,
        booked: slots.filter((s) => s.status === SlotStatus.BOOKED).length,
        blocked: slots.filter((s) => s.status === SlotStatus.BLOCKED).length,
      },
    };
  }

  // ─── Recurring Appointments ─────────────────────────────────────

  async createRecurringAppointment(
    dto: CreateRecurringAppointmentDto,
    userId: string,
    institutionId: string,
  ) {
    // Verificar doctor y paciente existen
    const doctor = await this.prisma.user.findFirst({
      where: { id: dto.doctorId, role: UserRole.DOCTOR, isActive: true },
    });
    if (!doctor) throw new NotFoundException('Médico no encontrado');

    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, deletedAt: null },
    });
    if (!patient) throw new NotFoundException('Paciente no encontrado');

    if (dto.endDate && new Date(dto.startDate) >= new Date(dto.endDate)) {
      throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha fin');
    }

    // Crear el registro de recurrencia
    const recurring = await this.prisma.recurringAppointment.create({
      data: {
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        frequency: dto.frequency,
        reason: dto.reason,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        institutionId,
      },
    });

    // Generar citas individuales en el rango
    const generatedAppointments = await this.generateRecurringInstances(
      recurring.id,
      dto,
      patient.institutionId,
    );

    await this.auditService.log({
      eventType: AuditEventType.RECURRING_APPOINTMENT_CREATED,
      userId,
      institutionId,
      entityType: 'RecurringAppointment',
      entityId: recurring.id,
      details: JSON.stringify({
        patient: `${patient.firstName} ${patient.lastName}`,
        doctor: `${doctor.firstName} ${doctor.lastName}`,
        frequency: dto.frequency,
        generated: generatedAppointments.length,
      }),
    });

    return { recurring, generatedAppointments };
  }

  private async generateRecurringInstances(
    recurringId: string,
    dto: CreateRecurringAppointmentDto,
    patientInstitutionId: string,
  ) {
    // Parsear localmente para evitar desfase UTC
    const [sy, sm, sd] = dto.startDate.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd);
    const endSrc = dto.endDate ?? dto.startDate;
    const [ey, em, ed] = endSrc.split('-').map(Number);
    const end = new Date(ey, em - 1, ed);
    if (!dto.endDate) {
      end.setMonth(end.getMonth() + 3); // Por defecto 3 meses
    }

    // Avanzar hasta el primer día de la semana correcto
    const firstOccurrence = new Date(start);
    while (firstOccurrence.getDay() !== dto.dayOfWeek) {
      firstOccurrence.setDate(firstOccurrence.getDate() + 1);
    }

    const stepDays =
      dto.frequency === RecurringFrequency.WEEKLY
        ? 7
        : dto.frequency === RecurringFrequency.BIWEEKLY
        ? 14
        : 30; // MONTHLY (aproximado)

    const created: any[] = [];
    const current = new Date(firstOccurrence);

    while (current <= end) {
      const aptDate = new Date(current);
      aptDate.setHours(0, 0, 0, 0);

      // Crear la cita individual
      const apt = await this.prisma.appointment.create({
        data: {
          patientId: dto.patientId,
          doctorId: dto.doctorId,
          appointmentDate: aptDate,
          startTime: dto.startTime,
          endTime: dto.endTime,
          reason: dto.reason,
          status: AppointmentStatus.SCHEDULED,
          institutionId: patientInstitutionId,
          recurringAppointmentId: recurringId,
        },
      });
      created.push(apt);

      if (dto.frequency === RecurringFrequency.MONTHLY) {
        current.setMonth(current.getMonth() + 1);
      } else {
        current.setDate(current.getDate() + stepDays);
      }
    }

    return created;
  }

  async getRecurringByDoctor(doctorId: string, institutionId: string) {
    return this.prisma.recurringAppointment.findMany({
      where: { doctorId, institutionId, isActive: true },
      include: {
        patient: { select: { firstName: true, lastName: true, documentNumber: true } },
        doctor: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelRecurring(id: string, userId: string, institutionId: string) {
    const recurring = await this.prisma.recurringAppointment.findFirst({
      where: { id, institutionId },
    });
    if (!recurring) throw new NotFoundException('Cita recurrente no encontrada');

    // Cancelar citas futuras generadas
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.prisma.appointment.updateMany({
      where: {
        recurringAppointmentId: id,
        appointmentDate: { gte: today },
        status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] },
      },
      data: { status: AppointmentStatus.CANCELLED },
    });

    await this.prisma.recurringAppointment.update({
      where: { id },
      data: { isActive: false },
    });

    await this.auditService.log({
      eventType: AuditEventType.RECURRING_APPOINTMENT_CANCELLED,
      userId,
      institutionId,
      entityType: 'RecurringAppointment',
      entityId: id,
    });

    return { message: 'Cita recurrente y citas futuras canceladas' };
  }
}
