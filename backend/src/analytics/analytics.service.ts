import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentStatus } from '../common/enums';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  // ─── 1. Overview global KPIs ─────────────────────────────────────────────

  async getOverview(institutionId?: string) {
    const where = institutionId ? { institutionId } : {};
    const apptWhere = institutionId ? { institutionId } : {};

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalPatients,
      totalDoctors,
      totalInstitutions,
      totalAppointments,
      appointmentsToday,
      appointmentsThisWeek,
      appointmentsThisMonth,
      cancelledCount,
      completedCount,
    ] = await Promise.all([
      this.prisma.patient.count({ where }),
      this.prisma.user.count({
        where: { ...where, role: 'DOCTOR', isActive: true },
      }),
      this.prisma.institution.count(),
      this.prisma.appointment.count({ where: apptWhere }),
      this.prisma.appointment.count({
        where: {
          ...apptWhere,
          appointmentDate: { gte: today, lt: tomorrow },
        },
      }),
      this.prisma.appointment.count({
        where: {
          ...apptWhere,
          appointmentDate: { gte: startOfWeek },
        },
      }),
      this.prisma.appointment.count({
        where: {
          ...apptWhere,
          appointmentDate: { gte: startOfMonth },
        },
      }),
      this.prisma.appointment.count({
        where: { ...apptWhere, status: AppointmentStatus.CANCELLED },
      }),
      this.prisma.appointment.count({
        where: { ...apptWhere, status: AppointmentStatus.COMPLETED },
      }),
    ]);

    const cancelRate =
      totalAppointments > 0
        ? Math.round((cancelledCount / totalAppointments) * 100)
        : 0;
    const completionRate =
      totalAppointments > 0
        ? Math.round((completedCount / totalAppointments) * 100)
        : 0;

    return {
      totalPatients,
      totalDoctors,
      totalInstitutions,
      totalAppointments,
      appointmentsToday,
      appointmentsThisWeek,
      appointmentsThisMonth,
      cancelRate,
      completionRate,
    };
  }

  // ─── 2. Appointments by status ────────────────────────────────────────────

  async getAppointmentsByStatus(institutionId?: string) {
    const where = institutionId ? { institutionId } : {};

    const groups = await this.prisma.appointment.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    });

    // Ensure all statuses appear even if count is 0
    const allStatuses = Object.values(AppointmentStatus);
    const result: Record<string, number> = {};
    allStatuses.forEach((s) => (result[s] = 0));
    groups.forEach((g) => (result[g.status] = g._count.id));

    return result;
  }

  // ─── 3. Appointments by period (last N days) ──────────────────────────────

  async getAppointmentsByPeriod(
    period: 'week' | 'month' | 'year',
    institutionId?: string,
  ) {
    const where = institutionId ? { institutionId } : {};

    const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
    const from = new Date();
    from.setDate(from.getDate() - days);
    from.setHours(0, 0, 0, 0);

    const appointments = await this.prisma.appointment.findMany({
      where: { ...where, appointmentDate: { gte: from } },
      select: { appointmentDate: true, status: true },
      orderBy: { appointmentDate: 'asc' },
    });

    // Group by date string
    const grouped: Record<string, { total: number; completed: number; cancelled: number }> = {};
    appointments.forEach((a) => {
      const key = a.appointmentDate.toISOString().split('T')[0];
      if (!grouped[key]) grouped[key] = { total: 0, completed: 0, cancelled: 0 };
      grouped[key].total++;
      if (a.status === AppointmentStatus.COMPLETED) grouped[key].completed++;
      if (a.status === AppointmentStatus.CANCELLED) grouped[key].cancelled++;
    });

    return Object.entries(grouped).map(([date, counts]) => ({
      date,
      ...counts,
    }));
  }

  // ─── 4. Top doctors by appointment count ─────────────────────────────────

  async getTopDoctors(institutionId?: string, limit = 10) {
    const where = institutionId ? { institutionId } : {};

    const groups = await this.prisma.appointment.groupBy({
      by: ['doctorId'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
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
        name: doc ? `${doc.firstName} ${doc.lastName}` : 'Desconocido',
        specialty: doc?.specialty || '',
        totalAppointments: g._count.id,
      };
    });
  }

  // ─── 5. Patient stats ─────────────────────────────────────────────────────

  async getPatientStats(institutionId?: string) {
    const where = institutionId ? { institutionId } : {};

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const startOfLastMonth = new Date(startOfMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

    const [
      total,
      newThisMonth,
      newLastMonth,
      withAppointments,
      withRecurring,
    ] = await Promise.all([
      this.prisma.patient.count({ where }),
      this.prisma.patient.count({
        where: { ...where, createdAt: { gte: startOfMonth } },
      }),
      this.prisma.patient.count({
        where: {
          ...where,
          createdAt: { gte: startOfLastMonth, lt: startOfMonth },
        },
      }),
      this.prisma.appointment.groupBy({
        by: ['patientId'],
        where,
        _count: { id: true },
      }).then((g) => g.length),
      this.prisma.recurringAppointment
        ? this.prisma.recurringAppointment.groupBy({
            by: ['patientId'],
            where: { ...(institutionId ? { institutionId } : {}), isActive: true },
          }).then((g) => g.length)
        : Promise.resolve(0),
    ]);

    const growthRate =
      newLastMonth > 0
        ? Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100)
        : newThisMonth > 0 ? 100 : 0;

    return {
      total,
      newThisMonth,
      newLastMonth,
      growthRate,
      withAppointments,
      withRecurring,
    };
  }

  // ─── 6. Appointments by specialty ─────────────────────────────────────────

  async getAppointmentsBySpecialty(institutionId?: string) {
    const where = institutionId ? { institutionId } : {};

    const appointments = await this.prisma.appointment.findMany({
      where,
      select: {
        doctor: {
          select: { specialty: true },
        },
      },
    });

    const grouped: Record<string, number> = {};
    appointments.forEach((a) => {
      const specialty = a.doctor?.specialty || 'Sin especialidad';
      grouped[specialty] = (grouped[specialty] || 0) + 1;
    });

    return Object.entries(grouped)
      .map(([specialty, count]) => ({ specialty, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  // ─── 7. Hourly distribution ───────────────────────────────────────────────

  async getHourlyDistribution(institutionId?: string) {
    const where = institutionId ? { institutionId } : {};

    const appointments = await this.prisma.appointment.findMany({
      where,
      select: { startTime: true },
    });

    const hours: Record<string, number> = {};
    for (let h = 6; h <= 20; h++) {
      hours[`${h.toString().padStart(2, '0')}:00`] = 0;
    }
    appointments.forEach((a) => {
      const hour = a.startTime.substring(0, 5).replace(/:\d+$/, ':00');
      const hNum = parseInt(a.startTime.substring(0, 2));
      const key = `${hNum.toString().padStart(2, '0')}:00`;
      if (hours[key] !== undefined) hours[key]++;
    });

    return Object.entries(hours).map(([hour, count]) => ({ hour, count }));
  }
}
