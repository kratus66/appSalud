import {
  Controller, Get, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { AnalyticsService } from './analytics.service';
import { GetUser } from '../auth/decorators/get-user.decorator';

const ALL_STAFF = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.PLANIFICADOR,
  UserRole.APROBADOR,
  UserRole.CONSULTA,
];

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @Roles(...ALL_STAFF)
  @ApiOperation({ summary: 'KPIs globales del sistema' })
  async getOverview(@GetUser() user: any) {
    const institutionId =
      user.role === UserRole.SUPER_ADMIN ? undefined : user.institutionId;
    return this.analyticsService.getOverview(institutionId);
  }

  @Get('appointments/by-status')
  @Roles(...ALL_STAFF)
  @ApiOperation({ summary: 'Conteo de citas por estado' })
  async getByStatus(@GetUser() user: any) {
    const institutionId =
      user.role === UserRole.SUPER_ADMIN ? undefined : user.institutionId;
    return this.analyticsService.getAppointmentsByStatus(institutionId);
  }

  @Get('appointments/by-period')
  @Roles(...ALL_STAFF)
  @ApiOperation({ summary: 'Citas por período (week|month|year)' })
  @ApiQuery({ name: 'period', enum: ['week', 'month', 'year'], required: false })
  async getByPeriod(
    @Query('period') period: 'week' | 'month' | 'year' = 'month',
    @GetUser() user: any,
  ) {
    const institutionId =
      user.role === UserRole.SUPER_ADMIN ? undefined : user.institutionId;
    return this.analyticsService.getAppointmentsByPeriod(period, institutionId);
  }

  @Get('doctors/top')
  @Roles(...ALL_STAFF)
  @ApiOperation({ summary: 'Top médicos por número de citas' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTopDoctors(
    @Query('limit') limit: number = 10,
    @GetUser() user: any,
  ) {
    const institutionId =
      user.role === UserRole.SUPER_ADMIN ? undefined : user.institutionId;
    return this.analyticsService.getTopDoctors(institutionId, +limit);
  }

  @Get('patients/stats')
  @Roles(...ALL_STAFF)
  @ApiOperation({ summary: 'Estadísticas de pacientes' })
  async getPatientStats(@GetUser() user: any) {
    const institutionId =
      user.role === UserRole.SUPER_ADMIN ? undefined : user.institutionId;
    return this.analyticsService.getPatientStats(institutionId);
  }

  @Get('appointments/by-specialty')
  @Roles(...ALL_STAFF)
  @ApiOperation({ summary: 'Distribución de citas por especialidad' })
  async getBySpecialty(@GetUser() user: any) {
    const institutionId =
      user.role === UserRole.SUPER_ADMIN ? undefined : user.institutionId;
    return this.analyticsService.getAppointmentsBySpecialty(institutionId);
  }

  @Get('appointments/hourly')
  @Roles(...ALL_STAFF)
  @ApiOperation({ summary: 'Distribución horaria de citas' })
  async getHourly(@GetUser() user: any) {
    const institutionId =
      user.role === UserRole.SUPER_ADMIN ? undefined : user.institutionId;
    return this.analyticsService.getHourlyDistribution(institutionId);
  }
}

