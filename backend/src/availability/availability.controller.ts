import {
  Controller, Get, Post, Delete, Body, Param,
  Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AvailabilityService } from './availability.service';
import {
  CreateScheduleDto,
  CreateBlockDto,
  CreateRecurringAppointmentDto,
} from './dto/availability.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '../common/enums';

@ApiTags('availability')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  // ─── Doctor Schedules ─────────────────────────────────────────

  @Post('schedule')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear o actualizar horario laboral de un médico' })
  createOrUpdateSchedule(@Body() dto: CreateScheduleDto, @GetUser() user: any) {
    return this.availabilityService.createOrUpdateSchedule(dto, user.id, user.institutionId);
  }

  @Get('schedule/:doctorId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPCIONISTA, UserRole.DOCTOR, UserRole.PLANIFICADOR)
  @ApiOperation({ summary: 'Obtener horario laboral de un médico' })
  getSchedule(@Param('doctorId') doctorId: string, @GetUser() user: any) {
    return this.availabilityService.getScheduleByDoctor(doctorId, user.institutionId);
  }

  @Delete('schedule/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar un horario' })
  deleteSchedule(@Param('id') id: string, @GetUser() user: any) {
    return this.availabilityService.deleteSchedule(id, user.id, user.institutionId);
  }

  // ─── Time Blocks ──────────────────────────────────────────────

  @Post('block')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPCIONISTA)
  @ApiOperation({ summary: 'Crear bloqueo de agenda' })
  createBlock(@Body() dto: CreateBlockDto, @GetUser() user: any) {
    return this.availabilityService.createBlock(dto, user.id, user.institutionId);
  }

  @Get('block/:doctorId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPCIONISTA, UserRole.DOCTOR, UserRole.PLANIFICADOR)
  @ApiOperation({ summary: 'Ver bloqueos de un médico' })
  @ApiQuery({ name: 'from', required: false, example: '2026-03-01' })
  getBlocks(
    @Param('doctorId') doctorId: string,
    @Query('from') from: string,
    @GetUser() user: any,
  ) {
    return this.availabilityService.getBlocksByDoctor(doctorId, user.institutionId, from);
  }

  @Delete('block/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPCIONISTA)
  @ApiOperation({ summary: 'Eliminar bloqueo' })
  deleteBlock(@Param('id') id: string, @GetUser() user: any) {
    return this.availabilityService.deleteBlock(id, user.id, user.institutionId);
  }

  // ─── Availability Slots ───────────────────────────────────────

  @Get('slots/:doctorId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPCIONISTA, UserRole.DOCTOR, UserRole.PLANIFICADOR)
  @ApiOperation({ summary: 'Obtener slots de disponibilidad de un médico en una fecha' })
  @ApiQuery({ name: 'date', required: true, example: '2026-03-10' })
  getSlots(
    @Param('doctorId') doctorId: string,
    @Query('date') date: string,
    @GetUser() user: any,
  ) {
    return this.availabilityService.getAvailabilitySlots(doctorId, date, user.institutionId);
  }

  // ─── Recurring Appointments ───────────────────────────────────

  @Post('recurring')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPCIONISTA)
  @ApiOperation({ summary: 'Crear cita recurrente' })
  createRecurring(@Body() dto: CreateRecurringAppointmentDto, @GetUser() user: any) {
    return this.availabilityService.createRecurringAppointment(dto, user.id, user.institutionId);
  }

  @Get('recurring/:doctorId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPCIONISTA, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Ver citas recurrentes de un médico' })
  getRecurring(@Param('doctorId') doctorId: string, @GetUser() user: any) {
    return this.availabilityService.getRecurringByDoctor(doctorId, user.institutionId);
  }

  @Delete('recurring/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPCIONISTA)
  @ApiOperation({ summary: 'Cancelar cita recurrente y sus futuras instancias' })
  cancelRecurring(@Param('id') id: string, @GetUser() user: any) {
    return this.availabilityService.cancelRecurring(id, user.id, user.institutionId);
  }
}
