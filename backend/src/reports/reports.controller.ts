import {
  Controller, Get, Query, UseGuards, Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '../common/enums';
import { ReportsService } from './reports.service';

const REPORT_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN];

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  private getInstitutionId(user: any): string | undefined {
    return user.role === UserRole.SUPER_ADMIN ? undefined : user.institutionId;
  }

  private parseDateParam(value?: string): Date | undefined {
    if (!value) return undefined;
    const d = new Date(value);
    return isNaN(d.getTime()) ? undefined : d;
  }

  // ─── GET /reports/overview ────────────────────────────────────────────────

  @Get('overview')
  @Roles(...REPORT_ROLES)
  @ApiOperation({ summary: 'KPIs generales de reportes' })
  async getOverview(@GetUser() user: any) {
    return this.reportsService.getOverview(this.getInstitutionId(user));
  }

  // ─── GET /reports/appointments-by-day ─────────────────────────────────────

  @Get('appointments-by-day')
  @Roles(...REPORT_ROLES)
  @ApiOperation({ summary: 'Citas agrupadas por día en un rango de fechas' })
  @ApiQuery({ name: 'startDate', required: false, example: '2026-01-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2026-01-31' })
  async getAppointmentsByDay(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @GetUser() user: any,
  ) {
    const start = this.parseDateParam(startDate) ?? (() => {
      const d = new Date(); d.setDate(d.getDate() - 30); d.setHours(0, 0, 0, 0); return d;
    })();
    const end = this.parseDateParam(endDate) ?? new Date();
    return this.reportsService.getAppointmentsByDay(start, end, this.getInstitutionId(user));
  }

  // ─── GET /reports/appointments-by-doctor ──────────────────────────────────

  @Get('appointments-by-doctor')
  @Roles(...REPORT_ROLES)
  @ApiOperation({ summary: 'Citas agrupadas por médico' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getAppointmentsByDoctor(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @GetUser() user: any,
  ) {
    return this.reportsService.getAppointmentsByDoctor(
      this.getInstitutionId(user),
      this.parseDateParam(startDate),
      this.parseDateParam(endDate),
    );
  }

  // ─── GET /reports/patients-attended ──────────────────────────────────────

  @Get('patients-attended')
  @Roles(...REPORT_ROLES)
  @ApiOperation({ summary: 'Pacientes atendidos (citas completadas)' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getPatientsAttended(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @GetUser() user: any,
  ) {
    return this.reportsService.getPatientsAttended(
      this.getInstitutionId(user),
      this.parseDateParam(startDate),
      this.parseDateParam(endDate),
    );
  }

  // ─── GET /reports/table ───────────────────────────────────────────────────

  @Get('table')
  @Roles(...REPORT_ROLES)
  @ApiOperation({ summary: 'Tabla de citas para reporte' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getTable(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @GetUser() user: any,
  ) {
    return this.reportsService.getReportTable(
      this.getInstitutionId(user),
      this.parseDateParam(startDate),
      this.parseDateParam(endDate),
    );
  }

  // ─── GET /reports/export ──────────────────────────────────────────────────

  @Get('export')
  @Roles(...REPORT_ROLES)
  @ApiOperation({ summary: 'Exportar reporte en CSV' })
  @ApiQuery({ name: 'type', enum: ['appointments', 'patients', 'doctors'], required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async exportCsv(
    @Query('type') type: 'appointments' | 'patients' | 'doctors' = 'appointments',
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @GetUser() user: any,
    @Res() res: Response,
  ) {
    const csv = await this.reportsService.exportCsv(
      type,
      this.getInstitutionId(user),
      this.parseDateParam(startDate),
      this.parseDateParam(endDate),
    );

    const filename = `reporte-${type}-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv); // BOM para Excel
  }
}
