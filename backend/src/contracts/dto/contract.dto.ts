import { IsString, IsInt, IsOptional, MaxLength, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateContractDto {
  @ApiProperty({ example: 'Contrato 48 Horas Semanales' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 48, description: 'Horas semanales laborales' })
  @IsInt()
  @Min(1)
  @Max(168)
  weeklyHours: number;

  @ApiProperty({ example: 5, description: 'Máximo de noches consecutivas permitidas' })
  @IsInt()
  @Min(0)
  @Max(30)
  maxConsecutiveNights: number;

  @ApiProperty({ example: 12, description: 'Horas de descanso requeridas entre turnos' })
  @IsInt()
  @Min(0)
  @Max(72)
  requiredRestHours: number;

  @ApiPropertyOptional({ example: '{"allowOvertimeOnWeekends": true, "maxDailyHours": 12}' })
  @IsOptional()
  @IsString()
  rulesConfig?: string;

  @ApiProperty({ example: 'inst-uuid' })
  @IsString()
  institutionId: string;
}

export class UpdateContractDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(168)
  weeklyHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(30)
  maxConsecutiveNights?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(72)
  requiredRestHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rulesConfig?: string;
}
