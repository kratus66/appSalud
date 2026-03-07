import { IsString, IsNotEmpty, IsOptional, IsEnum, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InstitutionStatus } from '../../common/enums';

export class CreateInstitutionDto {
  @ApiProperty({ example: 'Hospital Central' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'HOSP001' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({
    example: { address: 'Calle Principal 123', phone: '+1234567890' },
  })
  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class UpdateInstitutionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(InstitutionStatus)
  status?: InstitutionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: any;
}
