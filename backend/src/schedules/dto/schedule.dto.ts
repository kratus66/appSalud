import {
  IsString, IsNotEmpty, IsIn, IsDateString, IsOptional, IsUUID,
  IsArray, ValidateNested, ArrayMinSize,
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
