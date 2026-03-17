import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditEventType, UserRole } from '../common/enums';
import { SHIFT_CONFIG } from '../common/shift-config';
import { runValidationEngine, AssignmentInput } from './validation.engine';
import {
  CreateScheduleDto,
  UpdateScheduleDto,
  CreateShiftAssignmentDto,
  BulkAssignDto,
  RejectScheduleDto,
} from './dto/schedule.dto';

@Injectable()
export class SchedulesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  private resolveInstitution(user: any, dto?: { institutionId?: string }): string | null {
    if (user.role === UserRole.SUPER_ADMIN && dto?.institutionId) {
      return dto.institutionId;
    }
    return user.institutionId ?? null;
  }

  private assertDraft(schedule: any) {
    if (schedule.status !== 'DRAFT') {
      throw new BadRequestException(
        'Solo se pueden modificar mallas en estado DRAFT',
      );
    }
  }

  private assertInstitution(schedule: any, institutionId: string | null) {
    if (institutionId && schedule.institutionId !== institutionId) {
      throw new ForbiddenException('Acceso denegado a esta malla');
    }
  }

  // Genera lista de todos los días en un rango
  private getDatesInRange(start: Date, end: Date): Date[] {
    const dates: Date[] = [];
    const current = new Date(start);
    current.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(end);
    endDate.setUTCHours(0, 0, 0, 0);
    while (current <= endDate) {
      dates.push(new Date(current));
      current.setUTCDate(current.getUTCDate() + 1);
    }
    return dates;
  }

  // ─── CREATE ──────────────────────────────────────────────────────────────

  async create(dto: CreateScheduleDto, user: any) {
    const institutionId = this.resolveInstitution(user, dto);
    if (!institutionId) {
      throw new BadRequestException('Se requiere institutionId para crear una malla');
    }
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    if (end < start) {
      throw new BadRequestException('La fecha de fin debe ser posterior a la de inicio');
    }

    const schedule = await this.prisma.workSchedule.create({
      data: {
        name: dto.name,
        periodType: dto.periodType,
        startDate: start,
        endDate: end,
        notes: dto.notes,
        status: 'DRAFT',
        institutionId,
        createdById: user.id,
      },
    });

    await this.auditService.log({
      eventType: AuditEventType.WORK_SCHEDULE_CREATED,
      userId: user.id,
      institutionId,
      entityType: 'WorkSchedule',
      entityId: schedule.id,
      details: { name: dto.name, periodType: dto.periodType },
    });

    return schedule;
  }

  // ─── FIND ALL ────────────────────────────────────────────────────────────

  async findAll(user: any) {
    const institutionId = this.resolveInstitution(user);
    const where: any = institutionId ? { institutionId } : {};

    const schedules = await this.prisma.workSchedule.findMany({
      where,
      select: {
        id: true,
        name: true,
        periodType: true,
        startDate: true,
        endDate: true,
        status: true,
        version: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { assignments: true, violations: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return schedules;
  }

  // ─── FIND ONE ────────────────────────────────────────────────────────────

  async findOne(id: string, user: any) {
    const institutionId = this.resolveInstitution(user);
    const schedule = await this.prisma.workSchedule.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
        assignments: {
          orderBy: [{ userId: 'asc' }, { assignmentDate: 'asc' }],
          include: {
            user: { select: { id: true, firstName: true, lastName: true, role: true } },
          },
        },
        violations: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!schedule) throw new NotFoundException('Malla no encontrada');
    if (user.role !== UserRole.SUPER_ADMIN) {
      this.assertInstitution(schedule, institutionId);
    }

    return schedule;
  }

  // ─── UPDATE ──────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateScheduleDto, user: any) {
    const institutionId = this.resolveInstitution(user);
    const schedule = await this.prisma.workSchedule.findUnique({ where: { id } });
    if (!schedule) throw new NotFoundException('Malla no encontrada');
    if (user.role !== UserRole.SUPER_ADMIN) this.assertInstitution(schedule, institutionId);
    this.assertDraft(schedule);

    const updated = await this.prisma.workSchedule.update({
      where: { id },
      data: dto,
    });

    await this.auditService.log({
      eventType: AuditEventType.WORK_SCHEDULE_UPDATED,
      userId: user.id,
      institutionId: institutionId || schedule.institutionId,
      entityType: 'WorkSchedule',
      entityId: id,
      details: dto,
    });

    return updated;
  }

  // ─── DELETE ──────────────────────────────────────────────────────────────

  async remove(id: string, user: any) {
    const institutionId = this.resolveInstitution(user);
    const schedule = await this.prisma.workSchedule.findUnique({ where: { id } });
    if (!schedule) throw new NotFoundException('Malla no encontrada');
    if (user.role !== UserRole.SUPER_ADMIN) this.assertInstitution(schedule, institutionId);
    this.assertDraft(schedule);

    await this.prisma.workSchedule.delete({ where: { id } });

    await this.auditService.log({
      eventType: AuditEventType.WORK_SCHEDULE_DELETED,
      userId: user.id,
      institutionId: institutionId || schedule.institutionId,
      entityType: 'WorkSchedule',
      entityId: id,
    });

    return { message: 'Malla eliminada' };
  }

  // ─── BULK ASSIGN ─────────────────────────────────────────────────────────

  async bulkAssign(scheduleId: string, dto: BulkAssignDto, user: any) {
    const institutionId = this.resolveInstitution(user);
    const schedule = await this.prisma.workSchedule.findUnique({ where: { id: scheduleId } });
    if (!schedule) throw new NotFoundException('Malla no encontrada');
    if (user.role !== UserRole.SUPER_ADMIN) this.assertInstitution(schedule, institutionId);
    this.assertDraft(schedule);

    const created: any[] = [];
    for (const a of dto.assignments) {
      const config = SHIFT_CONFIG[a.shiftType];
      const hoursWorked = config?.durationHours ?? 0;

      const assignment = await this.prisma.shiftAssignment.upsert({
        where: {
          scheduleId_userId_assignmentDate: {
            scheduleId,
            userId: a.userId,
            assignmentDate: new Date(a.assignmentDate),
          },
        },
        update: {
          shiftType: a.shiftType,
          hoursWorked,
          startTime: a.startTime ?? null,
          endTime: a.endTime ?? null,
          notes: a.notes,
        },
        create: {
          scheduleId,
          userId: a.userId,
          assignmentDate: new Date(a.assignmentDate),
          shiftType: a.shiftType,
          hoursWorked,
          startTime: a.startTime ?? null,
          endTime: a.endTime ?? null,
          notes: a.notes,
          institutionId: institutionId || schedule.institutionId,
        },
      });
      created.push(assignment);
    }

    await this.auditService.log({
      eventType: AuditEventType.ASSIGNMENT_CREATED,
      userId: user.id,
      institutionId: institutionId || schedule.institutionId,
      entityType: 'WorkSchedule',
      entityId: scheduleId,
      details: { count: created.length },
    });

    return { created: created.length, assignments: created };
  }

  // ─── UPDATE ASSIGNMENT ───────────────────────────────────────────────────

  async updateAssignment(
    scheduleId: string,
    assignmentId: string,
    dto: CreateShiftAssignmentDto,
    user: any,
  ) {
    const institutionId = this.resolveInstitution(user);
    const schedule = await this.prisma.workSchedule.findUnique({ where: { id: scheduleId } });
    if (!schedule) throw new NotFoundException('Malla no encontrada');
    if (user.role !== UserRole.SUPER_ADMIN) this.assertInstitution(schedule, institutionId);
    this.assertDraft(schedule);

    const config = SHIFT_CONFIG[dto.shiftType];
    const hoursWorked = config?.durationHours ?? 0;

    const assignment = await this.prisma.shiftAssignment.update({
      where: { id: assignmentId },
      data: { shiftType: dto.shiftType, hoursWorked, notes: dto.notes },
    });

    await this.auditService.log({
      eventType: AuditEventType.ASSIGNMENT_UPDATED,
      userId: user.id,
      institutionId: institutionId || schedule.institutionId,
      entityType: 'ShiftAssignment',
      entityId: assignmentId,
      details: { shiftType: dto.shiftType },
    });

    return assignment;
  }

  // ─── DELETE ASSIGNMENT ───────────────────────────────────────────────────

  async removeAssignment(scheduleId: string, assignmentId: string, user: any) {
    const institutionId = this.resolveInstitution(user);
    const schedule = await this.prisma.workSchedule.findUnique({ where: { id: scheduleId } });
    if (!schedule) throw new NotFoundException('Malla no encontrada');
    if (user.role !== UserRole.SUPER_ADMIN) this.assertInstitution(schedule, institutionId);
    this.assertDraft(schedule);

    await this.prisma.shiftAssignment.delete({ where: { id: assignmentId } });

    await this.auditService.log({
      eventType: AuditEventType.ASSIGNMENT_DELETED,
      userId: user.id,
      institutionId: institutionId || schedule.institutionId,
      entityType: 'ShiftAssignment',
      entityId: assignmentId,
    });

    return { message: 'Asignación eliminada' };
  }

  // ─── VALIDATE ────────────────────────────────────────────────────────────

  async validate(scheduleId: string, user: any) {
    const institutionId = this.resolveInstitution(user);
    const schedule = await this.prisma.workSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        assignments: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });

    if (!schedule) throw new NotFoundException('Malla no encontrada');
    if (user.role !== UserRole.SUPER_ADMIN) this.assertInstitution(schedule, institutionId);

    // Mapear asignaciones al formato del motor
    const inputs: AssignmentInput[] = schedule.assignments.map((a) => ({
      id: a.id,
      userId: a.userId,
      userName: `${a.user.firstName} ${a.user.lastName}`,
      assignmentDate: new Date(a.assignmentDate),
      shiftType: a.shiftType,
      hoursWorked: a.hoursWorked,
      institutionId: a.institutionId,
    }));

    const allDates = this.getDatesInRange(schedule.startDate, schedule.endDate);
    const result = runValidationEngine(inputs, allDates, institutionId || schedule.institutionId);

    // Limpiar violaciones previas y guardar nuevas
    await this.prisma.scheduleViolation.deleteMany({ where: { scheduleId } });

    if (result.violations.length > 0) {
      await this.prisma.scheduleViolation.createMany({
        data: result.violations.map((v) => ({
          scheduleId,
          violationType: v.violationType,
          severity: v.severity,
          affectedDate: v.affectedDate,
          affectedUserId: v.affectedUserId,
          message: v.message,
          suggestion: v.suggestion,
          institutionId: v.institutionId,
        })),
      });
    }

    await this.auditService.log({
      eventType: AuditEventType.WORK_SCHEDULE_VALIDATED,
      userId: user.id,
      institutionId: institutionId || schedule.institutionId,
      entityType: 'WorkSchedule',
      entityId: scheduleId,
      details: { totalErrors: result.summary.totalErrors, isValid: result.isValid },
    });

    return result;
  }

  // ─── SUBMIT ──────────────────────────────────────────────────────────────

  async submit(scheduleId: string, user: any) {
    const institutionId = this.resolveInstitution(user);
    const schedule = await this.prisma.workSchedule.findUnique({ where: { id: scheduleId } });
    if (!schedule) throw new NotFoundException('Malla no encontrada');
    if (user.role !== UserRole.SUPER_ADMIN) this.assertInstitution(schedule, institutionId);

    if (schedule.status !== 'DRAFT') {
      throw new BadRequestException('Solo se pueden enviar mallas en estado DRAFT');
    }

    // Validar que tenga asignaciones
    const assignmentCount = await this.prisma.shiftAssignment.count({ where: { scheduleId } });
    if (assignmentCount === 0) {
      throw new BadRequestException(
        'No se puede enviar una malla sin asignaciones de turnos. Asigna turnos al personal antes de enviar.',
      );
    }

    // Validar que no tenga errores graves de validación pendientes
    const errorCount = await this.prisma.scheduleViolation.count({
      where: { scheduleId, severity: 'ERROR' },
    });
    if (errorCount > 0) {
      throw new BadRequestException(
        `La malla tiene ${errorCount} error(es) de validación. Corrígelos y vuelve a validar antes de enviar.`,
      );
    }

    const updated = await this.prisma.workSchedule.update({
      where: { id: scheduleId },
      data: { status: 'PENDING_APPROVAL' },
    });

    await this.auditService.log({
      eventType: AuditEventType.WORK_SCHEDULE_SUBMITTED,
      userId: user.id,
      institutionId: institutionId || schedule.institutionId,
      entityType: 'WorkSchedule',
      entityId: scheduleId,
    });

    return updated;
  }

  // ─── APPROVE ─────────────────────────────────────────────────────────────

  async approve(scheduleId: string, user: any) {
    const institutionId = this.resolveInstitution(user);
    const schedule = await this.prisma.workSchedule.findUnique({ where: { id: scheduleId } });
    if (!schedule) throw new NotFoundException('Malla no encontrada');
    if (user.role !== UserRole.SUPER_ADMIN) this.assertInstitution(schedule, institutionId);

    if (schedule.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Solo se pueden aprobar mallas en estado PENDING_APPROVAL');
    }

    // Validar que tenga asignaciones
    const assignmentCount = await this.prisma.shiftAssignment.count({ where: { scheduleId } });
    if (assignmentCount === 0) {
      throw new BadRequestException(
        'No se puede aprobar una malla sin asignaciones de turnos.',
      );
    }

    // Bloquear aprobación si tiene errores de validación
    const errorCount = await this.prisma.scheduleViolation.count({
      where: { scheduleId, severity: 'ERROR' },
    });
    if (errorCount > 0) {
      throw new BadRequestException(
        `La malla tiene ${errorCount} error(es) de validación sin resolver. No puede aprobarse.`,
      );
    }

    const updated = await this.prisma.workSchedule.update({
      where: { id: scheduleId },
      data: { status: 'APPROVED', approvedById: user.id, approvedAt: new Date() },
    });

    await this.auditService.log({
      eventType: AuditEventType.WORK_SCHEDULE_APPROVED,
      userId: user.id,
      institutionId: institutionId || schedule.institutionId,
      entityType: 'WorkSchedule',
      entityId: scheduleId,
    });

    return updated;
  }

  // ─── REJECT ──────────────────────────────────────────────────────────────

  async reject(scheduleId: string, dto: RejectScheduleDto, user: any) {
    const institutionId = this.resolveInstitution(user);
    const schedule = await this.prisma.workSchedule.findUnique({ where: { id: scheduleId } });
    if (!schedule) throw new NotFoundException('Malla no encontrada');
    if (user.role !== UserRole.SUPER_ADMIN) this.assertInstitution(schedule, institutionId);

    if (schedule.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Solo se pueden rechazar mallas en estado PENDING_APPROVAL');
    }

    const updated = await this.prisma.workSchedule.update({
      where: { id: scheduleId },
      data: { status: 'REJECTED', rejectReason: dto.reason },
    });

    await this.auditService.log({
      eventType: AuditEventType.WORK_SCHEDULE_REJECTED,
      userId: user.id,
      institutionId: institutionId || schedule.institutionId,
      entityType: 'WorkSchedule',
      entityId: scheduleId,
      details: { reason: dto.reason },
    });

    return updated;
  }

  // ─── GET VIOLATIONS ──────────────────────────────────────────────────────

  async getViolations(scheduleId: string, user: any) {
    const institutionId = this.resolveInstitution(user);
    const schedule = await this.prisma.workSchedule.findUnique({ where: { id: scheduleId } });
    if (!schedule) throw new NotFoundException('Malla no encontrada');
    if (user.role !== UserRole.SUPER_ADMIN) this.assertInstitution(schedule, institutionId);

    return this.prisma.scheduleViolation.findMany({
      where: { scheduleId },
      orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
    });
  }

  // ─── GET SUMMARY ─────────────────────────────────────────────────────────

  async getSummary(scheduleId: string, user: any) {
    const institutionId = this.resolveInstitution(user);
    const schedule = await this.prisma.workSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        assignments: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
        violations: true,
      },
    });

    if (!schedule) throw new NotFoundException('Malla no encontrada');
    if (user.role !== UserRole.SUPER_ADMIN) this.assertInstitution(schedule, institutionId);

    // Horas por trabajador (total período)
    const workerHours = new Map<string, { name: string; totalHours: number }>();
    for (const a of schedule.assignments) {
      if (!workerHours.has(a.userId)) {
        workerHours.set(a.userId, {
          name: `${a.user.firstName} ${a.user.lastName}`,
          totalHours: 0,
        });
      }
      workerHours.get(a.userId)!.totalHours += a.hoursWorked;
    }

    // Cobertura por día
    const coverageByDay = new Map<string, { morning: number; afternoon: number; night: number }>();
    const allDates = this.getDatesInRange(schedule.startDate, schedule.endDate);
    for (const d of allDates) {
      const key = d.toISOString().split('T')[0];
      coverageByDay.set(key, { morning: 0, afternoon: 0, night: 0 });
    }
    for (const a of schedule.assignments) {
      const key = new Date(a.assignmentDate).toISOString().split('T')[0];
      const entry = coverageByDay.get(key);
      if (!entry) continue;
      if (a.shiftType === 'MORNING') entry.morning++;
      else if (a.shiftType === 'AFTERNOON') entry.afternoon++;
      else if (a.shiftType === 'NIGHT_6H' || a.shiftType === 'NIGHT_12H') entry.night++;
    }

    return {
      schedule: {
        id: schedule.id,
        name: schedule.name,
        status: schedule.status,
        periodType: schedule.periodType,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
      },
      workerHours: Array.from(workerHours.entries()).map(([id, v]) => ({ userId: id, ...v })),
      coverageByDay: Array.from(coverageByDay.entries()).map(([date, v]) => ({ date, ...v })),
      violations: {
        total: schedule.violations.length,
        errors: schedule.violations.filter((v) => v.severity === 'ERROR').length,
        warnings: schedule.violations.filter((v) => v.severity === 'WARNING').length,
      },
    };
  }
}
