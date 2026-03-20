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
  GenerateScheduleDto,
  MarkAbsenceDto,
  CreatePeakHourConfigDto,
  UpdatePeakHourConfigDto,
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

  // ─── GENERATE (Auto-generator de malla mensual) ────────────────────────────────

  async generate(scheduleId: string, dto: GenerateScheduleDto, user: any) {
    const institutionId = this.resolveInstitution(user);
    const schedule = await this.prisma.workSchedule.findUnique({ where: { id: scheduleId } });
    if (!schedule) throw new NotFoundException('Malla no encontrada');
    if (user.role !== UserRole.SUPER_ADMIN) this.assertInstitution(schedule, institutionId);
    this.assertDraft(schedule);

    const instId = institutionId || schedule.institutionId;

    // 1. Obtener trabajadores activos de la institución
    const baseWhere: any = { institutionId: instId, isActive: true, deletedAt: null };
    if (dto.userIds?.length) baseWhere.id = { in: dto.userIds };

    const workers = await this.prisma.user.findMany({
      where: baseWhere,
      select: { id: true, firstName: true, lastName: true, role: true },
      orderBy: { id: 'asc' },
    });

    if (workers.length === 0) {
      throw new BadRequestException('No hay trabajadores activos para generar la malla');
    }

    // 2. Turno dominante del mes anterior para garantizar rotación
    const previousDominant: Record<string, string> = {};
    if (dto.considerPreviousMonth !== false) {
      const prevEnd = new Date(schedule.startDate);
      prevEnd.setUTCDate(prevEnd.getUTCDate() - 1);
      const prevStart = new Date(prevEnd);
      prevStart.setUTCDate(1);

      const prevAssignments = await this.prisma.shiftAssignment.findMany({
        where: {
          institutionId: instId,
          assignmentDate: { gte: prevStart, lte: prevEnd },
          shiftType: { not: 'DAY_OFF' },
          absenceType: null,
        },
        select: { userId: true, shiftType: true },
      });

      const freq: Record<string, Record<string, number>> = {};
      for (const a of prevAssignments) {
        if (!freq[a.userId]) freq[a.userId] = {};
        freq[a.userId][a.shiftType] = (freq[a.userId][a.shiftType] || 0) + 1;
      }
      for (const [uid, counts] of Object.entries(freq)) {
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        if (sorted.length > 0) previousDominant[uid] = sorted[0][0];
      }
    }

    // 3. Asignar grupos de rotación (M / T / N / MT)
    const rotationOrder = ['MORNING', 'AFTERNOON', 'NIGHT_12H', 'SPECIAL'] as const;
    const workerGroupIndex: Record<string, number> = {};
    for (let i = 0; i < workers.length; i++) {
      const prev = previousDominant[workers[i].id];
      if (prev) {
        const prevIdx = rotationOrder.indexOf(prev as any);
        workerGroupIndex[workers[i].id] = prevIdx !== -1 ? (prevIdx + 1) % 4 : i % 4;
      } else {
        workerGroupIndex[workers[i].id] = i % 4;
      }
    }

    // 4. Dividir el período en semanas de 7 días
    const allDates = this.getDatesInRange(schedule.startDate, schedule.endDate);
    const weeks: Date[][] = [];
    for (let i = 0; i < allDates.length; i += 7) {
      weeks.push(allDates.slice(i, Math.min(i + 7, allDates.length)));
    }

    // 5. Generar asignaciones para cada trabajador y cada semana
    const toCreate: any[] = [];
    for (let workerIdx = 0; workerIdx < workers.length; workerIdx++) {
      const worker = workers[workerIdx];
      const groupBase = workerGroupIndex[worker.id];
      for (let weekIdx = 0; weekIdx < weeks.length; weekIdx++) {
        const week = weeks[weekIdx];
        const shiftType = rotationOrder[(groupBase + weekIdx) % 4];
        const seed = (workerIdx + weekIdx * 3) % week.length;
        const dayAssignments = this.buildWeekAssignments(shiftType, week, seed);
        for (const da of dayAssignments) {
          const config = SHIFT_CONFIG[da.shift];
          toCreate.push({
            scheduleId,
            userId: worker.id,
            assignmentDate: da.date,
            shiftType: da.shift,
            hoursWorked: config?.durationHours ?? 0,
            startTime: config?.startTime || null,
            endTime: config?.endTime || null,
            institutionId: instId,
          });
        }
      }
    }

    // 6. Eliminar asignaciones previas que no sean ausencias marcadas
    await this.prisma.shiftAssignment.deleteMany({
      where: { scheduleId, absenceType: null },
    });

    // 7. Insertar nuevas asignaciones en bloque
    await this.prisma.shiftAssignment.createMany({
      data: toCreate,
      skipDuplicates: true,
    });

    await this.auditService.log({
      eventType: AuditEventType.WORK_SCHEDULE_UPDATED,
      userId: user.id,
      institutionId: instId,
      entityType: 'WorkSchedule',
      entityId: scheduleId,
      details: { action: 'AUTO_GENERATED', workers: workers.length, assignments: toCreate.length },
    });

    return { generated: toCreate.length, workers: workers.length };
  }

  // Construye el patrón de turnos para una semana dado un tipo de turno
  private buildWeekAssignments(
    shiftType: string,
    week: Date[],
    seed: number,
  ): Array<{ date: Date; shift: string }> {
    const len = week.length;
    const pattern: string[] = new Array(len).fill('DAY_OFF');

    if (shiftType === 'MORNING' || shiftType === 'AFTERNOON') {
      // 6h × 6 días = 36h, 1 día libre
      const offIdx = seed % len;
      for (let i = 0; i < len; i++) {
        pattern[i] = i === offIdx ? 'DAY_OFF' : shiftType;
      }
    } else {
      // NIGHT_12H o SPECIAL (MT): 12h × 3 turnos = 36h
      // Patrón: turno, descanso, turno, descanso, turno, descanso, libre
      const startOffset = seed % 2;
      let workCount = 0;
      for (let i = startOffset; i < len && workCount < 3; i += 2) {
        pattern[i] = shiftType;
        workCount++;
      }
    }

    return week.map((date, i) => ({ date, shift: pattern[i] }));
  }

  // ─── MARK ABSENCE ───────────────────────────────────────────────

  async markAbsence(
    scheduleId: string,
    assignmentId: string,
    dto: MarkAbsenceDto,
    user: any,
  ) {
    const institutionId = this.resolveInstitution(user);
    const schedule = await this.prisma.workSchedule.findUnique({ where: { id: scheduleId } });
    if (!schedule) throw new NotFoundException('Malla no encontrada');
    if (user.role !== UserRole.SUPER_ADMIN) this.assertInstitution(schedule, institutionId);
    this.assertDraft(schedule);

    const assignment = await this.prisma.shiftAssignment.findFirst({
      where: { id: assignmentId, scheduleId },
    });
    if (!assignment) throw new NotFoundException('Asignación no encontrada');

    const updated = await this.prisma.shiftAssignment.update({
      where: { id: assignmentId },
      data: {
        absenceType: dto.absenceType,
        absenceNotes: dto.absenceNotes ?? null,
      },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });

    await this.auditService.log({
      eventType: AuditEventType.ASSIGNMENT_UPDATED,
      userId: user.id,
      institutionId: institutionId || schedule.institutionId,
      entityType: 'ShiftAssignment',
      entityId: assignmentId,
      details: { absenceType: dto.absenceType },
    });

    return updated;
  }

  async removeAbsence(scheduleId: string, assignmentId: string, user: any) {
    const institutionId = this.resolveInstitution(user);
    const schedule = await this.prisma.workSchedule.findUnique({ where: { id: scheduleId } });
    if (!schedule) throw new NotFoundException('Malla no encontrada');
    if (user.role !== UserRole.SUPER_ADMIN) this.assertInstitution(schedule, institutionId);
    this.assertDraft(schedule);

    return this.prisma.shiftAssignment.update({
      where: { id: assignmentId },
      data: { absenceType: null, absenceNotes: null },
    });
  }

  // ─── PEAK HOURS CRUD ─────────────────────────────────────────────

  async getPeakHours(serviceId: string | undefined, user: any) {
    const institutionId = this.resolveInstitution(user);
    const where: any = {};
    if (institutionId) where.institutionId = institutionId;
    if (serviceId) where.serviceId = serviceId;
    return this.prisma.peakHourConfig.findMany({
      where,
      include: { service: { select: { id: true, name: true } } },
      orderBy: { startTime: 'asc' },
    });
  }

  async createPeakHour(dto: CreatePeakHourConfigDto, user: any) {
    const institutionId = this.resolveInstitution(user, dto);
    if (!institutionId) throw new BadRequestException('Se requiere institutionId');
    return this.prisma.peakHourConfig.create({
      data: {
        serviceId: dto.serviceId,
        institutionId,
        label: dto.label,
        startTime: dto.startTime,
        endTime: dto.endTime,
        minStaff: dto.minStaff,
        daysOfWeek: dto.daysOfWeek ?? null,
        isActive: true,
      },
    });
  }

  async updatePeakHour(id: string, dto: UpdatePeakHourConfigDto, user: any) {
    const institutionId = this.resolveInstitution(user);
    const config = await this.prisma.peakHourConfig.findUnique({ where: { id } });
    if (!config) throw new NotFoundException('Configuración de horas pico no encontrada');
    if (institutionId && config.institutionId !== institutionId) throw new ForbiddenException('Acceso denegado');
    return this.prisma.peakHourConfig.update({ where: { id }, data: dto });
  }

  async deletePeakHour(id: string, user: any) {
    const institutionId = this.resolveInstitution(user);
    const config = await this.prisma.peakHourConfig.findUnique({ where: { id } });
    if (!config) throw new NotFoundException('Configuración de horas pico no encontrada');
    if (institutionId && config.institutionId !== institutionId) throw new ForbiddenException('Acceso denegado');
    await this.prisma.peakHourConfig.delete({ where: { id } });
    return { message: 'Configuración eliminada' };
  }
}
