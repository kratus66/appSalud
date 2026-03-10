import {
  IsString, IsNotEmpty, IsUUID, IsInt, IsOptional,
  IsDateString, IsEnum, Min, Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RecurringFrequency } from '../../common/enums';

// ─── Doctor Schedule ───────────────────────────────────────────

export class CreateScheduleDto {
  @ApiProperty({ example: 'doctor-uuid' })
  @IsUUID()
  @IsNotEmpty()
  doctorId: string;

  @ApiProperty({ example: 1, description: '0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb' })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ example: '08:00' })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ example: '14:00' })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiPropertyOptional({ example: 30, description: 'Duración del slot en minutos' })
  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(120)
  slotDuration?: number;

  @ApiPropertyOptional({ example: 'institution-uuid' })
  @IsOptional()
  @IsUUID()
  institutionId?: string;
}

export class UpdateScheduleDto {
  @ApiPropertyOptional({ example: '08:00' })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({ example: '17:00' })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(120)
  slotDuration?: number;
}

// ─── Time Block ────────────────────────────────────────────────

export class CreateBlockDto {
  @ApiProperty({ example: 'doctor-uuid' })
  @IsUUID()
  @IsNotEmpty()
  doctorId: string;

  @ApiProperty({ example: '2026-03-15', description: 'Fecha del bloqueo (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: '08:00' })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ example: '14:00' })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiPropertyOptional({ example: 'Vacaciones' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ example: 'institution-uuid' })
  @IsOptional()
  @IsUUID()
  institutionId?: string;
}

// ─── Recurring Appointment ────────────────────────────────────

export class CreateRecurringAppointmentDto {
  @ApiProperty({ example: 'patient-uuid' })
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ example: 'doctor-uuid' })
  @IsUUID()
  @IsNotEmpty()
  doctorId: string;

  @ApiProperty({ example: 1, description: '0=Dom … 6=Sáb' })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ example: '09:00' })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ example: '09:30' })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({ enum: RecurringFrequency, example: RecurringFrequency.WEEKLY })
  @IsEnum(RecurringFrequency)
  frequency: RecurringFrequency;

  @ApiPropertyOptional({ example: 'Terapia semanal' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ example: '2026-03-10' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'institution-uuid' })
  @IsOptional()
  @IsUUID()
  institutionId?: string;
}
