'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Users, Calendar, CalendarCheck,
  TrendingUp, TrendingDown, Activity, Stethoscope,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { analyticsService } from '@/services/analytics.service';

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: '#6366f1',
  CONFIRMED: '#10b981',
  COMPLETED: '#3b82f6',
  CANCELLED: '#f43f5e',
  NO_SHOW: '#f59e0b',
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Agendadas',
  CONFIRMED: 'Confirmadas',
  COMPLETED: 'Completadas',
  CANCELLED: 'Canceladas',
  NO_SHOW: 'No asistió',
};

function KpiCard({
  title, value, subtitle, icon: Icon, trend, color = 'primary',
}: {
  title: string; value: number | string; subtitle?: string;
  icon: any; trend?: number; color?: string;
}) {
  const colorMap: Record<string, string> = {
    primary: 'bg-indigo-50 text-indigo-600',
    green: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
  };
  return (
    <div className="card flex items-start gap-4">
      <div className={`p-3 rounded-xl ${colorMap[color] || colorMap.primary}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 truncate">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-sm font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}

export function AdminDashboard() {
  const { data: overview, isLoading } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: analyticsService.getOverview,
  });
  const { data: byStatus } = useQuery({
    queryKey: ['analytics', 'by-status'],
    queryFn: analyticsService.getByStatus,
  });
  const { data: byPeriod } = useQuery({
    queryKey: ['analytics', 'by-period', 'month'],
    queryFn: () => analyticsService.getByPeriod('month'),
  });
  const { data: topDoctors } = useQuery({
    queryKey: ['analytics', 'top-doctors'],
    queryFn: () => analyticsService.getTopDoctors(8),
  });
  const { data: patientStats } = useQuery({
    queryKey: ['analytics', 'patient-stats'],
    queryFn: analyticsService.getPatientStats,
  });
  const { data: bySpecialty } = useQuery({
    queryKey: ['analytics', 'by-specialty'],
    queryFn: analyticsService.getBySpecialty,
  });
  const { data: hourly } = useQuery({
    queryKey: ['analytics', 'hourly'],
    queryFn: analyticsService.getHourly,
  });

  const pieData = byStatus
    ? Object.entries(byStatus)
        .filter(([, v]) => (v as number) > 0)
        .map(([k, v]) => ({ name: STATUS_LABELS[k] || k, value: v as number, color: STATUS_COLORS[k] || '#94a3b8' }))
    : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Dashboard Analítico</h1>
        <p className="text-gray-500">Métricas en tiempo real de tu institución</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Pacientes" value={overview?.totalPatients ?? 0} subtitle={`+${patientStats?.newThisMonth || 0} este mes`} icon={Users} trend={patientStats?.growthRate} color="primary" />
        <KpiCard title="Médicos Activos" value={overview?.totalDoctors ?? 0} icon={Stethoscope} color="blue" />
        <KpiCard title="Citas Hoy" value={overview?.appointmentsToday ?? 0} subtitle={`${overview?.appointmentsThisWeek || 0} esta semana`} icon={Calendar} color="green" />
        <KpiCard title="Citas Este Mes" value={overview?.appointmentsThisMonth ?? 0} subtitle={`${overview?.completionRate || 0}% completadas`} icon={CalendarCheck} color="orange" />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card text-center"><p className="text-sm text-gray-500 mb-1">Total Citas</p><p className="text-3xl font-bold text-gray-900">{overview?.totalAppointments ?? 0}</p></div>
        <div className="card text-center"><p className="text-sm text-gray-500 mb-1">Tasa Cancelación</p><p className={`text-3xl font-bold ${(overview?.cancelRate ?? 0) > 20 ? 'text-rose-600' : 'text-emerald-600'}`}>{overview?.cancelRate ?? 0}%</p></div>
        <div className="card text-center"><p className="text-sm text-gray-500 mb-1">Tasa Cumplimiento</p><p className="text-3xl font-bold text-indigo-600">{overview?.completionRate ?? 0}%</p></div>
      </div>

      {/* Line + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Citas — últimos 30 días</h2>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          {byPeriod && byPeriod.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={byPeriod}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip labelFormatter={(v) => `Fecha: ${v}`} />
                <Legend formatter={(v) => v === 'total' ? 'Total' : v === 'completed' ? 'Completadas' : 'Canceladas'} />
                <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="cancelled" stroke="#f43f5e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm">Sin datos para el período</div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Estado de Citas</h2>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full inline-block" style={{ background: d.color }} />
                      {d.name}
                    </span>
                    <span className="font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">Sin citas aún</div>
          )}
        </div>
      </div>

      {/* Bar charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Médicos por Citas</h2>
          {topDoctors && topDoctors.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topDoctors} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} tickFormatter={(v) => v.split(' ')[0]} />
                <Tooltip formatter={(v) => [v, 'Citas']} />
                <Bar dataKey="totalAppointments" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm">Sin datos</div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Citas por Especialidad</h2>
          {bySpecialty && bySpecialty.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={bySpecialty}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="specialty" tick={{ fontSize: 10 }} tickFormatter={(v) => v.length > 12 ? v.slice(0, 12) + '…' : v} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm">Sin datos</div>
          )}
        </div>
      </div>

      {/* Hourly */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Distribución Horaria de Citas</h2>
        {hourly && hourly.some((h: any) => h.count > 0) ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={hourly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip formatter={(v) => [v, 'Citas']} />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[180px] text-gray-400 text-sm">Sin datos horarios</div>
        )}
      </div>

      {/* Patient summary */}
      {patientStats && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen de Pacientes</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { label: 'Total', value: patientStats.total },
              { label: 'Nuevos Este Mes', value: patientStats.newThisMonth },
              { label: 'Con Citas', value: patientStats.withAppointments },
              { label: 'Recurrentes', value: patientStats.withRecurring },
            ].map(({ label, value }) => (
              <div key={label} className="p-4 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-indigo-600">{value}</p>
                <p className="text-xs text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

