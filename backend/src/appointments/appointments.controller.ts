import { Controller, Get, Post, Put, Delete, Patch, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto, UpdateAppointmentDto, AppointmentFiltersDto } from './dto/appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '../common/enums';

@ApiTags('appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPCIONISTA)
  @ApiOperation({ summary: 'Crear cita' })
  @ApiResponse({ status: 201, description: 'Cita creada exitosamente' })
  create(@Body() dto: CreateAppointmentDto, @GetUser() user: any) {
    return this.appointmentsService.create(dto, user.id, user.role, user.institutionId);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPCIONISTA, UserRole.DOCTOR, UserRole.PLANIFICADOR)
  @ApiOperation({ summary: 'Listar citas con filtros' })
  @ApiResponse({ status: 200, description: 'Lista de citas' })
  @ApiQuery({ name: 'startDate', required: false, example: '2024-03-10' })
  @ApiQuery({ name: 'endDate', required: false, example: '2024-03-16' })
  @ApiQuery({ name: 'doctorId', required: false })
  @ApiQuery({ name: 'patientId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] })
  findAll(
    @GetUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('doctorId') doctorId?: string,
    @Query('patientId') patientId?: string,
    @Query('status') status?: any,
  ) {
    const filters: AppointmentFiltersDto = {
      startDate,
      endDate,
      doctorId,
      patientId,
      status,
    };
    return this.appointmentsService.findAll(user.role, user.institutionId, user.id, filters);
  }

  @Get('doctor/:doctorId/availability')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPCIONISTA, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Obtener disponibilidad de un doctor' })
  @ApiResponse({ status: 200, description: 'Horarios ocupados del doctor' })
  @ApiQuery({ name: 'date', required: true, example: '2024-03-10' })
  getDoctorAvailability(
    @Param('doctorId') doctorId: string,
    @Query('date') date: string,
  ) {
    return this.appointmentsService.getDoctorAvailability(doctorId, date);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPCIONISTA, UserRole.DOCTOR, UserRole.PLANIFICADOR)
  @ApiOperation({ summary: 'Obtener cita por ID' })
  @ApiResponse({ status: 200, description: 'Cita encontrada' })
  findOne(@Param('id') id: string, @GetUser() user: any) {
    return this.appointmentsService.findOne(id, user.role, user.institutionId, user.id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPCIONISTA)
  @ApiOperation({ summary: 'Actualizar cita' })
  @ApiResponse({ status: 200, description: 'Cita actualizada' })
  update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto, @GetUser() user: any) {
    return this.appointmentsService.update(id, dto, user.id, user.role, user.institutionId);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPCIONISTA, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Cancelar cita' })
  @ApiResponse({ status: 200, description: 'Cita cancelada' })
  cancel(@Param('id') id: string, @GetUser() user: any) {
    return this.appointmentsService.cancel(id, user.id, user.role, user.institutionId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar cita (soft delete)' })
  @ApiResponse({ status: 200, description: 'Cita eliminada' })
  delete(@Param('id') id: string, @GetUser() user: any) {
    return this.appointmentsService.delete(id, user.id, user.role, user.institutionId);
  }
}
