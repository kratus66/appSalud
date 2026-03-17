import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UserRole, AuditEventType, AppointmentStatus } from '../common/enums';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let prisma: any;
  let auditService: any;

  const mockDoctor = {
    id: 'doctor-123',
    email: 'doctor@test.com',
    firstName: 'Dr. Smith',
    lastName: 'John',
    role: UserRole.DOCTOR,
    institutionId: 'inst-123',
    isActive: true,
    password: 'hashed',
    lockedUntil: null,
    failedLoginAttempts: 0,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLogin: null,
    specialty: null,
  };

  const mockPatient = {
    id: 'patient-123',
    firstName: 'Patient',
    lastName: 'Test',
    documentNumber: '12345678',
    email: 'patient@test.com',
    phone: '1234567890',
    birthDate: new Date('1990-01-01'),
    institutionId: 'inst-123',
    isActive: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAppointment = {
    id: 'appointment-123',
    patientId: 'patient-123',
    doctorId: 'doctor-123',
    institutionId: 'inst-123',
    appointmentDate: new Date('2026-03-15'),
    startTime: '10:00',
    endTime: '10:30',
    status: AppointmentStatus.SCHEDULED,
    reason: 'Consulta general',
    notes: null,
    createdById: 'user-123',
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrisma = {
      patient: {
        findFirst: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
      },
      appointment: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      doctorSchedule: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      timeBlock: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const mockAuditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
    prisma = module.get(PrismaService);
    auditService = module.get(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkDoubleBooking', () => {
    it('should throw ConflictException when slot is occupied', async () => {
      const existingAppointment = {
        ...mockAppointment,
        startTime: '10:00',
        endTime: '11:00',
      };

      prisma.appointment.findMany.mockResolvedValue([existingAppointment]);

      await expect(
        service['checkDoubleBooking'](
          'doctor-123',
          new Date('2026-03-15'),
          '10:30',
          '11:00',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow booking when slot is free', async () => {
      prisma.appointment.findMany.mockResolvedValue([]);

      await expect(
        service['checkDoubleBooking'](
          'doctor-123',
          new Date('2026-03-15'),
          '14:00',
          '14:30',
        ),
      ).resolves.not.toThrow();
    });

    it('should exclude current appointment when updating', async () => {
      const existingAppointment = {
        ...mockAppointment,
        startTime: '10:00',
        endTime: '10:30',
      };

      prisma.appointment.findMany.mockResolvedValueOnce([]);

      await expect(
        service['checkDoubleBooking'](
          'doctor-123',
          new Date('2026-03-15'),
          '10:00',
          '10:30',
          'appointment-123',
        ),
      ).resolves.not.toThrow();
    });
  });

  describe('create', () => {
    const createDto = {
      patientId: 'patient-123',
      doctorId: 'doctor-123',
      appointmentDate: '2026-03-15',
      startTime: '10:00',
      endTime: '10:30',
      reason: 'Consulta general',
    };

    it('should throw NotFoundException when patient not found', async () => {
      prisma.patient.findFirst.mockResolvedValue(null);

      await expect(
        service.create(createDto as any, 'user-123', UserRole.ADMIN, 'inst-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when doctor not found', async () => {
      prisma.patient.findFirst.mockResolvedValue(mockPatient);
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.create(createDto as any, 'user-123', UserRole.ADMIN, 'inst-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when patient and doctor are from different institutions', async () => {
      prisma.patient.findFirst.mockResolvedValue({ ...mockPatient, institutionId: 'inst-123' });
      prisma.user.findFirst.mockResolvedValue({ ...mockDoctor, institutionId: 'inst-456' });

      await expect(
        service.create(createDto as any, 'user-123', UserRole.ADMIN, 'inst-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when double booking', async () => {
      prisma.patient.findFirst.mockResolvedValue(mockPatient);
      prisma.user.findFirst.mockResolvedValue(mockDoctor);
      prisma.appointment.findMany.mockResolvedValue([{
        ...mockAppointment,
        startTime: '10:00',
        endTime: '11:00',
      }]);

      await expect(
        service.create(createDto as any, 'user-123', UserRole.ADMIN, 'inst-123'),
      ).rejects.toThrow(ConflictException);
    });

    it('should create appointment successfully', async () => {
      prisma.patient.findFirst.mockResolvedValue(mockPatient);
      prisma.user.findFirst.mockResolvedValue(mockDoctor);
      prisma.appointment.findMany.mockResolvedValue([]);
      prisma.appointment.create.mockResolvedValue(mockAppointment);

      const result = await service.create(createDto as any, 'user-123', UserRole.ADMIN, 'inst-123');

      expect(result).toEqual(mockAppointment);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditEventType.APPOINTMENT_CREATED,
        }),
      );
    });
  });

  describe('timeToMinutes', () => {
    it('should convert time string to minutes correctly', () => {
      const serviceAny = service as any;
      expect(serviceAny.timeToMinutes('10:00')).toBe(600);
      expect(serviceAny.timeToMinutes('00:00')).toBe(0);
      expect(serviceAny.timeToMinutes('23:59')).toBe(1439);
      expect(serviceAny.timeToMinutes('08:30')).toBe(510);
    });
  });

  describe('findAll with filters', () => {
    it('should return appointments with total count', async () => {
      prisma.appointment.findMany.mockResolvedValue([mockAppointment]);

      const result = await service.findAll(UserRole.ADMIN, 'inst-123', 'user-123');

      expect(result.appointments).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by status', async () => {
      prisma.appointment.findMany.mockResolvedValue([mockAppointment]);
      prisma.appointment.count.mockResolvedValue(1);

      await service.findAll(UserRole.ADMIN, 'inst-123', 'user-123', { status: AppointmentStatus.SCHEDULED });

      expect(prisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: AppointmentStatus.SCHEDULED,
          }),
        }),
      );
    });

    it('should filter by doctor', async () => {
      prisma.appointment.findMany.mockResolvedValue([mockAppointment]);
      prisma.appointment.count.mockResolvedValue(1);

      await service.findAll(UserRole.ADMIN, 'inst-123', 'user-123', { doctorId: 'doctor-123' });

      expect(prisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            doctorId: 'doctor-123',
          }),
        }),
      );
    });

    it('should filter by date range', async () => {
      prisma.appointment.findMany.mockResolvedValue([mockAppointment]);
      prisma.appointment.count.mockResolvedValue(1);

      await service.findAll(UserRole.ADMIN, 'inst-123', 'user-123', {
        startDate: '2026-03-01',
        endDate: '2026-03-31',
      });

      expect(prisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            appointmentDate: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });
  });
});
