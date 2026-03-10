'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { specialtiesService } from '@/services/specialties.service';
import { Specialty, UserRole, CreateSpecialtyDto, UpdateSpecialtyDto } from '@/types';
import { useAuthStore } from '@/store/auth';
import { Tag, Plus, Search, Edit2, Trash2, X, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { withAuth } from '@/components/auth/withAuth';

const PRESET_COLORS = [
  '#e74c3c', '#e91e8c', '#9b59b6', '#3498db', '#2980b9',
  '#1abc9c', '#2ecc71', '#f39c12', '#e67e22', '#16a085',
  '#8e44ad', '#c0392b', '#64748b', '#0f172a',
];

interface SpecialtyFormData {
  name: string;
  description: string;
  color: string;
}

interface SpecialtyModalProps {
  isOpen: boolean;
  specialty: Specialty | null;
  onClose: () => void;
  onSubmit: (data: SpecialtyFormData) => void;
  isLoading: boolean;
}

function SpecialtyModal({ isOpen, specialty, onClose, onSubmit, isLoading }: SpecialtyModalProps) {
  const [form, setForm] = useState<SpecialtyFormData>({
    name: specialty?.name ?? '',
    description: specialty?.description ?? '',
    color: specialty?.color ?? '#3b82f6',
  });

  // Sync when opening for edit
  useState(() => {
    if (specialty) {
      setForm({ name: specialty.name, description: specialty.description ?? '', color: specialty.color });
    }
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('El nombre es requerido'); return; }
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: form.color + '20', color: form.color }}>
              <Tag className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              {specialty ? 'Editar Especialidad' : 'Nueva Especialidad'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej: Cardiología"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Descripción de la especialidad..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color identificador</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: form.color === c ? '#1e40af' : 'transparent',
                    transform: form.color === c ? 'scale(1.2)' : undefined,
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border border-gray-300"
              />
              <span className="text-sm text-gray-500">Personalizado: {form.color}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Guardando...' : specialty ? 'Actualizar' : 'Crear Especialidad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SpecialtiesPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState<Specialty | null>(null);

  const canEdit = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN;

  const { data, isLoading } = useQuery({
    queryKey: ['specialties', search],
    queryFn: () => specialtiesService.getAll({ search: search || undefined, includeInactive: false }),
  });

  const specialties = data?.specialties ?? [];

  const createMutation = useMutation({
    mutationFn: (d: CreateSpecialtyDto) => specialtiesService.create(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specialties'] });
      toast.success('Especialidad creada');
      setIsModalOpen(false);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al crear'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: UpdateSpecialtyDto }) => specialtiesService.update(id, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specialties'] });
      toast.success('Especialidad actualizada');
      setIsModalOpen(false);
      setSelected(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al actualizar'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => specialtiesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specialties'] });
      toast.success('Especialidad eliminada');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al eliminar'),
  });

  const handleOpenCreate = () => { setSelected(null); setIsModalOpen(true); };
  const handleOpenEdit = (s: Specialty) => { setSelected(s); setIsModalOpen(true); };

  const handleSubmit = (form: { name: string; description: string; color: string }) => {
    if (selected) {
      updateMutation.mutate({ id: selected.id, d: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleDelete = (s: Specialty) => {
    if (confirm(`¿Eliminar la especialidad "${s.name}"?\nEsta acción no se puede deshacer.`)) {
      deleteMutation.mutate(s.id);
    }
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Tag className="w-5 h-5 text-purple-600" />
              </div>
              Especialidades Médicas
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {data?.total ?? 0} especialidad{(data?.total ?? 0) !== 1 ? 'es' : ''} registrada{(data?.total ?? 0) !== 1 ? 's' : ''}
            </p>
          </div>
          {canEdit && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Nueva Especialidad
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar especialidad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : specialties.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No hay especialidades registradas</p>
            {canEdit && (
              <button onClick={handleOpenCreate} className="mt-4 text-blue-600 hover:underline text-sm">
                Crear la primera especialidad
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {specialties.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5">
                {/* Color strip */}
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: s.color + '20', color: s.color }}
                  >
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  {canEdit && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <h3 className="font-semibold text-gray-900 text-sm leading-tight">{s.name}</h3>
                {s.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{s.description}</p>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">
                    {(s._count?.doctors ?? 0)} médico{(s._count?.doctors ?? 0) !== 1 ? 's' : ''}
                  </span>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: s.color }}
                    title={s.color}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SpecialtyModal
        isOpen={isModalOpen}
        specialty={selected}
        onClose={() => { setIsModalOpen(false); setSelected(null); }}
        onSubmit={handleSubmit}
        isLoading={isMutating}
      />
    </DashboardLayout>
  );
}

export default withAuth(SpecialtiesPage, [UserRole.SUPER_ADMIN, UserRole.ADMIN]);
