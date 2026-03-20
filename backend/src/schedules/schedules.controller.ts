import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '../common/enums';
import {
  CreateScheduleDto,
  UpdateScheduleDto,
  CreateShiftAssignmentDto,
  BulkAssignDto,
  RejectScheduleDto,
  GenerateScheduleDto,
  MarkAbsenceDto,
  CreatePeakHourConfigDto,
  UpdatePeakHourConfigDto,
} from './dto/schedule.dto';

@Controller('schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  @Post()
  @Roles(UserRole.ADMIN, UserRole.PLANIFICADOR, UserRole.SUPER_ADMIN)
  create(@Body() dto: CreateScheduleDto, @GetUser() user: any) {
    return this.schedulesService.create(dto, user);
  }

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.PLANIFICADOR,
    UserRole.APROBADOR,
    UserRole.SUPER_ADMIN,
  )
  findAll(@GetUser() user: any) {
    return this.schedulesService.findAll(user);
  }

  // ─── PEAK HOURS (antes de :id para evitar conflicto de rutas) ──

  @Get('peak-hours')
  @Roles(UserRole.ADMIN, UserRole.PLANIFICADOR, UserRole.APROBADOR, UserRole.SUPER_ADMIN)
  getPeakHours(@Query('serviceId') serviceId: string, @GetUser() user: any) {
    return this.schedulesService.getPeakHours(serviceId || undefined, user);
  }

  @Post('peak-hours')
  @Roles(UserRole.ADMIN, UserRole.PLANIFICADOR, UserRole.SUPER_ADMIN)
  createPeakHour(@Body() dto: CreatePeakHourConfigDto, @GetUser() user: any) {
    return this.schedulesService.createPeakHour(dto, user);
  }

  @Put('peak-hours/:peakId')
  @Roles(UserRole.ADMIN, UserRole.PLANIFICADOR, UserRole.SUPER_ADMIN)
  updatePeakHour(
    @Param('peakId') id: string,
    @Body() dto: UpdatePeakHourConfigDto,
    @GetUser() user: any,
  ) {
    return this.schedulesService.updatePeakHour(id, dto, user);
  }

  @Delete('peak-hours/:peakId')
  @Roles(UserRole.ADMIN, UserRole.PLANIFICADOR, UserRole.SUPER_ADMIN)
  deletePeakHour(@Param('peakId') id: string, @GetUser() user: any) {
    return this.schedulesService.deletePeakHour(id, user);
  }

  // ─── CRUD (:id) ────────────────────────────────────────────────

  @Get(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.PLANIFICADOR,
    UserRole.APROBADOR,
    UserRole.SUPER_ADMIN,
  )
  findOne(@Param('id') id: string, @GetUser() user: any) {
    return this.schedulesService.findOne(id, user);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.PLANIFICADOR, UserRole.SUPER_ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateScheduleDto,
    @GetUser() user: any,
  ) {
    return this.schedulesService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.PLANIFICADOR, UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string, @GetUser() user: any) {
    return this.schedulesService.remove(id, user);
  }

  // ─── ASSIGNMENTS ──────────────────────────────────────────────────────────

  @Post(':id/assignments/bulk')
  @Roles(UserRole.ADMIN, UserRole.PLANIFICADOR, UserRole.SUPER_ADMIN)
  bulkAssign(
    @Param('id') id: string,
    @Body() dto: BulkAssignDto,
    @GetUser() user: any,
  ) {
    return this.schedulesService.bulkAssign(id, dto, user);
  }

  @Put(':id/assignments/:assignmentId')
  @Roles(UserRole.ADMIN, UserRole.PLANIFICADOR, UserRole.SUPER_ADMIN)
  updateAssignment(
    @Param('id') scheduleId: string,
    @Param('assignmentId') assignmentId: string,
    @Body() dto: CreateShiftAssignmentDto,
    @GetUser() user: any,
  ) {
    return this.schedulesService.updateAssignment(scheduleId, assignmentId, dto, user);
  }

  @Delete(':id/assignments/:assignmentId')
  @Roles(UserRole.ADMIN, UserRole.PLANIFICADOR, UserRole.SUPER_ADMIN)
  removeAssignment(
    @Param('id') scheduleId: string,
    @Param('assignmentId') assignmentId: string,
    @GetUser() user: any,
  ) {
    return this.schedulesService.removeAssignment(scheduleId, assignmentId, user);
  }

  // ─── WORKFLOW ─────────────────────────────────────────────────────────────

  @Post(':id/validate')
  @Roles(UserRole.ADMIN, UserRole.PLANIFICADOR, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  validate(@Param('id') id: string, @GetUser() user: any) {
    return this.schedulesService.validate(id, user);
  }

  @Post(':id/submit')
  @Roles(UserRole.ADMIN, UserRole.PLANIFICADOR, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  submit(@Param('id') id: string, @GetUser() user: any) {
    return this.schedulesService.submit(id, user);
  }

  @Post(':id/approve')
  @Roles(UserRole.ADMIN, UserRole.APROBADOR, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  approve(@Param('id') id: string, @GetUser() user: any) {
    return this.schedulesService.approve(id, user);
  }

  @Post(':id/reject')
  @Roles(UserRole.ADMIN, UserRole.APROBADOR, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  reject(
    @Param('id') id: string,
    @Body() dto: RejectScheduleDto,
    @GetUser() user: any,
  ) {
    return this.schedulesService.reject(id, dto, user);
  }

  // ─── QUERIES ──────────────────────────────────────────────────────────────

  @Get(':id/violations')
  @Roles(
    UserRole.ADMIN,
    UserRole.PLANIFICADOR,
    UserRole.APROBADOR,
    UserRole.SUPER_ADMIN,
  )
  getViolations(@Param('id') id: string, @GetUser() user: any) {
    return this.schedulesService.getViolations(id, user);
  }

  @Get(':id/summary')
  @Roles(
    UserRole.ADMIN,
    UserRole.PLANIFICADOR,
    UserRole.APROBADOR,
    UserRole.SUPER_ADMIN,
  )
  getSummary(@Param('id') id: string, @GetUser() user: any) {
    return this.schedulesService.getSummary(id, user);
  }

  // ─── GENERATE ─────────────────────────────────────────────

  @Post(':id/generate')
  @Roles(UserRole.ADMIN, UserRole.PLANIFICADOR, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  generate(
    @Param('id') id: string,
    @Body() dto: GenerateScheduleDto,
    @GetUser() user: any,
  ) {
    return this.schedulesService.generate(id, dto, user);
  }

  // ─── ABSENCES ───────────────────────────────────────────────

  @Put(':id/assignments/:assignmentId/absence')
  @Roles(UserRole.ADMIN, UserRole.PLANIFICADOR, UserRole.SUPER_ADMIN)
  markAbsence(
    @Param('id') scheduleId: string,
    @Param('assignmentId') assignmentId: string,
    @Body() dto: MarkAbsenceDto,
    @GetUser() user: any,
  ) {
    return this.schedulesService.markAbsence(scheduleId, assignmentId, dto, user);
  }

  @Delete(':id/assignments/:assignmentId/absence')
  @Roles(UserRole.ADMIN, UserRole.PLANIFICADOR, UserRole.SUPER_ADMIN)
  removeAbsence(
    @Param('id') scheduleId: string,
    @Param('assignmentId') assignmentId: string,
    @GetUser() user: any,
  ) {
    return this.schedulesService.removeAbsence(scheduleId, assignmentId, user);
  }
}
