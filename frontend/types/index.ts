export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  PLANIFICADOR = 'PLANIFICADOR',
  APROBADOR = 'APROBADOR',
  CONSULTA = 'CONSULTA',
  DOCTOR = 'DOCTOR',
  RECEPCIONISTA = 'RECEPCIONISTA',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  specialty?: string | null;
  institutionId: string | null;
  institution: {
    id: string;
    name: string;
    code: string;
  } | null;
  isActive: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
}

export interface Institution {
  id: string;
  name: string;
  code: string;
  type: 'CLINIC' | 'HOSPITAL' | 'LAB' | 'OTHER';
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  createdAt: string;
  userCount?: number;
  currentPlan?: { name: string; price: number } | null;
  currentSubscription?: Subscription | null;
  metadata?: {
    address?: string;
    phone?: string;
    email?: string;
    capacity?: number;
    specialties?: string[];
    emergencyPhone?: string;
  };
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  TRIAL = 'TRIAL',
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  maxUsers: number;
  maxDoctors: number;
  maxPatients: number;
  features?: string[] | Record<string, boolean>;
  isActive: boolean;
  subscriptionCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  institutionId: string;
  institution?: { id: string; name: string; code: string; type?: string; city?: string };
  planId: string;
  plan?: { id: string; name: string; price: number };
  startDate: string;
  endDate?: string | null;
  status: SubscriptionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEvent {
  id: string;
  eventType: string;
  userId: string | null;
  institutionId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
  user?: {
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface Stats {
  total: number;
  active?: number;
  byRole?: Array<{
    role: string;
    count: number;
  }>;
  byStatus?: {
    active: number;
    suspended: number;
    inactive: number;
  };
  recent?: User[] | Institution[] | Service[];
}

// Sprint 2 - Configuración Operativa

export enum ShiftType {
  MORNING   = 'MORNING',
  AFTERNOON = 'AFTERNOON',
  NIGHT_6H  = 'NIGHT_6H',
  NIGHT_12H = 'NIGHT_12H',
  DAY_OFF   = 'DAY_OFF',
  SPECIAL   = 'SPECIAL',
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  institutionId: string;
  institution?: {
    id: string;
    name: string;
    code: string;
  };
  isActive: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  shiftType: ShiftType;
  color: string;
  institutionId: string;
  institution?: {
    id: string;
    name: string;
    code: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  id: string;
  name: string;
  weeklyHours: number;
  maxConsecutiveNights: number;
  requiredRestHours: number;
  rulesConfig?: string;
  institutionId: string;
  institution?: {
    id: string;
    name: string;
    code: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Holiday {
  id: string;
  holidayDate: string;
  name: string;
  countryCode: string;
  institutionId?: string | null;
  institution?: {
    id: string;
    name: string;
    code: string;
  } | null;
  createdAt: string;
}

// Sprint 3 - Módulo de Citas Médicas

export enum DocumentType {
  CC = 'CC',
  TI = 'TI',
  CE = 'CE',
  PA = 'PA',
}

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  documentType: DocumentType;
  documentNumber: string;
  email?: string;
  phone?: string;
  birthDate?: string | null;
  gender?: string;
  address?: string;
  institutionId: string;
  institution?: {
    id: string;
    name: string;
    code: string;
  };
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    documentNumber: string;
  };
  doctorId: string;
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    specialty?: string | null;
  };
  appointmentDate: string;
  startTime: string;
  endTime: string;
  reason?: string;
  notes?: string;
  status: AppointmentStatus;
  institutionId: string;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Sprint 3 - Médicos y Especialidades

export interface Specialty {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  institutionId: string;
  isActive: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { doctors: number };
}

export interface DoctorProfile {
  id: string;
  userId: string;
  specialtyId: string;
  specialty: {
    id: string;
    name: string;
    color: string;
    description?: string | null;
  };
  licenseNumber?: string | null;
  phone?: string | null;
  consultingRoom?: string | null;
  bio?: string | null;
  institutionId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  doctorProfile: DoctorProfile | null;
}

export interface CreateDoctorDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  specialtyId: string;
  licenseNumber?: string;
  phone?: string;
  consultingRoom?: string;
  bio?: string;
  institutionId?: string;
}

export interface UpdateDoctorDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  specialtyId?: string;
  licenseNumber?: string;
  phone?: string;
  consultingRoom?: string;
  bio?: string;
  isActive?: boolean;
}

export interface CreateSpecialtyDto {
  name: string;
  description?: string;
  color?: string;
  institutionId?: string;
}

export interface UpdateSpecialtyDto extends Partial<CreateSpecialtyDto> {
  isActive?: boolean;
}

// ─── Sprint 4 - Disponibilidad y Horarios ─────────────────────

export enum RecurringFrequency {
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
}

export enum SlotStatus {
  FREE = 'FREE',
  BOOKED = 'BOOKED',
  BLOCKED = 'BLOCKED',
}

export interface DoctorSchedule {
  id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  institutionId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TimeBlock {
  id: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason?: string | null;
  institutionId: string;
  createdAt: string;
}

export interface RecurringAppointment {
  id: string;
  patientId: string;
  patient: { firstName: string; lastName: string; documentNumber: string };
  doctorId: string;
  doctor: { firstName: string; lastName: string };
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  frequency: RecurringFrequency;
  reason?: string | null;
  startDate: string;
  endDate?: string | null;
  institutionId: string;
  isActive: boolean;
  createdAt: string;
}

export interface AvailabilitySlot {
  time: string;
  endTime: string;
  status: SlotStatus;
  appointmentId?: string;
  patientName?: string;
  reason?: string;
  blockReason?: string;
}

export interface AvailabilityResponse {
  doctorId: string;
  date: string;
  dayOfWeek: number;
  hasSchedule: boolean;
  scheduleStart?: string;
  scheduleEnd?: string;
  slotDuration?: number;
  slots: AvailabilitySlot[];
  message?: string;
  summary?: { total: number; free: number; booked: number; blocked: number };
}

export interface CreateScheduleDto {
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration?: number;
}

export interface CreateBlockDto {
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason?: string;
}

export interface CreateRecurringAppointmentDto {
  patientId: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  frequency: RecurringFrequency;
  reason?: string;
  startDate: string;
  endDate?: string;
}

