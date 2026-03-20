import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UserRole } from '../common/enums';

// ─── Fixtures ───────────────────────────────────────────────────────────────

const INST_ID = 'inst-111';
const SCHEDULE_ID = 'sched-222';
const USER_ID = 'user-333';

/** Malla DRAFT estándar */
function makeDraftSchedule(overrides: Partial<any> = {}) {
  return {
    id: SCHEDULE_ID,
    name: 'Malla Marzo 2026',
    status: 'DRAFT',
    institutionId: INST_ID,
    // periodo de 7 días para simplificar cálculos
    startDate: new Date('2026-03-01T00:00:00Z'),
    endDate:   new Date('2026-03-07T00:00:00Z'),
    periodType: 'MONTHLY',
    ...overrides,
  };
}

/** Usuario PLANIFICADOR estándar */
function makePlanificador(overrides: Partial<any> = {}) {
  return {
    id: USER_ID,
    role: UserRole.PLANIFICADOR,
    institutionId: INST_ID,
    ...overrides,
  };
}

/** Trabajador activo estándar */
function makeWorker(id: string, overrides: Partial<any> = {}) {
  return {
    id,
    firstName: 'Ana',
    lastName: 'García',
    role: UserRole.DOCTOR,
    ...overrides,
  };
}

/** Asignación estándar con ausencia */
function makeAssignment(overrides: Partial<any> = {}) {
  return {
    id: 'asgn-444',
    scheduleId: SCHEDULE_ID,
    userId: USER_ID,
    institutionId: INST_ID,
    assignmentDate: new Date('2026-03-01'),
    shiftType: 'MORNING',
    hoursWorked: 6,
    absenceType: null,
    absenceNotes: null,
    ...overrides,
  };
}

// ─── Suite principal ─────────────────────────────────────────────────────────

describe('SchedulesService — lógica nueva del planificador', () => {
  let service: SchedulesService;
  let prisma: Record<string, any>;
  let auditService: { log: jest.Mock };

  beforeEach(async () => {
    prisma = {
      workSchedule: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      shiftAssignment: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        create: jest.fn(),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      peakHourConfig: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      scheduleViolation: {
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };

    auditService = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<SchedulesService>(SchedulesService);
  });

  // =========================================================================
  // generate()
  // =========================================================================

  describe('generate()', () => {
    const user = makePlanificador();

    it('lanza NotFoundException si la malla no existe', async () => {
      prisma.workSchedule.findUnique.mockResolvedValue(null);

      await expect(service.generate(SCHEDULE_ID, {}, user)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lanza BadRequestException si la malla NO está en DRAFT', async () => {
      prisma.workSchedule.findUnique.mockResolvedValue(
        makeDraftSchedule({ status: 'PENDING_APPROVAL' }),
      );

      await expect(service.generate(SCHEDULE_ID, {}, user)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('lanza ForbiddenException si la malla pertenece a otra institución', async () => {
      prisma.workSchedule.findUnique.mockResolvedValue(
        makeDraftSchedule({ institutionId: 'otra-inst' }),
      );

      await expect(service.generate(SCHEDULE_ID, {}, user)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('lanza BadRequestException si no hay trabajadores activos', async () => {
      prisma.workSchedule.findUnique.mockResolvedValue(makeDraftSchedule());
      prisma.user.findMany.mockResolvedValue([]);

      await expect(service.generate(SCHEDULE_ID, {}, user)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.generate(SCHEDULE_ID, {}, user)).rejects.toThrow(
        'No hay trabajadores activos',
      );
    });

    it('genera asignaciones para 1 trabajador en período de 7 días (sin considerar mes anterior)', async () => {
      prisma.workSchedule.findUnique.mockResolvedValue(makeDraftSchedule());
      prisma.user.findMany.mockResolvedValue([makeWorker('w1')]);

      const result = await service.generate(
        SCHEDULE_ID,
        { considerPreviousMonth: false },
        user,
      );

      // 7 días × 1 trabajador = 7 asignaciones (mezcla de turno + DAY_OFF)
      expect(result.workers).toBe(1);
      expect(result.generated).toBe(7);
      expect(prisma.shiftAssignment.createMany).toHaveBeenCalledTimes(1);

      const { data } = prisma.shiftAssignment.createMany.mock.calls[0][0];
      expect(data).toHaveLength(7);
      // Todas pertenecen al scheduleId correcto
      data.forEach((a: any) => {
        expect(a.scheduleId).toBe(SCHEDULE_ID);
        expect(a.institutionId).toBe(INST_ID);
        expect(a.userId).toBe('w1');
      });
    });

    it('genera exactamente 36 h semanales para turno MORNING (6 días × 6h)', async () => {
      // Período completo de 7 días para grupo MORNING (índice 0 → primer trabajador)
      prisma.workSchedule.findUnique.mockResolvedValue(makeDraftSchedule());
      prisma.user.findMany.mockResolvedValue([makeWorker('w1')]);

      await service.generate(SCHEDULE_ID, { considerPreviousMonth: false }, user);

      const { data } = prisma.shiftAssignment.createMany.mock.calls[0][0];
      const workingDays = data.filter((a: any) => a.shiftType === 'MORNING');
      const offDays     = data.filter((a: any) => a.shiftType === 'DAY_OFF');

      expect(workingDays).toHaveLength(6);
      expect(offDays).toHaveLength(1);
      const totalHours = data.reduce((s: number, a: any) => s + (a.hoursWorked ?? 0), 0);
      expect(totalHours).toBe(36);
    });

    it('genera exactamente 36 h semanales para turno NIGHT_12H (3 días × 12h)', async () => {
      // El trabajador índice 2 cae en grupo NIGHT_12H
      prisma.workSchedule.findUnique.mockResolvedValue(makeDraftSchedule());
      prisma.user.findMany.mockResolvedValue([
        makeWorker('w1'),
        makeWorker('w2'),
        makeWorker('w3'), // índice 2 → NIGHT_12H
      ]);

      await service.generate(SCHEDULE_ID, { considerPreviousMonth: false }, user);

      const calls = prisma.shiftAssignment.createMany.mock.calls[0][0].data as any[];
      const nightWorker = calls.filter((a: any) => a.userId === 'w3');

      const nightShifts = nightWorker.filter((a: any) => a.shiftType === 'NIGHT_12H');
      const totalHours  = nightWorker.reduce((s: number, a: any) => s + (a.hoursWorked ?? 0), 0);

      expect(nightShifts).toHaveLength(3);
      expect(totalHours).toBe(36);
    });

    it('respeta userIds del DTO para filtrar trabajadores específicos', async () => {
      prisma.workSchedule.findUnique.mockResolvedValue(makeDraftSchedule());
      prisma.user.findMany.mockResolvedValue([makeWorker('w5')]);

      await service.generate(
        SCHEDULE_ID,
        { considerPreviousMonth: false, userIds: ['w5'] },
        user,
      );

      // Prisma debe recibir el filtro id: { in: ['w5'] }
      const whereArg = prisma.user.findMany.mock.calls[0][0].where;
      expect(whereArg.id).toEqual({ in: ['w5'] });
    });

    it('considera el turno dominante del mes anterior para la rotación', async () => {
      prisma.workSchedule.findUnique.mockResolvedValue(makeDraftSchedule());
      prisma.user.findMany.mockResolvedValue([makeWorker('w1')]);

      // Simular que w1 hizo MORNING el mes anterior → ahora le toca AFTERNOON (índice+1)
      prisma.shiftAssignment.findMany.mockResolvedValue([
        { userId: 'w1', shiftType: 'MORNING' },
        { userId: 'w1', shiftType: 'MORNING' },
        { userId: 'w1', shiftType: 'MORNING' },
      ]);

      await service.generate(SCHEDULE_ID, { considerPreviousMonth: true }, user);

      const { data } = prisma.shiftAssignment.createMany.mock.calls[0][0];
      // El turno de trabajo dominante en la primera semana debe ser AFTERNOON
      const workingShifts = data.filter((a: any) => a.shiftType !== 'DAY_OFF');
      expect(workingShifts.every((a: any) => a.shiftType === 'AFTERNOON')).toBe(true);
    });

    it('elimina asignaciones previas sin ausencia antes de generar', async () => {
      prisma.workSchedule.findUnique.mockResolvedValue(makeDraftSchedule());
      prisma.user.findMany.mockResolvedValue([makeWorker('w1')]);

      await service.generate(SCHEDULE_ID, { considerPreviousMonth: false }, user);

      expect(prisma.shiftAssignment.deleteMany).toHaveBeenCalledWith({
        where: { scheduleId: SCHEDULE_ID, absenceType: null },
      });
    });

    it('registra evento de auditoría tras la generación', async () => {
      prisma.workSchedule.findUnique.mockResolvedValue(makeDraftSchedule());
      prisma.user.findMany.mockResolvedValue([makeWorker('w1')]);

      await service.generate(SCHEDULE_ID, { considerPreviousMonth: false }, user);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'WorkSchedule',
          entityId: SCHEDULE_ID,
          details: expect.objectContaining({ action: 'AUTO_GENERATED' }),
        }),
      );
    });

    it('SUPER_ADMIN puede generar sin institutionId propio', async () => {
      const superAdmin = { id: 'sa-1', role: UserRole.SUPER_ADMIN };
      const schedule = makeDraftSchedule();
      prisma.workSchedule.findUnique.mockResolvedValue(schedule);
      prisma.user.findMany.mockResolvedValue([makeWorker('w1')]);

      const result = await service.generate(
        SCHEDULE_ID,
        { considerPreviousMonth: false },
        superAdmin,
      );

      expect(result.workers).toBe(1);
    });
  });

  // =========================================================================
  // markAbsence()
  // =========================================================================

  describe('markAbsence()', () => {
    const user = makePlanificador();
    const dto = { absenceType: 'SICK_LEAVE' as const, absenceNotes: 'Certificado médico' };

    it('lanza NotFoundException si la malla no existe', async () => {
      prisma.workSchedule.findUnique.mockResolvedValue(null);

      await expect(service.markAbsence(SCHEDULE_ID, 'asgn-1', dto, user)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lanza BadRequestException si la malla no está en DRAFT', async () => {
      prisma.workSchedule.findUnique.mockResolvedValue(
        makeDraftSchedule({ status: 'APPROVED' }),
      );

      await expect(service.markAbsence(SCHEDULE_ID, 'asgn-1', dto, user)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('lanza NotFoundException si la asignación no pertenece a la malla', async () => {
      prisma.workSchedule.findUnique.mockResolvedValue(makeDraftSchedule());
      prisma.shiftAssignment.findFirst.mockResolvedValue(null);

      await expect(service.markAbsence(SCHEDULE_ID, 'asgn-no-existe', dto, user)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('actualiza absenceType y absenceNotes correctamente', async () => {
      const assignment = makeAssignment();
      prisma.workSchedule.findUnique.mockResolvedValue(makeDraftSchedule());
      prisma.shiftAssignment.findFirst.mockResolvedValue(assignment);
      prisma.shiftAssignment.update.mockResolvedValue({
        ...assignment,
        absenceType: dto.absenceType,
        absenceNotes: dto.absenceNotes,
        user: { id: USER_ID, firstName: 'Ana', lastName: 'García' },
      });

      const result = await service.markAbsence(SCHEDULE_ID, assignment.id, dto, user);

      expect(prisma.shiftAssignment.update).toHaveBeenCalledWith({
        where: { id: assignment.id },
        data: {
          absenceType: 'SICK_LEAVE',
          absenceNotes: 'Certificado médico',
        },
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
      });
      expect(result.absenceType).toBe('SICK_LEAVE');
      expect(result.absenceNotes).toBe('Certificado médico');
    });

    it('guarda absenceNotes como null cuando no se pasan notas', async () => {
      const assignment = makeAssignment();
      prisma.workSchedule.findUnique.mockResolvedValue(makeDraftSchedule());
      prisma.shiftAssignment.findFirst.mockResolvedValue(assignment);
      prisma.shiftAssignment.update.mockResolvedValue({
        ...assignment,
        absenceType: 'VACATION',
        absenceNotes: null,
        user: null,
      });

      await service.markAbsence(SCHEDULE_ID, assignment.id, { absenceType: 'VACATION' as const }, user);

      const dataArg = prisma.shiftAssignment.update.mock.calls[0][0].data;
      expect(dataArg.absenceNotes).toBeNull();
    });

    it('registra evento de auditoría', async () => {
      const assignment = makeAssignment();
      prisma.workSchedule.findUnique.mockResolvedValue(makeDraftSchedule());
      prisma.shiftAssignment.findFirst.mockResolvedValue(assignment);
      prisma.shiftAssignment.update.mockResolvedValue({ ...assignment, user: null });

      await service.markAbsence(SCHEDULE_ID, assignment.id, dto, user);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'ShiftAssignment',
          entityId: assignment.id,
          details: { absenceType: 'SICK_LEAVE' },
        }),
      );
    });

    it('lanza ForbiddenException si la malla es de otra institución', async () => {
      prisma.workSchedule.findUnique.mockResolvedValue(
        makeDraftSchedule({ institutionId: 'otra-inst' }),
      );

      await expect(service.markAbsence(SCHEDULE_ID, 'asgn-1', dto, user)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // =========================================================================
  // removeAbsence()
  // =========================================================================

  describe('removeAbsence()', () => {
    const user = makePlanificador();

    it('lanza NotFoundException si la malla no existe', async () => {
      prisma.workSchedule.findUnique.mockResolvedValue(null);

      await expect(service.removeAbsence(SCHEDULE_ID, 'asgn-1', user)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lanza BadRequestException si la malla no está en DRAFT', async () => {
      prisma.workSchedule.findUnique.mockResolvedValue(
        makeDraftSchedule({ status: 'PENDING_APPROVAL' }),
      );

      await expect(service.removeAbsence(SCHEDULE_ID, 'asgn-1', user)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('limpia absenceType y absenceNotes (los pone en null)', async () => {
      const assignment = makeAssignment({ absenceType: 'SICK_LEAVE', absenceNotes: 'baja' });
      prisma.workSchedule.findUnique.mockResolvedValue(makeDraftSchedule());
      prisma.shiftAssignment.update.mockResolvedValue({ ...assignment, absenceType: null, absenceNotes: null });

      const result = await service.removeAbsence(SCHEDULE_ID, assignment.id, user);

      expect(prisma.shiftAssignment.update).toHaveBeenCalledWith({
        where: { id: assignment.id },
        data: { absenceType: null, absenceNotes: null },
      });
      expect(result.absenceType).toBeNull();
      expect(result.absenceNotes).toBeNull();
    });
  });

  // =========================================================================
  // getPeakHours()
  // =========================================================================

  describe('getPeakHours()', () => {
    const user = makePlanificador();

    it('devuelve todas las configuraciones de horas pico de la institución', async () => {
      const configs = [
        { id: 'ph-1', institutionId: INST_ID, startTime: '08:00', endTime: '10:00', minStaff: 3, service: { id: 'svc-1', name: 'Urgencias' } },
        { id: 'ph-2', institutionId: INST_ID, startTime: '13:00', endTime: '15:00', minStaff: 2, service: null },
      ];
      prisma.peakHourConfig.findMany.mockResolvedValue(configs);

      const result = await service.getPeakHours(undefined, user);

      expect(result).toHaveLength(2);
      expect(prisma.peakHourConfig.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { institutionId: INST_ID },
        }),
      );
    });

    it('filtra por serviceId cuando se proporciona', async () => {
      prisma.peakHourConfig.findMany.mockResolvedValue([]);

      await service.getPeakHours('svc-99', user);

      const whereArg = prisma.peakHourConfig.findMany.mock.calls[0][0].where;
      expect(whereArg.serviceId).toBe('svc-99');
    });

    it('SUPER_ADMIN sin institutionId no filtra por institución', async () => {
      const superAdmin = { id: 'sa-1', role: UserRole.SUPER_ADMIN };
      prisma.peakHourConfig.findMany.mockResolvedValue([]);

      await service.getPeakHours(undefined, superAdmin);

      const whereArg = prisma.peakHourConfig.findMany.mock.calls[0][0].where;
      expect(whereArg.institutionId).toBeUndefined();
    });
  });

  // =========================================================================
  // createPeakHour()
  // =========================================================================

  describe('createPeakHour()', () => {
    const user = makePlanificador();
    const dto = {
      serviceId: 'svc-1',
      label: 'Hora pico mañana',
      startTime: '08:00',
      endTime: '10:00',
      minStaff: 3,
      daysOfWeek: '1,2,3,4,5',
      institutionId: INST_ID,
    };

    it('crea la configuración con los datos correctos', async () => {
      const created = { id: 'ph-new', ...dto, isActive: true };
      prisma.peakHourConfig.create.mockResolvedValue(created);

      const result = await service.createPeakHour(dto, user);

      expect(result.id).toBe('ph-new');
      expect(prisma.peakHourConfig.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          serviceId: dto.serviceId,
          label: dto.label,
          startTime: dto.startTime,
          endTime: dto.endTime,
          minStaff: dto.minStaff,
          isActive: true,
        }),
      });
    });

    it('lanza BadRequestException si no se puede resolver institutionId', async () => {
      const userSinInst = { id: 'u1', role: UserRole.SUPER_ADMIN }; // SUPER_ADMIN sin institutionId en DTO
      const dtoSinInst = { ...dto, institutionId: undefined };

      await expect(service.createPeakHour(dtoSinInst as any, userSinInst)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // =========================================================================
  // updatePeakHour()
  // =========================================================================

  describe('updatePeakHour()', () => {
    const user = makePlanificador();

    it('lanza NotFoundException si la configuración no existe', async () => {
      prisma.peakHourConfig.findUnique.mockResolvedValue(null);

      await expect(service.updatePeakHour('ph-no', { minStaff: 5 }, user)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lanza ForbiddenException si pertenece a otra institución', async () => {
      prisma.peakHourConfig.findUnique.mockResolvedValue({
        id: 'ph-1',
        institutionId: 'otra-inst',
      });

      await expect(service.updatePeakHour('ph-1', { minStaff: 5 }, user)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('actualiza correctamente los campos enviados', async () => {
      const existing = { id: 'ph-1', institutionId: INST_ID, minStaff: 2 };
      const updated  = { ...existing, minStaff: 5 };
      prisma.peakHourConfig.findUnique.mockResolvedValue(existing);
      prisma.peakHourConfig.update.mockResolvedValue(updated);

      const result = await service.updatePeakHour('ph-1', { minStaff: 5 }, user);

      expect(result.minStaff).toBe(5);
      expect(prisma.peakHourConfig.update).toHaveBeenCalledWith({
        where: { id: 'ph-1' },
        data: { minStaff: 5 },
      });
    });
  });

  // =========================================================================
  // deletePeakHour()
  // =========================================================================

  describe('deletePeakHour()', () => {
    const user = makePlanificador();

    it('lanza NotFoundException si la configuración no existe', async () => {
      prisma.peakHourConfig.findUnique.mockResolvedValue(null);

      await expect(service.deletePeakHour('ph-no', user)).rejects.toThrow(NotFoundException);
    });

    it('lanza ForbiddenException si pertenece a otra institución', async () => {
      prisma.peakHourConfig.findUnique.mockResolvedValue({
        id: 'ph-1',
        institutionId: 'otra-inst',
      });

      await expect(service.deletePeakHour('ph-1', user)).rejects.toThrow(ForbiddenException);
    });

    it('elimina la configuración y devuelve mensaje de confirmación', async () => {
      const existing = { id: 'ph-1', institutionId: INST_ID };
      prisma.peakHourConfig.findUnique.mockResolvedValue(existing);
      prisma.peakHourConfig.delete.mockResolvedValue(existing);

      const result = await service.deletePeakHour('ph-1', user);

      expect(prisma.peakHourConfig.delete).toHaveBeenCalledWith({ where: { id: 'ph-1' } });
      expect(result).toEqual({ message: 'Configuración eliminada' });
    });
  });
});
