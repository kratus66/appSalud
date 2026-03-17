export const SHIFT_CONFIG: Record<string, {
  startTime: string;
  endTime: string;
  durationHours: number;
  minCoverage: number;
}> = {
  MORNING:   { startTime: '07:00', endTime: '13:00', durationHours: 6,  minCoverage: 3 },
  AFTERNOON: { startTime: '13:00', endTime: '19:00', durationHours: 6,  minCoverage: 1 },
  NIGHT_6H:  { startTime: '19:00', endTime: '01:00', durationHours: 6,  minCoverage: 1 },
  NIGHT_12H: { startTime: '19:00', endTime: '07:00', durationHours: 12, minCoverage: 1 },
  DAY_OFF:   { startTime: '',      endTime: '',       durationHours: 0,  minCoverage: 0 },
  SPECIAL:   { startTime: '',      endTime: '',       durationHours: 0,  minCoverage: 0 },
};

export const WEEKLY_HOURS_TARGET = 36;
export const MAX_CONSECUTIVE_SHIFTS = 3;
export const MIN_REST_AFTER_NIGHT_12H = 12; // horas
export const MIN_REST_AFTER_NIGHT_6H  = 6;  // horas
