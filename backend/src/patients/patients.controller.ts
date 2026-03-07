import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { CreatePatientDto, UpdatePatientDto } from './dto/patient.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '../common/enums';

@ApiTags('patients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPCIONISTA)
  @ApiOperation({ summary: 'Crear paciente' })
  @ApiResponse({ status: 201, description: 'Paciente creado exitosamente' })
  create(@Body() dto: CreatePatientDto, @GetUser() user: any) {
    return this.patientsService.create(dto, user.id, user.role, user.institutionId);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPCIONISTA, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Listar pacientes' })
  @ApiResponse({ status: 200, description: 'Lista de pacientes' })
  findAll(@GetUser() user: any, @Query('search') search?: string) {
    return this.patientsService.findAll(user.role, user.institutionId, { search });
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPCIONISTA, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Obtener paciente por ID' })
  @ApiResponse({ status: 200, description: 'Paciente encontrado' })
  findOne(@Param('id') id: string, @GetUser() user: any) {
    return this.patientsService.findOne(id, user.role, user.institutionId);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPCIONISTA)
  @ApiOperation({ summary: 'Actualizar paciente' })
  @ApiResponse({ status: 200, description: 'Paciente actualizado' })
  update(@Param('id') id: string, @Body() dto: UpdatePatientDto, @GetUser() user: any) {
    return this.patientsService.update(id, dto, user.id, user.role, user.institutionId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPCIONISTA)
  @ApiOperation({ summary: 'Eliminar paciente (soft delete)' })
  @ApiResponse({ status: 200, description: 'Paciente eliminado' })
  delete(@Param('id') id: string, @GetUser() user: any) {
    return this.patientsService.delete(id, user.id, user.role, user.institutionId);
  }
}
