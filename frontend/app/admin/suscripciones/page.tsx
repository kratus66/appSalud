'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { withAuth } from '@/components/auth/withAuth';
import { UserRole, Subscription, SubscriptionStatus } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionsService } from '@/services/subscriptions.service';
import { institutionsService } from '@/services/institutions.service';
import { plansService } from '@/services/plans.service';
import { CreditCard, Plus, Edit2, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

// ─── Subscription Modal ───────────────────────────────────────────────────────

interface SubModalProps {
  subscription: Subscription | null;
  onClose: () => void;
  onSaved: () => void;
}

function SubscriptionModal({ subscription, onClose, onSaved }: SubModalProps) {
  const isEdit = !!subscription;
  const [institutionId, setInstitutionId] = useState(subscription?.institutionId ?? '');
  const [planId, setPlanId] = useState(subscription?.planId ?? '');
  const [startDate, setStartDate] = useState(
    subscription?.startDate ? subscription.startDate.split('T')[0] : new Date().toISOString().split('T')[0],
  );
  const [endDate, setEndDate] = useState(
    subscription?.endDate ? subscription.endDate.split('T')[0] : '',
  );
  const [status, setStatus] = useState<string>(subscription?.status ?? SubscriptionStatus.TRIAL);
  const [saving, setSaving] = useState(false);

  const { data: institutionsData } = useQuery({
    queryKey: ['institutions-select'],
    queryFn: () => institutionsService.getAll(),
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: () => plansService.getAll(),
  });

  const institutions = institutionsData?.institutions ?? [];

  const handleSave = async () => {
    if (!institutionId || !planId || !startDate) {
      toast.error('Institución, plan y fecha de inicio son obligatorios');
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await subscriptionsService.update(subscription.id, {
          planId,
          startDate,
          endDate: endDate || undefined,
          status: status as SubscriptionStatus,
        });
        toast.success('Suscripción actualizada');
      } else {
        await subscriptionsService.create({
          institutionId,
          planId,
          startDate,
          endDate: endDate || undefined,
          status,
        });
        toast.success('Suscripción creada');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Error al guardar';
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">{isEdit ? 'Editar Suscripción' : 'Nueva Suscripción'}</h2>
        <div className="space-y-4">
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Institución</label>
              <select
                value={institutionId}
                onChange={(e) => setInstitutionId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Seleccionar --</option>
                {institutions.map((i: any) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Seleccionar plan --</option>
              {plans.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name} – ${p.price}/mes</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inicio</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fin (opcional)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {Object.values(SubscriptionStatus).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    TRIAL: 'bg-blue-100 text-blue-800',
    CANCELLED: 'bg-red-100 text-red-800',
    EXPIRED: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function SuscripcionesAdminPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['subscriptions', statusFilter],
    queryFn: () => subscriptionsService.getAll({ status: statusFilter || undefined }),
  });

  const { data: metrics } = useQuery({
    queryKey: ['subscription-metrics'],
    queryFn: () => subscriptionsService.getMetrics(),
  });

  const openCreate = () => { setEditingSub(null); setModalOpen(true); };
  const openEdit = (sub: Subscription) => { setEditingSub(sub); setModalOpen(true); };
  const handleSaved = () => {
    queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    queryClient.invalidateQueries({ queryKey: ['subscription-metrics'] });
  };

  const formatDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const kpis = [
    { label: 'Total', value: metrics?.total ?? '—', color: 'text-gray-900' },
    { label: 'Activas', value: metrics?.active ?? '—', color: 'text-green-600' },
    { label: 'Trial', value: metrics?.trial ?? '—', color: 'text-blue-600' },
    { label: 'Canceladas', value: metrics?.cancelled ?? '—', color: 'text-red-600' },
    { label: 'Ingresos/mes', value: metrics ? `$${metrics.monthlyRevenue}` : '—', color: 'text-violet-600' },
  ];

  return (
    <DashboardLayout>
      {modalOpen && (
        <SubscriptionModal subscription={editingSub} onClose={() => setModalOpen(false)} onSaved={handleSaved} />
      )}

      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-8 h-8 text-blue-600" />
              Suscripciones
            </h1>
            <p className="text-gray-500 mt-1">Gestión de suscripciones por institución</p>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nueva Suscripción
          </button>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {kpis.map((k) => (
            <div key={k.label} className="bg-white rounded-xl shadow p-4 text-center">
              <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
              <p className="text-xs text-gray-500 mt-1">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="mb-4 flex items-center gap-3">
          <RefreshCw className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            {Object.values(SubscriptionStatus).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Institución', 'Plan', 'Inicio', 'Fin', 'Estado', 'Acciones'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">Cargando…</td></tr>
              ) : subscriptions.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">No hay suscripciones</td></tr>
              ) : subscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{sub.institution?.name ?? '—'}</div>
                    <div className="text-xs text-gray-500">{sub.institution?.city ?? ''}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{sub.plan?.name ?? '—'}</div>
                    <div className="text-xs text-gray-500">${sub.plan?.price ?? 0}/mes</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDate(sub.startDate)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDate(sub.endDate)}</td>
                  <td className="px-6 py-4"><StatusBadge status={sub.status} /></td>
                  <td className="px-6 py-4">
                    <button onClick={() => openEdit(sub)} className="text-blue-600 hover:text-blue-900" title="Editar">
                      <Edit2 className="w-4 h-4" />
                    </button>
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

export default withAuth(SuscripcionesAdminPage, [UserRole.SUPER_ADMIN]);
