import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentStatus } from '../common/enums';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // ─── 1. Overview ─────────────────────────────────────────────────────────

  async getOverview(institutionId?: string) {
    const apptWhere: any = { deletedAt: null };
    const patWhere: any = { deletedAt: null };
    const docWhere: any = { role: 'DOCTOR', isActive: true, deletedAt: null };

    if (institutionId) {
      apptWhere.institutionId = institutionId;
      patWhere.institutionId = institutionId;
      docWhere.institutionId = institutionId;
    }

    const [
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      noShowAppointments,
      totalPatients,
      activeDoctors,
    ] = await Promise.all([
      this.prisma.appointment.count({ where: apptWhere }),
      this.prisma.appointment.count({ where: { ...apptWhere, status: AppointmentStatus.COMPLETED } }),
      this.prisma.appointment.count({ where: { ...apptWhere, status: AppointmentStatus.CANCELLED } }),
      this.prisma.appointment.count({ where: { ...apptWhere, status: AppointmentStatus.NO_SHOW } }),
      this.prisma.patient.count({ where: patWhere }),
      this.prisma.user.count({ where: docWhere }),
    ]);

    const noShowRate = totalAppointments > 0
      ? Math.round((noShowAppointments / totalAppointments) * 100)
      : 0;
    const cancelRate = totalAppointments > 0
      ? Math.round((cancelledAppointments / totalAppointments) * 100)
      : 0;
    const completionRate = totalAppointments > 0
      ? Math.round((completedAppointments / totalAppointments) * 100)
      : 0;

    return {
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      noShowAppointments,
      totalPatients,
      activeDoctors,
      noShowRate,
      cancelRate,
      completionRate,
    };
  }

  // ─── 2. Appointments by day ────────────────────────────────────────────────

  async getAppointmentsByDay(startDate: Date, endDate: Date, institutionId?: string) {
    const where: any = {
      deletedAt: null,
      appointmentDate: { gte: startDate, lte: endDate },
    };
    if (institutionId) where.institutionId = institutionId;

    const appointments = await this.prisma.appointment.findMany({
      where,
      select: { appointmentDate: true, status: true },
      orderBy: { appointmentDate: 'asc' },
    });

    const grouped: Record<string, { date: string; count: number; completed: number; cancelled: number; noShow: number }> = {};

    appointments.forEach((a) => {
      const key = a.appointmentDate.toISOString().split('T')[0];
      if (!grouped[key]) grouped[key] = { date: key, count: 0, completed: 0, cancelled: 0, noShow: 0 };
      grouped[key].count++;
      if (a.status === AppointmentStatus.COMPLETED) grouped[key].completed++;
      if (a.status === AppointmentStatus.CANCELLED) grouped[key].cancelled++;
      if (a.status === AppointmentStatus.NO_SHOW) grouped[key].noShow++;
    });

    return Object.values(grouped);
  }

  // ─── 3. Appointments by doctor ────────────────────────────────────────────

  async getAppointmentsByDoctor(institutionId?: string, startDate?: Date, endDate?: Date) {
    const where: any = { deletedAt: null };
    if (institutionId) where.institutionId = institutionId;
    if (startDate || endDate) {
      where.appointmentDate = {};
      if (startDate) where.appointmentDate.gte = startDate;
      if (endDate) where.appointmentDate.lte = endDate;
    }

    const groups = await this.prisma.appointment.groupBy({
      by: ['doctorId'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    if (groups.length === 0) return [];

    const doctorIds = groups.map((g) => g.doctorId);
    const doctors = await this.prisma.user.findMany({
      where: { id: { in: doctorIds } },
      select: { id: true, firstName: true, lastName: true, specialty: true },
    });

    return groups.map((g) => {
      const doc = doctors.find((d) => d.id === g.doctorId);
      return {
        doctorId: g.doctorId,
        doctor: doc ? `${doc.firstName} ${doc.lastName}` : 'Desconocido',
        specialty: doc?.specialty || '',
        count: g._count.id,
      };
    });
  }

  // ─── 4. Patients attended ─────────────────────────────────────────────────

  async getPatientsAttended(institutionId?: string, startDate?: Date, endDate?: Date) {
    const where: any = { status: AppointmentStatus.COMPLETED, deletedAt: null };
    if (institutionId) where.institutionId = institutionId;
    if (startDate || endDate) {
      where.appointmentDate = {};
      if (startDate) where.appointmentDate.gte = startDate;
      if (endDate) where.appointmentDate.lte = endDate;
    }

    const distinctPatients = await this.prisma.appointment.findMany({
      where,
      select: { patientId: true },
      distinct: ['patientId'],
    });

    const totalAttended = await this.prisma.appointment.count({ where });

    return {
      uniquePatients: distinctPatients.length,
      totalAttended,
    };
  }

  // ─── 5. Report table (appointments list) ─────────────────────────────────

  async getReportTable(institutionId?: string, startDate?: Date, endDate?: Date, take = 100) {
    const where: any = { deletedAt: null };
    if (institutionId) where.institutionId = institutionId;
    if (startDate || endDate) {
      where.appointmentDate = {};
      if (startDate) where.appointmentDate.gte = startDate;
      if (endDate) where.appointmentDate.lte = endDate;
    }

    const appointments = await this.prisma.appointment.findMany({
      where,
      orderBy: { appointmentDate: 'desc' },
      take,
      select: {
        id: true,
        appointmentDate: true,
        startTime: true,
        status: true,
        reason: true,
        patient: { select: { firstName: true, lastName: true, documentNumber: true } },
        doctor: { select: { firstName: true, lastName: true } },
      },
    });

    return appointments.map((a) => ({
      id: a.id,
      date: a.appointmentDate.toISOString().split('T')[0],
      time: a.startTime,
      patient: `${a.patient.firstName} ${a.patient.lastName}`,
      patientDoc: a.patient.documentNumber,
      doctor: `${a.doctor.firstName} ${a.doctor.lastName}`,
      status: a.status,
      reason: a.reason || '',
    }));
  }

  // ─── 6. Export CSV ────────────────────────────────────────────────────────

  async exportCsv(
    type: 'appointments' | 'patients' | 'doctors',
    institutionId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<string> {
    if (type === 'appointments') {
      const rows = await this.getReportTable(institutionId, startDate, endDate, 10000);
      const header = 'Fecha,Hora,Paciente,Documento,Doctor,Estado,Motivo\n';
      const body = rows
        .map((r) =>
          [r.date, r.time, `"${r.patient}"`, r.patientDoc, `"${r.doctor}"`, r.status, `"${r.reason}"`].join(','),
        )
        .join('\n');
      return header + body;
    }

    if (type === 'doctors') {
      const rows = await this.getAppointmentsByDoctor(institutionId, startDate, endDate);
      const header = 'Doctor,Especialidad,Total Citas\n';
      const body = rows.map((r) => [`"${r.doctor}"`, `"${r.specialty}"`, r.count].join(',')).join('\n');
      return header + body;
    }

    // patients
    const patWhere: any = { deletedAt: null };
    if (institutionId) patWhere.institutionId = institutionId;
    if (startDate || endDate) {
      patWhere.createdAt = {};
      if (startDate) patWhere.createdAt.gte = startDate;
      if (endDate) patWhere.createdAt.lte = endDate;
    }

    const patients = await this.prisma.patient.findMany({
      where: patWhere,
      select: {
        firstName: true,
        lastName: true,
        documentType: true,
        documentNumber: true,
        email: true,
        phone: true,
        gender: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10000,
    });

    const header = 'Nombre,Apellido,Tipo Doc,Documento,Email,Teléfono,Género,Registrado\n';
    const body = patients
      .map((p) =>
        [
          `"${p.firstName}"`,
          `"${p.lastName}"`,
          p.documentType,
          p.documentNumber,
          p.email || '',
          p.phone || '',
          p.gender || '',
          p.createdAt.toISOString().split('T')[0],
        ].join(','),
      )
      .join('\n');
    return header + body;
  }
}
