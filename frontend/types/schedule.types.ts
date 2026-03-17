export type ScheduleStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'ARCHIVED';

export type PeriodType = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'CUSTOM';

export type ShiftType =
  | 'MORNING'
  | 'AFTERNOON'
  | 'NIGHT_6H'
  | 'NIGHT_12H'
  | 'DAY_OFF'
  | 'SPECIAL';

export type ViolationType =
  | 'WEEKLY_HOURS'
  | 'MAX_CONSECUTIVE'
  | 'REST_AFTER_NIGHT'
  | 'MIN_COVERAGE'
  | 'DUPLICATE_NIGHT';

export type ViolationSeverity = 'ERROR' | 'WARNING';

export interface WorkSchedule {
  id: string;
  name: string;
  periodType: PeriodType;
  startDate: string;
  endDate: string;
  status: ScheduleStatus;
  version: number;
  notes?: string;
  rejectReason?: string;
  institutionId: string;
  createdById: string;
  approvedById?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; firstName: string; lastName: string };
  approvedBy?: { id: string; firstName: string; lastName: string };
  assignments?: ShiftAssignment[];
  violations?: ScheduleViolation[];
  _count?: { assignments: number; violations: number };
}

export interface ShiftAssignment {
  id: string;
  scheduleId: string;
  userId: string;
  assignmentDate: string;
  shiftType: ShiftType;
  startTime?: string;
  endTime?: string;
  hoursWorked: number;
  notes?: string;
  institutionId: string;
  user?: { id: string; firstName: string; lastName: string; role: string };
}

export interface ScheduleViolation {
  id: string;
  scheduleId: string;
  violationType: ViolationType;
  severity: ViolationSeverity;
  affectedDate?: string;
  affectedUserId?: string;
  message: string;
  suggestion?: string;
  institutionId: string;
  createdAt: string;
}

export interface ScheduleSummary {
  schedule: {
    id: string;
    name: string;
    status: ScheduleStatus;
    periodType: PeriodType;
    startDate: string;
    endDate: string;
  };
  workerHours: Array<{ userId: string; name: string; totalHours: number }>;
  coverageByDay: Array<{ date: string; morning: number; afternoon: number; night: number }>;
  violations: { total: number; errors: number; warnings: number };
}

export interface ValidationResult {
  isValid: boolean;
  violations: ScheduleViolation[];
  summary: {
    totalErrors: number;
    totalWarnings: number;
    weeklyHoursDeviations: number;
    consecutiveViolations: number;
    restViolations: number;
    coverageViolations: number;
    duplicateNightViolations: number;
  };
}

export interface CreateScheduleDto {
  name: string;
  periodType: PeriodType;
  startDate: string;
  endDate: string;
  notes?: string;
  institutionId?: string;
}

export interface BulkAssignDto {
  assignments: Array<{
    userId: string;
    assignmentDate: string;
    shiftType: ShiftType;
    startTime?: string;
    endTime?: string;
    notes?: string;
  }>;
}

export const SHIFT_LABELS: Record<ShiftType, string> = {
  MORNING: 'Mañana',
  AFTERNOON: 'Tarde',
  NIGHT_6H: 'Noche 6h',
  NIGHT_12H: 'Noche 12h',
  DAY_OFF: 'Descanso',
  SPECIAL: 'Especial',
};

export const SHIFT_COLORS: Record<ShiftType, string> = {
  MORNING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  AFTERNOON: 'bg-blue-100 text-blue-800 border-blue-200',
  NIGHT_6H: 'bg-purple-100 text-purple-800 border-purple-200',
  NIGHT_12H: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  DAY_OFF: 'bg-gray-100 text-gray-500 border-gray-200',
  SPECIAL: 'bg-green-100 text-green-800 border-green-200',
};

export const SHIFT_HOURS: Record<ShiftType, number> = {
  MORNING: 6,
  AFTERNOON: 6,
  NIGHT_6H: 6,
  NIGHT_12H: 12,
  DAY_OFF: 0,
  SPECIAL: 6,
};

export const STATUS_LABELS: Record<ScheduleStatus, string> = {
  DRAFT: 'Borrador',
  PENDING_APPROVAL: 'Pendiente aprobación',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  ARCHIVED: 'Archivado',
};

export const STATUS_COLORS: Record<ScheduleStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  ARCHIVED: 'bg-slate-100 text-slate-500',
};
