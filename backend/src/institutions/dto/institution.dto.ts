import { IsString, IsNotEmpty, IsOptional, IsEnum, IsObject, IsEmail, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InstitutionStatus, InstitutionType } from '../../common/enums';

export class CreateInstitutionDto {
  @ApiProperty({ example: 'Hospital Central' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'HOSP001' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ enum: InstitutionType, example: InstitutionType.HOSPITAL })
  @IsOptional()
  @IsEnum(InstitutionType)
  type?: InstitutionType;

  @ApiPropertyOptional({ example: 'Calle Principal 123' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Bogotá' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'CO' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: '+573001234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'contacto@hospital.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class UpdateInstitutionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: InstitutionType })
  @IsOptional()
  @IsEnum(InstitutionType)
  type?: InstitutionType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ enum: InstitutionStatus })
  @IsOptional()
  @IsEnum(InstitutionStatus)
  status?: InstitutionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: any;
}
