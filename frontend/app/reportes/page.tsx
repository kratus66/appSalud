'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { withAuth } from '@/components/auth/withAuth';
import { analyticsService, reportsService } from '@/services/analytics.service';
import { UserRole } from '@/types';
import {
  BarChart2, PieChart as PieIcon, TrendingUp, Clock, Users, Calendar,
  Download, CheckCircle, XCircle, AlertCircle, Activity, RefreshCw,
} from 'lucide-react';
import api from '@/lib/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: '#6366f1', CONFIRMED: '#10b981', COMPLETED: '#3b82f6',
  CANCELLED: '#f43f5e', NO_SHOW: '#f59e0b',
};
const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Agendadas', CONFIRMED: 'Confirmadas', COMPLETED: 'Completadas',
  CANCELLED: 'Canceladas', NO_SHOW: 'No asistió',
};
const STATUS_BADGE: Record<string, string> = {
  SCHEDULED: 'bg-indigo-100 text-indigo-700',
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-rose-100 text-rose-700',
  NO_SHOW: 'bg-amber-100 text-amber-700',
};

type PresetKey = 'today' | '7d' | '30d' | 'custom';

function getPresetDates(preset: PresetKey, customStart?: string, customEnd?: string) {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const today = fmt(now);
  if (preset === 'today') return { startDate: today, endDate: today };
  if (preset === '7d') { const s = new Date(now); s.setDate(s.getDate() - 7); const e = new Date(now); e.setDate(e.getDate() + 7); return { startDate: fmt(s), endDate: fmt(e) }; }
  if (preset === '30d') { const s = new Date(now); s.setDate(s.getDate() - 30); const e = new Date(now); e.setDate(e.getDate() + 30); return { startDate: fmt(s), endDate: fmt(e) }; }
  return { startDate: customStart || today, endDate: customEnd || today };
}

// ─── Component ────────────────────────────────────────────────────────────────

function ReportesPage() {
  const [preset, setPreset] = useState<PresetKey>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [exportType, setExportType] = useState<'appointments' | 'patients' | 'doctors'>('appointments');
  const [exporting, setExporting] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [tableStatusFilter, setTableStatusFilter] = useState('');
  const [period] = useState<'week' | 'month' | 'year'>('month');

  const { startDate, endDate } = useMemo(
    () => getPresetDates(preset, customStart, customEnd),
    [preset, customStart, customEnd],
  );

  const { data: overview, isLoading: loadingOverview } = useQuery({ queryKey: ['reports-overview'], queryFn: reportsService.getOverview });
  const { data: byStatus } = useQuery({ queryKey: ['rep-status'], queryFn: analyticsService.getByStatus });
  const { data: byDay, isLoading: loadingByDay } = useQuery({ queryKey: ['reports-by-day', startDate, endDate], queryFn: () => reportsService.getAppointmentsByDay(startDate, endDate) });
  const { data: byDoctor, isLoading: loadingByDoctor } = useQuery({ queryKey: ['reports-by-doctor', startDate, endDate], queryFn: () => reportsService.getAppointmentsByDoctor(startDate, endDate) });
  const { data: patientsAttended } = useQuery({ queryKey: ['reports-patients-attended', startDate, endDate], queryFn: () => reportsService.getPatientsAttended(startDate, endDate) });
  const { data: tableData, isLoading: loadingTable } = useQuery({ queryKey: ['reports-table', startDate, endDate], queryFn: () => reportsService.getTable(startDate, endDate) });
  const { data: byPeriod } = useQuery({ queryKey: ['rep-period', period], queryFn: () => analyticsService.getByPeriod(period) });

  // ─── Derived ───────────────────────────────────────────────────────────────

  const pieData = byStatus
    ? Object.entries(byStatus)
        .filter(([, v]) => (v as number) > 0)
        .map(([k, v]) => ({ name: STATUS_LABELS[k] || k, value: v as number, color: STATUS_COLORS[k] || '#94a3b8' }))
    : [];

  const filteredTable = useMemo(() => {
    if (!tableData) return [];
    return (tableData as any[]).filter((row) => {
      const matchSearch = !tableSearch ||
        row.patient.toLowerCase().includes(tableSearch.toLowerCase()) ||
        row.doctor.toLowerCase().includes(tableSearch.toLowerCase()) ||
        row.patientDoc.includes(tableSearch);
      const matchStatus = !tableStatusFilter || row.status === tableStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [tableData, tableSearch, tableStatusFilter]);

  // ─── Export ────────────────────────────────────────────────────────────────

  const handleExport = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({ type: exportType });
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const base = (api.defaults.baseURL ?? '').replace(/\/$/, '');
      const url = `${base}/reports/export?${params.toString()}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `reporte-${exportType}-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch { /* silent */ } finally { setExporting(false); }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  const presets: { key: PresetKey; label: string }[] = [
    { key: 'today', label: 'Hoy' },
    { key: '7d', label: '7 días' },
    { key: '30d', label: '30 días' },
    { key: 'custom', label: 'Personalizado' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reportes y Analítica</h1>
            <p className="text-gray-500 mt-1">Métricas operativas y clínicas del hospital</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={exportType}
              onChange={(e) => setExportType(e.target.value as any)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="appointments">Citas</option>
              <option value="patients">Pacientes</option>
              <option value="doctors">Médicos</option>
            </select>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
            >
              {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Date Filter */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-gray-600">Período:</span>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              {presets.map((p) => (
                <button key={p.key} onClick={() => setPreset(p.key)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${preset === p.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {p.label}
                </button>
              ))}
            </div>
            {preset === 'custom' && (
              <div className="flex items-center gap-2 text-sm">
                <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                <span className="text-gray-400">—</span>
                <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
            )}
            <span className="text-xs text-gray-400 ml-auto">{startDate} → {endDate}</span>
          </div>
        </div>

        {/* ── Section 1: KPI Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Citas', value: loadingOverview ? '…' : overview?.totalAppointments ?? 0, icon: Calendar, color: 'text-indigo-600 bg-indigo-50', border: 'border-indigo-100' },
            { label: 'Completadas', value: loadingOverview ? '…' : overview?.completedAppointments ?? 0, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50', border: 'border-emerald-100' },
            { label: 'Canceladas', value: loadingOverview ? '…' : overview?.cancelledAppointments ?? 0, icon: XCircle, color: 'text-rose-600 bg-rose-50', border: 'border-rose-100' },
            { label: 'No Asistió', value: loadingOverview ? '…' : overview?.noShowAppointments ?? 0, icon: AlertCircle, color: 'text-amber-600 bg-amber-50', border: 'border-amber-100' },
            { label: 'Pacientes', value: loadingOverview ? '…' : (patientsAttended?.uniquePatients || overview?.totalPatients || 0), icon: Users, color: 'text-blue-600 bg-blue-50', border: 'border-blue-100' },
            { label: 'Médicos Activos', value: loadingOverview ? '…' : overview?.activeDoctors ?? 0, icon: Activity, color: 'text-teal-600 bg-teal-50', border: 'border-teal-100' },
          ].map(({ label, value, icon: Icon, color, border }) => (
            <div key={label} className={`bg-white rounded-xl border ${border} p-4 text-center shadow-sm hover:shadow-md transition-shadow`}>
              <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center mx-auto mb-2`}><Icon className="w-5 h-5" /></div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Rates */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Tasa de Cumplimiento', value: `${overview?.completionRate ?? 0}%`, color: 'from-emerald-500 to-teal-600' },
            { label: 'Tasa de Cancelación', value: `${overview?.cancelRate ?? 0}%`, color: 'from-rose-500 to-pink-600' },
            { label: 'Tasa No Show', value: `${overview?.noShowRate ?? 0}%`, color: 'from-amber-500 to-orange-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`bg-gradient-to-r ${color} rounded-xl p-4 text-white shadow-md`}>
              <p className="text-sm font-medium opacity-85">{label}</p>
              <p className="text-3xl font-bold mt-1">{value}</p>
            </div>
          ))}
        </div>

        {/* ── Section 2: Charts ── */}

        {/* Line chart – citas por día */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Citas por Día</h2>
            <span className="text-xs text-gray-400 ml-auto">{startDate} → {endDate}</span>
          </div>
          {loadingByDay ? (
            <div className="flex items-center justify-center h-64"><RefreshCw className="w-6 h-6 animate-spin text-indigo-400" /></div>
          ) : byDay && byDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={byDay}>
                <defs>
                  <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gComp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip labelFormatter={(v) => `Fecha: ${v}`}
                  formatter={(val, name) => [val, name === 'count' ? 'Total' : name === 'completed' ? 'Completadas' : name === 'cancelled' ? 'Canceladas' : 'No Show']} />
                <Legend formatter={(v) => v === 'count' ? 'Total' : v === 'completed' ? 'Completadas' : v === 'cancelled' ? 'Canceladas' : 'No Show'} />
                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fill="url(#gTotal)" />
                <Area type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} fill="url(#gComp)" />
                <Area type="monotone" dataKey="cancelled" stroke="#f43f5e" strokeWidth={1.5} fill="none" strokeDasharray="4 2" />
                <Area type="monotone" dataKey="noShow" stroke="#f59e0b" strokeWidth={1.5} fill="none" strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">Sin datos para el período seleccionado</div>
          )}
        </div>

        {/* Bar + Pie row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar – citas por médico */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">Citas por Médico</h2>
            </div>
            {loadingByDoctor ? (
              <div className="flex items-center justify-center h-56"><RefreshCw className="w-6 h-6 animate-spin text-indigo-400" /></div>
            ) : byDoctor && byDoctor.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byDoctor} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="doctor" tick={{ fontSize: 11 }} width={100}
                    tickFormatter={(v: string) => (v.length > 14 ? v.slice(0, 14) + '…' : v)} />
                  <Tooltip formatter={(v) => [v, 'Citas']} />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-56 text-gray-400">Sin datos</div>
            )}
          </div>

          {/* Pie – estados */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <PieIcon className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">Estado de Citas</h2>
            </div>
            {pieData.length > 0 ? (
              <div className="flex items-center gap-6">
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
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: d.color }} />
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
        </div>

        {/* Historical trend */}
        {byPeriod && byPeriod.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">Tendencia Histórica (30 días)</h2>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={byPeriod}>
                <defs>
                  <linearGradient id="gH" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} fill="url(#gH)" name="Total" />
                <Area type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} fill="none" name="Completadas" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Section 3: Appointments Table ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">Tabla de Citas</h2>
              {filteredTable.length > 0 && (
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{filteredTable.length}</span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <input type="text" placeholder="Buscar paciente / médico…" value={tableSearch} onChange={(e) => setTableSearch(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 w-48 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <select value={tableStatusFilter} onChange={(e) => setTableStatusFilter(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
                <option value="">Todos los estados</option>
                {Object.keys(STATUS_LABELS).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
              <button onClick={handleExport} disabled={exporting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-60">
                <Download className="w-4 h-4" />
                Exportar
              </button>
            </div>
          </div>

          {loadingTable ? (
            <div className="flex items-center justify-center h-32"><RefreshCw className="w-6 h-6 animate-spin text-indigo-400" /></div>
          ) : filteredTable.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Fecha', 'Hora', 'Paciente', 'Doctor', 'Estado', 'Motivo'].map((col) => (
                      <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredTable.map((row: any) => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">{row.date}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{row.time}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{row.patient}</div>
                        <div className="text-xs text-gray-400">{row.patientDoc}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{row.doctor}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[row.status] || 'bg-gray-100 text-gray-700'}`}>
                          {STATUS_LABELS[row.status] || row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{row.reason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400 gap-2">
              <Calendar className="w-8 h-8 opacity-40" />
              <p className="text-sm">No hay citas en el período seleccionado</p>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}

export default withAuth(ReportesPage, [
  UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PLANIFICADOR,
  UserRole.APROBADOR, UserRole.CONSULTA,
]);
