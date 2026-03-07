import { IsString, IsDateString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHolidayDto {
  @ApiProperty({ example: '2026-01-01', description: 'Fecha del festivo en formato ISO (YYYY-MM-DD)' })
  @IsDateString()
  holidayDate: string;

  @ApiProperty({ example: 'Año Nuevo' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'CO', description: 'Código de país ISO (CO para Colombia)' })
  @IsString()
  @MaxLength(2)
  countryCode: string;

  @ApiPropertyOptional({ example: 'inst-uuid', description: 'ID de institución (null para festivos nacionales)' })
  @IsOptional()
  @IsString()
  institutionId?: string;
}

export class UpdateHolidayDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  holidayDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2)
  countryCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  institutionId?: string;
}
