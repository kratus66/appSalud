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
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  createdAt: string;
  userCount?: number;
  metadata?: {
    address?: string;
    phone?: string;
    email?: string;
    capacity?: number;
    specialties?: string[];
    emergencyPhone?: string;
  };
}

export interface AuditEvent {
  id: string;
  eventType: string;
  userId: string | null;
  institutionId: string | null;
  details: any;
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
  recent?: any[];
}

// Sprint 2 - Configuración Operativa

export enum ShiftType {
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
  NIGHT = 'NIGHT',
  SPECIAL = 'SPECIAL',
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
