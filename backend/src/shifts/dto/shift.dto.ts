import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, Matches, MaxLength, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShiftType } from '../../common/enums';

export class CreateShiftDto {
  @ApiProperty({ example: 'Mañana' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @ApiProperty({ example: '07:00', description: 'Formato HH:MM' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime debe estar en formato HH:MM (ej: 07:00)',
  })
  startTime: string;

  @ApiProperty({ example: '15:00', description: 'Formato HH:MM' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime debe estar en formato HH:MM (ej: 15:00)',
  })
  endTime: string;

  @ApiProperty({ enum: ShiftType, example: ShiftType.MORNING })
  @IsEnum(ShiftType)
  @IsNotEmpty()
  shiftType: ShiftType;

  @ApiPropertyOptional({ example: '#3b82f6', default: '#3b82f6' })
  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6})$/, {
    message: 'Color debe estar en formato hexadecimal (ej: #3b82f6)',
  })
  color?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'ID de la institución (solo para SUPER_ADMIN)' })
  @IsOptional()
  @IsUUID()
  institutionId?: string;
}

export class UpdateShiftDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ description: 'Formato HH:MM' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime debe estar en formato HH:MM (ej: 07:00)',
  })
  startTime?: string;

  @ApiPropertyOptional({ description: 'Formato HH:MM' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime debe estar en formato HH:MM (ej: 15:00)',
  })
  endTime?: string;

  @ApiPropertyOptional({ enum: ShiftType })
  @IsOptional()
  @IsEnum(ShiftType)
  shiftType?: ShiftType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6})$/, {
    message: 'Color debe estar en formato hexadecimal (ej: #3b82f6)',
  })
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
