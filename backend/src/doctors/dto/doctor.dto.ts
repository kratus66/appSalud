import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateDoctorDto {
  // ── Datos de usuario ──────────────────────────────────
  @ApiProperty({ example: 'Alejandro', description: 'Nombre(s) del médico' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  firstName: string;

  @ApiProperty({ example: 'Vargas', description: 'Apellido(s) del médico' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  lastName: string;

  @ApiProperty({ example: 'dr.vargas@clinica.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Doctor123!', description: 'Contraseña inicial' })
  @IsString()
  @MinLength(8)
  password: string;

  // ── Datos del perfil médico ────────────────────────────
  @ApiProperty({ description: 'ID de la especialidad' })
  @IsString()
  specialtyId: string;

  @ApiPropertyOptional({ example: '12345-COLMED', description: 'Número de tarjeta profesional' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  licenseNumber?: string;

  @ApiPropertyOptional({ example: '+57 300 123 4567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Consultorio 203 - Piso 2' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  consultingRoom?: string;

  @ApiPropertyOptional({ example: 'Especialista con 10 años de experiencia en...' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @ApiPropertyOptional({ description: 'ID de institución (solo SUPER_ADMIN)' })
  @IsOptional()
  @IsString()
  institutionId?: string;
}

export class UpdateDoctorDto {
  // ── Datos de usuario opcionales ───────────────────────
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Nueva contraseña (dejar en blanco para no cambiar)' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  // ── Datos del perfil médico ────────────────────────────
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialtyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  licenseNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  consultingRoom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
