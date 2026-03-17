import { SHIFT_CONFIG, WEEKLY_HOURS_TARGET, MAX_CONSECUTIVE_SHIFTS } from '../common/shift-config';

export interface AssignmentInput {
  id: string;
  userId: string;
  userName: string;
  assignmentDate: Date;
  shiftType: string;
  hoursWorked: number;
  institutionId: string;
}

export interface ViolationOutput {
  violationType: string;
  severity: 'ERROR' | 'WARNING';
  affectedDate?: Date;
  affectedUserId?: string;
  message: string;
  suggestion?: string;
  institutionId: string;
}

export interface ValidationResult {
  violations: ViolationOutput[];
  isValid: boolean;
  summary: {
    totalErrors: number;
    totalWarnings: number;
    workersWithIssues: string[];
    daysWithCoverageIssues: string[];
  };
}

// Retorna el lunes de la semana ISO dado un Date
function getISOWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0=dom, 1=lun...
  const diff = (day === 0 ? -6 : 1 - day);
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function toDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function runValidationEngine(
  assignments: AssignmentInput[],
  allDatesInPeriod: Date[],
  institutionId: string,
): ValidationResult {
  const violations: ViolationOutput[] = [];

  // ─── VALIDACIÓN 1: Horas semanales ────────────────────────────────────────
  const byWorker = new Map<string, AssignmentInput[]>();
  for (const a of assignments) {
    if (!byWorker.has(a.userId)) byWorker.set(a.userId, []);
    byWorker.get(a.userId)!.push(a);
  }

  for (const [userId, workerAssignments] of byWorker.entries()) {
    const workerName = workerAssignments[0].userName;
    // Agrupar por semana ISO
    const byWeek = new Map<string, { monday: Date; totalHours: number }>();
    for (const a of workerAssignments) {
      if (a.shiftType === 'DAY_OFF') continue;
      const monday = getISOWeekMonday(a.assignmentDate);
      const key = toDateKey(monday);
      if (!byWeek.has(key)) byWeek.set(key, { monday, totalHours: 0 });
      byWeek.get(key)!.totalHours += a.hoursWorked;
    }

    for (const [, week] of byWeek.entries()) {
      if (week.totalHours !== WEEKLY_HOURS_TARGET) {
        const diff = WEEKLY_HOURS_TARGET - week.totalHours;
        const suggestion = diff > 0
          ? `Faltan ${diff}h — agregar turno(s) en esa semana`
          : `Sobran ${Math.abs(diff)}h — quitar o acortar turno(s) en esa semana`;
        violations.push({
          violationType: 'WEEKLY_HOURS',
          severity: 'ERROR',
          affectedDate: week.monday,
          affectedUserId: userId,
          message: `Trabajador ${workerName} tiene ${week.totalHours}h en semana del ${toDateKey(week.monday)} (debe ser exactamente ${WEEKLY_HOURS_TARGET}h)`,
          suggestion,
          institutionId,
        });
      }
    }
  }

  // ─── VALIDACIÓN 2: Máximo turnos consecutivos ─────────────────────────────
  for (const [userId, workerAssignments] of byWorker.entries()) {
    const workerName = workerAssignments[0].userName;
    const sorted = [...workerAssignments].sort(
      (a, b) => a.assignmentDate.getTime() - b.assignmentDate.getTime(),
    );

    let consecutiveCount = 0;
    let streakStart: Date | null = null;
    let lastNonOffDate: Date | null = null;

    for (let i = 0; i < sorted.length; i++) {
      const a = sorted[i];
      if (a.shiftType === 'DAY_OFF') {
        consecutiveCount = 0;
        streakStart = null;
        lastNonOffDate = null;
        continue;
      }

      // Verificar si es día consecutivo al anterior
      if (lastNonOffDate) {
        const dayDiff = Math.round(
          (a.assignmentDate.getTime() - lastNonOffDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (dayDiff === 1) {
          consecutiveCount++;
        } else {
          consecutiveCount = 1;
          streakStart = a.assignmentDate;
        }
      } else {
        consecutiveCount = 1;
        streakStart = a.assignmentDate;
      }

      lastNonOffDate = a.assignmentDate;

      if (consecutiveCount > MAX_CONSECUTIVE_SHIFTS) {
        violations.push({
          violationType: 'MAX_CONSECUTIVE',
          severity: 'ERROR',
          affectedDate: a.assignmentDate,
          affectedUserId: userId,
          message: `${workerName} tiene ${consecutiveCount} turnos consecutivos desde ${toDateKey(streakStart!)} (máximo permitido: ${MAX_CONSECUTIVE_SHIFTS})`,
          suggestion: `Insertar un día libre (DAY_OFF) después del día ${toDateKey(sorted[i - (consecutiveCount - MAX_CONSECUTIVE_SHIFTS)]?.assignmentDate || a.assignmentDate)}`,
          institutionId,
        });
      }
    }
  }

  // ─── VALIDACIÓN 3: Descanso post-noche ───────────────────────────────────
  for (const [userId, workerAssignments] of byWorker.entries()) {
    const workerName = workerAssignments[0].userName;
    const sorted = [...workerAssignments].sort(
      (a, b) => a.assignmentDate.getTime() - b.assignmentDate.getTime(),
    );

    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];

      const dayDiff = Math.round(
        (next.assignmentDate.getTime() - current.assignmentDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (dayDiff !== 1) continue;

      // NIGHT_12H termina a las 07:00 → siguiente debe ser DAY_OFF
      if (current.shiftType === 'NIGHT_12H' && next.shiftType !== 'DAY_OFF') {
        violations.push({
          violationType: 'REST_AFTER_NIGHT',
          severity: 'ERROR',
          affectedDate: next.assignmentDate,
          affectedUserId: userId,
          message: `${workerName} tiene NIGHT_12H el ${toDateKey(current.assignmentDate)} y un turno ${next.shiftType} al día siguiente (debe ser DAY_OFF — turno termina a las 07:00)`,
          suggestion: `Cambiar el turno del ${toDateKey(next.assignmentDate)} a DAY_OFF`,
          institutionId,
        });
      }

      // NIGHT_6H termina a la 01:00 → siguiente NO puede ser MORNING (empieza 07:00 = solo 6h descanso)
      if (current.shiftType === 'NIGHT_6H' && next.shiftType === 'MORNING') {
        violations.push({
          violationType: 'REST_AFTER_NIGHT',
          severity: 'ERROR',
          affectedDate: next.assignmentDate,
          affectedUserId: userId,
          message: `${workerName} tiene NIGHT_6H el ${toDateKey(current.assignmentDate)} (termina 01:00) y MORNING el ${toDateKey(next.assignmentDate)} (empieza 07:00) — solo 6h de descanso`,
          suggestion: `Cambiar el turno del ${toDateKey(next.assignmentDate)} a AFTERNOON, NIGHT_6H, NIGHT_12H o DAY_OFF`,
          institutionId,
        });
      }
    }
  }

  // ─── VALIDACIÓN 4: Cobertura mínima diaria ───────────────────────────────
  const byDay = new Map<string, AssignmentInput[]>();
  for (const a of assignments) {
    const key = toDateKey(a.assignmentDate);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(a);
  }

  const daysWithCoverageIssues: string[] = [];

  for (const dateInPeriod of allDatesInPeriod) {
    const key = toDateKey(dateInPeriod);
    const dayAssignments = byDay.get(key) || [];

    const morningCount = dayAssignments.filter((a) => a.shiftType === 'MORNING').length;
    const afternoonCount = dayAssignments.filter((a) => a.shiftType === 'AFTERNOON').length;
    const nightCount = dayAssignments.filter(
      (a) => a.shiftType === 'NIGHT_6H' || a.shiftType === 'NIGHT_12H',
    ).length;

    const minMorning = SHIFT_CONFIG['MORNING'].minCoverage;   // 3
    const minAfternoon = SHIFT_CONFIG['AFTERNOON'].minCoverage; // 1
    const minNight = SHIFT_CONFIG['NIGHT_6H'].minCoverage;     // 1

    let hasIssue = false;

    if (morningCount < minMorning) {
      hasIssue = true;
      violations.push({
        violationType: 'MIN_COVERAGE',
        severity: 'ERROR',
        affectedDate: dateInPeriod,
        message: `Día ${key}: turno MORNING tiene ${morningCount} persona(s) (mínimo requerido: ${minMorning})`,
        suggestion: `Asignar al menos ${minMorning - morningCount} trabajador(es) más al turno MORNING del día ${key}`,
        institutionId,
      });
    }

    if (afternoonCount < minAfternoon) {
      hasIssue = true;
      violations.push({
        violationType: 'MIN_COVERAGE',
        severity: 'ERROR',
        affectedDate: dateInPeriod,
        message: `Día ${key}: turno AFTERNOON tiene ${afternoonCount} persona(s) (mínimo requerido: ${minAfternoon})`,
        suggestion: `Asignar al menos ${minAfternoon - afternoonCount} trabajador(es) más al turno AFTERNOON del día ${key}`,
        institutionId,
      });
    }

    if (nightCount < minNight) {
      hasIssue = true;
      violations.push({
        violationType: 'MIN_COVERAGE',
        severity: 'ERROR',
        affectedDate: dateInPeriod,
        message: `Día ${key}: cobertura nocturna tiene ${nightCount} persona(s) (mínimo requerido: ${minNight}) — acepta NIGHT_6H o NIGHT_12H`,
        suggestion: `Asignar al menos ${minNight - nightCount} trabajador(es) más al turno nocturno del día ${key}`,
        institutionId,
      });
    }

    if (hasIssue) daysWithCoverageIssues.push(key);
  }

  // ─── VALIDACIÓN 5: Noche duplicada ───────────────────────────────────────
  for (const [userId, workerAssignments] of byWorker.entries()) {
    const workerName = workerAssignments[0].userName;
    const byDayWorker = new Map<string, AssignmentInput[]>();
    for (const a of workerAssignments) {
      const key = toDateKey(a.assignmentDate);
      if (!byDayWorker.has(key)) byDayWorker.set(key, []);
      byDayWorker.get(key)!.push(a);
    }

    for (const [dateKey, dayAssignments] of byDayWorker.entries()) {
      const hasNight6H = dayAssignments.some((a) => a.shiftType === 'NIGHT_6H');
      const hasNight12H = dayAssignments.some((a) => a.shiftType === 'NIGHT_12H');
      if (hasNight6H && hasNight12H) {
        violations.push({
          violationType: 'DUPLICATE_NIGHT',
          severity: 'ERROR',
          affectedDate: dayAssignments[0].assignmentDate,
          affectedUserId: userId,
          message: `${workerName} tiene NIGHT_6H y NIGHT_12H asignados el mismo día ${dateKey}`,
          suggestion: `Eliminar una de las dos asignaciones nocturnas del día ${dateKey}`,
          institutionId,
        });
      }
    }
  }

  // ─── Resumen ──────────────────────────────────────────────────────────────
  const totalErrors = violations.filter((v) => v.severity === 'ERROR').length;
  const totalWarnings = violations.filter((v) => v.severity === 'WARNING').length;
  const workersWithIssues = [...new Set(violations.filter((v) => v.affectedUserId).map((v) => v.affectedUserId!))];

  return {
    violations,
    isValid: totalErrors === 0,
    summary: {
      totalErrors,
      totalWarnings,
      workersWithIssues,
      daysWithCoverageIssues: [...new Set(daysWithCoverageIssues)],
    },
  };
}
