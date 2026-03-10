import { IsString, IsOptional, MinLength, MaxLength, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateSpecialtyDto {
  @ApiProperty({ example: 'Cardiología', description: 'Nombre de la especialidad' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Diagnóstico y tratamiento de enfermedades del corazón' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: '#e74c3c', description: 'Color identificador (hex)' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'ID de institución (solo SUPER_ADMIN)' })
  @IsOptional()
  @IsString()
  institutionId?: string;
}

export class UpdateSpecialtyDto extends PartialType(CreateSpecialtyDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
