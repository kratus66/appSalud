'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area,
} from 'recharts';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { withAuth } from '@/components/auth/withAuth';
import { analyticsService } from '@/services/analytics.service';
import { UserRole } from '@/types';
import { BarChart2, PieChart as PieIcon, TrendingUp, Clock, Users, Calendar } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: '#6366f1', CONFIRMED: '#10b981', COMPLETED: '#3b82f6',
  CANCELLED: '#f43f5e', NO_SHOW: '#f59e0b',
};
const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Agendadas', CONFIRMED: 'Confirmadas', COMPLETED: 'Completadas',
  CANCELLED: 'Canceladas', NO_SHOW: 'No asistió',
};

type PeriodType = 'week' | 'month' | 'year';

function ReportesPage() {
  const [period, setPeriod] = useState<PeriodType>('month');

  const { data: overview } = useQuery({ queryKey: ['rep-overview'], queryFn: analyticsService.getOverview });
  const { data: byStatus } = useQuery({ queryKey: ['rep-status'], queryFn: analyticsService.getByStatus });
  const { data: byPeriod, isLoading: loadingPeriod } = useQuery({
    queryKey: ['rep-period', period],
    queryFn: () => analyticsService.getByPeriod(period),
  });
  const { data: topDoctors } = useQuery({ queryKey: ['rep-doctors'], queryFn: () => analyticsService.getTopDoctors(10) });
  const { data: patientStats } = useQuery({ queryKey: ['rep-patients'], queryFn: analyticsService.getPatientStats });
  const { data: bySpecialty } = useQuery({ queryKey: ['rep-specialty'], queryFn: analyticsService.getBySpecialty });
  const { data: hourly } = useQuery({ queryKey: ['rep-hourly'], queryFn: analyticsService.getHourly });

  const pieData = byStatus
    ? Object.entries(byStatus)
        .filter(([, v]) => (v as number) > 0)
        .map(([k, v]) => ({ name: STATUS_LABELS[k] || k, value: v as number, color: STATUS_COLORS[k] || '#94a3b8' }))
    : [];

  const periodLabel = period === 'week' ? '7 días' : period === 'month' ? '30 días' : '365 días';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reportes y Analíticas</h1>
            <p className="text-gray-500 mt-1">Informes completos del sistema hospitalario</p>
          </div>
          <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
            {(['week', 'month', 'year'] as PeriodType[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  period === p ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {p === 'week' ? 'Semana' : p === 'month' ? 'Mes' : 'Año'}
              </button>
            ))}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Pacientes', value: overview?.totalPatients ?? '—', icon: Users, color: 'text-indigo-600 bg-indigo-50' },
            { label: 'Médicos', value: overview?.totalDoctors ?? '—', icon: Users, color: 'text-blue-600 bg-blue-50' },
            { label: 'Citas Total', value: overview?.totalAppointments ?? '—', icon: Calendar, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Hoy', value: overview?.appointmentsToday ?? '—', icon: Calendar, color: 'text-orange-600 bg-orange-50' },
            { label: 'Cancelación', value: `${overview?.cancelRate ?? 0}%`, icon: TrendingUp, color: 'text-rose-600 bg-rose-50' },
            { label: 'Cumplimiento', value: `${overview?.completionRate ?? 0}%`, icon: TrendingUp, color: 'text-teal-600 bg-teal-50' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card text-center py-4">
              <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center mx-auto mb-2`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Trend line chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">Tendencia de Citas — últimos {periodLabel}</h2>
            </div>
          </div>
          {loadingPeriod ? (
            <div className="flex items-center justify-center h-[260px]"><div className="animate-spin h-8 w-8 rounded-full border-b-2 border-indigo-600" /></div>
          ) : byPeriod && byPeriod.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={byPeriod}>
                <defs>
                  <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip labelFormatter={(v) => `Fecha: ${v}`} />
                <Legend formatter={(v) => v === 'total' ? 'Total' : v === 'completed' ? 'Completadas' : 'Canceladas'} />
                <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} fill="url(#gradTotal)" />
                <Area type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} fill="url(#gradCompleted)" />
                <Line type="monotone" dataKey="cancelled" stroke="#f43f5e" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-gray-400">Sin datos para el período seleccionado</div>
          )}
        </div>

        {/* Status pie + Specialty bar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <PieIcon className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">Distribución por Estado</h2>
            </div>
            {pieData.length > 0 ? (
              <div className="flex gap-6 items-center">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {pieData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                        {d.name}
                      </span>
                      <span className="font-semibold">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[180px] text-gray-400">Sin citas</div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-gray-900">Citas por Especialidad</h2>
            </div>
            {bySpecialty && bySpecialty.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={bySpecialty}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="specialty" tick={{ fontSize: 10 }} tickFormatter={(v) => v.length > 10 ? v.slice(0, 10) + '…' : v} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-gray-400">Sin datos</div>
            )}
          </div>
        </div>

        {/* Top doctors */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Ranking de Médicos por Citas</h2>
          </div>
          {topDoctors && topDoctors.length > 0 ? (
            <div className="space-y-2">
              {topDoctors.map((doc: any, i: number) => (
                <div key={doc.doctorId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-200 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-indigo-50 text-indigo-600'}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{doc.name}</p>
                    <p className="text-xs text-gray-500">{doc.specialty || 'Sin especialidad'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full"
                        style={{ width: `${Math.min(100, (doc.totalAppointments / (topDoctors[0]?.totalAppointments || 1)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-indigo-600 w-8 text-right">{doc.totalAppointments}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-400">Sin datos de médicos</div>
          )}
        </div>

        {/* Hourly distribution */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Distribución Horaria de Citas</h2>
          </div>
          {hourly && hourly.some((h: any) => h.count > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hourly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={(v) => [v, 'Citas']} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-gray-400">Sin datos horarios</div>
          )}
        </div>

        {/* Patient growth */}
        {patientStats && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Crecimiento de Pacientes</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {[
                { label: 'Total Pacientes', value: patientStats.total, sub: 'registrados' },
                { label: 'Nuevos Este Mes', value: patientStats.newThisMonth, sub: `${patientStats.growthRate >= 0 ? '+' : ''}${patientStats.growthRate}% vs mes anterior` },
                { label: 'Mes Anterior', value: patientStats.newLastMonth, sub: 'pacientes nuevos' },
                { label: 'Citas Recurrentes', value: patientStats.withRecurring, sub: 'pacientes' },
              ].map(({ label, value, sub }) => (
                <div key={label} className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-100">
                  <p className="text-2xl font-bold text-indigo-700">{value}</p>
                  <p className="text-sm font-medium text-gray-700 mt-1">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default withAuth(ReportesPage, [
  UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PLANIFICADOR,
  UserRole.APROBADOR, UserRole.CONSULTA,
]);
