import {
  IsString, IsNotEmpty, IsIn, IsDateString, IsOptional, IsUUID,
  IsArray, ValidateNested, ArrayMinSize, IsBoolean, IsInt, Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateScheduleDto {
  @ApiProperty({ example: 'Malla Semana 1 - Marzo 2026' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: ['WEEKLY', 'BIWEEKLY', 'MONTHLY'] })
  @IsIn(['WEEKLY', 'BIWEEKLY', 'MONTHLY'])
  periodType: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';

  @ApiProperty({ example: '2026-03-23' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-03-29' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  institutionId?: string;
}

export class UpdateScheduleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateShiftAssignmentDto {
  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiProperty({ example: '2026-03-23' })
  @IsDateString()
  assignmentDate: string;

  @ApiProperty({ enum: ['MORNING', 'AFTERNOON', 'NIGHT_6H', 'NIGHT_12H', 'DAY_OFF', 'SPECIAL'] })
  @IsIn(['MORNING', 'AFTERNOON', 'NIGHT_6H', 'NIGHT_12H', 'DAY_OFF', 'SPECIAL'])
  shiftType: string;

  @ApiPropertyOptional({ example: '07:00' })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({ example: '13:00' })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkAssignDto {
  @ApiProperty()
  @IsUUID()
  scheduleId: string;

  @ApiProperty({ type: [CreateShiftAssignmentDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateShiftAssignmentDto)
  assignments: CreateShiftAssignmentDto[];
}

export class RejectScheduleDto {
  @ApiProperty({ example: 'No cumple cobertura mínima del turno mañana' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class GenerateScheduleDto {
  @ApiPropertyOptional({ description: 'Consultar mes anterior para rotar turnos. Default: true', default: true })
  @IsOptional()
  @IsBoolean()
  considerPreviousMonth?: boolean;

  @ApiPropertyOptional({ description: 'IDs de trabajadores específicos. Si se omite, incluye todos.', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  userIds?: string[];
}

export class MarkAbsenceDto {
  @ApiProperty({ enum: ['VACATION', 'SICK_LEAVE', 'PERSONAL', 'UNPREDICTED'] })
  @IsIn(['VACATION', 'SICK_LEAVE', 'PERSONAL', 'UNPREDICTED'])
  absenceType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  absenceNotes?: string;
}

export class CreatePeakHourConfigDto {
  @ApiProperty()
  @IsUUID()
  serviceId: string;

  @ApiProperty({ example: 'Horas pico mañana bacteriología' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ example: '06:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: '12:00' })
  @IsString()
  endTime: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  minStaff: number;

  @ApiPropertyOptional({ example: '[1,2,3,4,5]' })
  @IsOptional()
  @IsString()
  daysOfWeek?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  institutionId?: string;
}

export class UpdatePeakHourConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  minStaff?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  daysOfWeek?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
