'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { holidaysService } from '@/services/holidays.service';
import { Holiday, UserRole } from '@/types';
import { useAuthStore } from '@/store/auth';
import { Calendar, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { withAuth } from '@/components/auth/withAuth';
import { toast } from 'sonner';

// ─── Modal ─────────────────────────────────────────────────────────────────────

interface ModalProps {
  holiday?: Holiday | null;
  onClose: () => void;
  onSaved: () => void;
}

function HolidayModal({ holiday, onClose, onSaved }: ModalProps) {
  const isEdit = !!holiday;

  const [name, setName] = useState(holiday?.name ?? '');
  const [holidayDate, setHolidayDate] = useState(
    holiday?.holidayDate ? holiday.holidayDate.split('T')[0] : '',
  );
  const [countryCode, setCountryCode] = useState(holiday?.countryCode ?? 'CO');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !holidayDate) {
      toast.error('Nombre y fecha son obligatorios');
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await holidaysService.update(holiday!.id, { name: name.trim(), holidayDate, countryCode });
        toast.success('Festivo actualizado');
      } else {
        await holidaysService.create({ name: name.trim(), holidayDate, countryCode });
        toast.success('Festivo creado');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Error al guardar festivo';
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Editar Festivo' : 'Nuevo Festivo'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del festivo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Día de la Independencia"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={holidayDate}
              onChange={(e) => setHolidayDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código de país
            </label>
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="CO">Colombia (CO)</option>
              <option value="MX">México (MX)</option>
              <option value="AR">Argentina (AR)</option>
              <option value="CL">Chile (CL)</option>
              <option value="PE">Perú (PE)</option>
              <option value="US">Estados Unidos (US)</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando…' : isEdit ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

function HolidaysPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);

  const canEdit = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN;

  const { data: holidays = [], isLoading } = useQuery({
    queryKey: ['holidays', selectedYear],
    queryFn: () => holidaysService.getAll({ year: selectedYear }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => holidaysService.delete(id),
    onSuccess: () => {
      toast.success('Festivo eliminado');
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Error al eliminar';
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar el festivo "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const openCreate = () => {
    setEditingHoliday(null);
    setModalOpen(true);
  };

  const openEdit = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setModalOpen(true);
  };

  const handleSaved = () => {
    queryClient.invalidateQueries({ queryKey: ['holidays'] });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <DashboardLayout>
      {modalOpen && (
        <HolidayModal
          holiday={editingHoliday}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}

      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-8 h-8" />
              Festivos
            </h1>
            <p className="text-gray-600 mt-1">
              Gestión de festivos nacionales e institucionales
            </p>
          </div>

          {canEdit && (
            <button
              onClick={openCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nuevo Festivo
            </button>
          )}
        </div>

        <div className="mb-6">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Festivo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  País
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alcance
                </th>
                {user?.role === UserRole.SUPER_ADMIN && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Institución
                  </th>
                )}
                {canEdit && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Cargando…
                  </td>
                </tr>
              ) : holidays.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No se encontraron festivos para este año
                  </td>
                </tr>
              ) : (
                holidays.map((holiday: Holiday) => (
                  <tr key={holiday.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(holiday.holidayDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{holiday.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{holiday.countryCode}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          holiday.institutionId
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {holiday.institutionId ? 'Institucional' : 'Nacional'}
                      </span>
                    </td>
                    {user?.role === UserRole.SUPER_ADMIN && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {holiday.institution?.name || '—'}
                        </div>
                      </td>
                    )}
                    {canEdit && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openEdit(holiday)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(holiday.id, holiday.name)}
                          className="text-red-600 hover:text-red-900"
                          disabled={deleteMutation.isPending}
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(HolidaysPage);
