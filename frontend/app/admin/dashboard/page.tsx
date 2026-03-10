'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { withAuth } from '@/components/auth/withAuth';
import { UserRole } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { institutionsService } from '@/services/institutions.service';
import { subscriptionsService } from '@/services/subscriptions.service';
import {
  Building2,
  DollarSign,
  Activity,
  AlertCircle,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  bg: string;
}

function KpiCard({ icon, label, value, sub, color, bg }: KpiCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow p-5 flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}>
        <span className={color}>{icon}</span>
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function InstitutionStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    SUSPENDED: 'bg-red-100 text-red-800',
    INACTIVE: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    HOSPITAL: 'bg-blue-100 text-blue-800',
    CLINIC: 'bg-teal-100 text-teal-800',
    LAB: 'bg-orange-100 text-orange-800',
    OTHER: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${map[type] ?? 'bg-gray-100 text-gray-600'}`}>
      {type}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['institution-stats'],
    queryFn: () => institutionsService.getStats(),
  });

  const { data: subMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['subscription-metrics'],
    queryFn: () => subscriptionsService.getMetrics(),
  });

  const { data: institutionsData, isLoading: instLoading } = useQuery({
    queryKey: ['institutions'],
    queryFn: () => institutionsService.getAll(),
  });

  const institutions = institutionsData?.institutions ?? [];

  const kpis: KpiCardProps[] = [
    {
      icon: <Building2 className="w-6 h-6" />,
      label: 'Instituciones activas',
      value: stats?.byStatus?.active ?? '—',
      sub: `${stats?.total ?? 0} total`,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      label: 'Ingresos mensuales',
      value: subMetrics ? `$${subMetrics.monthlyRevenue}` : '—',
      sub: `${subMetrics?.active ?? 0} suscripciones activas`,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      icon: <Clock className="w-6 h-6" />,
      label: 'En trial',
      value: subMetrics?.trial ?? '—',
      sub: 'Período de prueba',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      icon: <XCircle className="w-6 h-6" />,
      label: 'Suspendidas',
      value: stats?.byStatus?.suspended ?? '—',
      sub: 'Requieren atención',
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      label: 'Suscripciones totales',
      value: subMetrics?.total ?? '—',
      sub: `${subMetrics?.cancelled ?? 0} canceladas`,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      icon: <Activity className="w-6 h-6" />,
      label: 'Expiradas',
      value: subMetrics?.expired ?? '—',
      sub: 'Suscripciones vencidas',
      color: 'text-gray-600',
      bg: 'bg-gray-100',
    },
  ];

  return (
    <DashboardLayout>
      <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-blue-600 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            Panel Super Admin
          </h1>
          <p className="text-gray-500 mt-1">Vista global de la plataforma SaaS</p>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
          {kpis.map((k) => (
            <KpiCard key={k.label} {...k} />
          ))}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { href: '/instituciones', icon: <Building2 className="w-5 h-5" />, label: 'Gestionar Instituciones', color: 'from-blue-600 to-indigo-600' },
            { href: '/admin/planes', icon: <DollarSign className="w-5 h-5" />, label: 'Planes de Suscripción', color: 'from-violet-600 to-purple-600' },
            { href: '/admin/suscripciones', icon: <CheckCircle className="w-5 h-5" />, label: 'Suscripciones', color: 'from-teal-600 to-emerald-600' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`bg-gradient-to-r ${item.color} text-white rounded-xl p-4 flex items-center justify-between hover:opacity-90 transition shadow`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span className="font-semibold">{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 opacity-70" />
            </Link>
          ))}
        </div>

        {/* Institutions Table */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Instituciones</h2>
            <Link href="/instituciones" className="text-sm text-blue-600 hover:underline">Ver todas →</Link>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Nombre', 'Tipo', 'Ciudad', 'Usuarios', 'Plan', 'Estado'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {instLoading ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Cargando…</td></tr>
              ) : institutions.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No hay instituciones registradas</td></tr>
              ) : institutions.slice(0, 10).map((inst: any) => (
                <tr key={inst.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{inst.name}</div>
                    <div className="text-xs text-gray-400">{inst.code}</div>
                  </td>
                  <td className="px-6 py-4"><TypeBadge type={inst.type ?? 'OTHER'} /></td>
                  <td className="px-6 py-4 text-sm text-gray-600">{inst.city ?? '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      {inst.userCount ?? 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {inst.currentPlan?.name
                      ? <span className="text-violet-700 font-medium">{inst.currentPlan.name}</span>
                      : <span className="text-gray-400">Sin plan</span>
                    }
                  </td>
                  <td className="px-6 py-4"><InstitutionStatusBadge status={inst.status} /></td>
                  <td className="px-6 py-4 text-right">
                    <Link href="/instituciones" className="text-blue-600 hover:text-blue-900 text-sm">Ver</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(AdminDashboardPage, [UserRole.SUPER_ADMIN]);
