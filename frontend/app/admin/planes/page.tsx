'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { withAuth } from '@/components/auth/withAuth';
import { UserRole, SubscriptionPlan, Subscription } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plansService } from '@/services/plans.service';
import { DollarSign, Users, Stethoscope, UserCircle, Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

// ─── Plan Modal ──────────────────────────────────────────────────────────────

interface PlanModalProps {
  plan: SubscriptionPlan | null;
  onClose: () => void;
  onSaved: () => void;
}

function PlanModal({ plan, onClose, onSaved }: PlanModalProps) {
  const isEdit = !!plan;
  const [name, setName] = useState(plan?.name ?? '');
  const [price, setPrice] = useState(String(plan?.price ?? ''));
  const [maxUsers, setMaxUsers] = useState(String(plan?.maxUsers ?? ''));
  const [maxDoctors, setMaxDoctors] = useState(String(plan?.maxDoctors ?? ''));
  const [maxPatients, setMaxPatients] = useState(String(plan?.maxPatients ?? ''));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name || !price || !maxUsers || !maxDoctors || !maxPatients) {
      toast.error('Todos los campos son obligatorios');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name,
        price: Number(price),
        maxUsers: Number(maxUsers),
        maxDoctors: Number(maxDoctors),
        maxPatients: Number(maxPatients),
      };
      if (isEdit) {
        await plansService.update(plan.id, payload);
        toast.success('Plan actualizado');
      } else {
        await plansService.create(payload);
        toast.success('Plan creado');
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
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{isEdit ? 'Editar Plan' : 'Nuevo Plan'}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Professional"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio (USD/mes)</label>
            <input
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="79"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Max Usuarios</label>
              <input
                type="number"
                min={1}
                value={maxUsers}
                onChange={(e) => setMaxUsers(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Max Médicos</label>
              <input
                type="number"
                min={1}
                value={maxDoctors}
                onChange={(e) => setMaxDoctors(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Max Pacientes</label>
              <input
                type="number"
                min={1}
                value={maxPatients}
                onChange={(e) => setMaxPatients(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
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

// ─── Main Page ────────────────────────────────────────────────────────────────

function PlanesPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => plansService.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => plansService.remove(id),
    onSuccess: () => {
      toast.success('Plan eliminado');
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Error al eliminar';
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const openCreate = () => { setEditingPlan(null); setModalOpen(true); };
  const openEdit = (plan: SubscriptionPlan) => { setEditingPlan(plan); setModalOpen(true); };
  const handleSaved = () => queryClient.invalidateQueries({ queryKey: ['plans'] });

  const planColors = ['from-violet-500 to-purple-600', 'from-blue-500 to-indigo-600', 'from-emerald-500 to-teal-600'];

  return (
    <DashboardLayout>
      {modalOpen && (
        <PlanModal plan={editingPlan} onClose={() => setModalOpen(false)} onSaved={handleSaved} />
      )}

      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-8 h-8 text-violet-600" />
              Planes de Suscripción
            </h1>
            <p className="text-gray-500 mt-1">Gestiona los planes del SaaS</p>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nuevo Plan
          </button>
        </div>

        {/* Plan cards */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Cargando planes…</div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No hay planes creados</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {plans.map((plan, idx) => (
              <div key={plan.id} className={`rounded-2xl bg-gradient-to-br ${planColors[idx % planColors.length]} text-white shadow-lg p-6 relative`}>
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className="text-4xl font-black mt-2">${plan.price}<span className="text-base font-normal">/mes</span></p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li className="flex items-center gap-2"><Users className="w-4 h-4" /> {plan.maxUsers} usuarios</li>
                  <li className="flex items-center gap-2"><Stethoscope className="w-4 h-4" /> {plan.maxDoctors} médicos</li>
                  <li className="flex items-center gap-2"><UserCircle className="w-4 h-4" /> {plan.maxPatients} pacientes</li>
                </ul>
                {plan.subscriptionCount !== undefined && (
                  <p className="mt-3 text-xs opacity-80">{plan.subscriptionCount} suscripciones activas</p>
                )}
                <div className="absolute top-4 right-4 flex gap-2">
                  <button onClick={() => openEdit(plan)} className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30" title="Editar">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { if (confirm(`¿Eliminar "${plan.name}"?`)) deleteMutation.mutate(plan.id); }}
                    className="p-1.5 bg-white/20 rounded-lg hover:bg-red-500/80"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Table view */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Plan', 'Precio', 'Usuarios', 'Médicos', 'Pacientes', 'Suscripciones', 'Estado'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={8} className="px-6 py-4 text-center text-gray-500">Cargando…</td></tr>
              ) : plans.map((plan) => (
                <tr key={plan.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold text-gray-900">{plan.name}</td>
                  <td className="px-6 py-4 text-gray-700">${plan.price}/mes</td>
                  <td className="px-6 py-4 text-gray-600">{plan.maxUsers}</td>
                  <td className="px-6 py-4 text-gray-600">{plan.maxDoctors}</td>
                  <td className="px-6 py-4 text-gray-600">{plan.maxPatients}</td>
                  <td className="px-6 py-4 text-gray-600">{plan.subscriptionCount ?? 0}</td>
                  <td className="px-6 py-4">
                    {plan.isActive
                      ? <span className="flex items-center gap-1 text-green-700 text-xs"><CheckCircle className="w-3 h-3" /> Activo</span>
                      : <span className="flex items-center gap-1 text-red-700 text-xs"><XCircle className="w-3 h-3" /> Inactivo</span>
                    }
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEdit(plan)} className="text-blue-600 hover:text-blue-900 mr-3" title="Editar">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { if (confirm(`¿Eliminar "${plan.name}"?`)) deleteMutation.mutate(plan.id); }}
                      className="text-red-600 hover:text-red-900"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
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

export default withAuth(PlanesPage, [UserRole.SUPER_ADMIN]);
