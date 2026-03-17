'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shiftsService } from '@/services/shifts.service';
import { institutionsService } from '@/services/institutions.service';
import { Shift, UserRole } from '@/types';
import { useAuthStore } from '@/store/auth';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { ShiftModal, ShiftFormData } from '@/components/shifts/ShiftModal';
import { toast } from 'sonner';

const shiftTypeLabels: Record<string, string> = {
  MORNING:   'Mañana',
  AFTERNOON: 'Tarde',
  NIGHT_6H:  'Noche 6h',
  NIGHT_12H: 'Noche 12h',
  DAY_OFF:   'Libre',
  SPECIAL:   'Especial',
};

export function ShiftsTab() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  const canEdit = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN;
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ['shifts', searchTerm],
    queryFn: () => shiftsService.getAll({ search: searchTerm || undefined }),
  });

  const { data: institutionsData } = useQuery({
    queryKey: ['institutions'],
    queryFn: () => institutionsService.getAll(),
    enabled: isSuperAdmin,
  });

  const createMutation = useMutation({
    mutationFn: (data: ShiftFormData) => shiftsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast.success('Tipo de turno creado');
      setIsModalOpen(false);
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Error al crear turno'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ShiftFormData }) =>
      shiftsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast.success('Tipo de turno actualizado');
      setIsModalOpen(false);
      setSelectedShift(null);
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Error al actualizar'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => shiftsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast.success('Tipo de turno eliminado');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Error al eliminar'),
  });

  const handleEdit = (shift: Shift) => {
    setSelectedShift(shift);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedShift(null);
  };

  const handleModalSubmit = async (data: ShiftFormData) => {
    if (selectedShift) {
      await updateMutation.mutateAsync({ id: selectedShift.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`¿Eliminar el tipo de turno "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const filteredShifts = (shifts as Shift[]).filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-6 space-y-5">
      {/* Barra superior */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar tipos de turno..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {canEdit && (
          <button
            onClick={() => { setSelectedShift(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
          >
            <Plus className="w-4 h-4" />
            Nuevo tipo de turno
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horario</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
              {isSuperAdmin && (
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Institución</th>
              )}
              {canEdit && (
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={6} className="px-5 py-6 text-center text-gray-400">Cargando...</td></tr>
            ) : filteredShifts.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-6 text-center text-gray-400">No hay tipos de turno configurados</td></tr>
            ) : (
              filteredShifts.map((shift) => (
                <tr key={shift.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{shift.name}</td>
                  <td className="px-5 py-3 text-gray-700">{shift.startTime} – {shift.endTime}</td>
                  <td className="px-5 py-3 text-gray-700">{shiftTypeLabels[shift.shiftType] ?? shift.shiftType}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded border border-gray-200 inline-block" style={{ backgroundColor: shift.color }} />
                      <span className="text-gray-500 text-xs">{shift.color}</span>
                    </div>
                  </td>
                  {isSuperAdmin && (
                    <td className="px-5 py-3 text-gray-700">{(shift as any).institution?.name ?? '—'}</td>
                  )}
                  {canEdit && (
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => handleEdit(shift)} className="text-indigo-600 hover:text-indigo-800 mr-3">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(shift.id, shift.name)}
                        disabled={deleteMutation.isPending}
                        className="text-red-500 hover:text-red-700 disabled:opacity-40"
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

      <ShiftModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        shift={selectedShift}
        isLoading={createMutation.isPending || updateMutation.isPending}
        institutions={(institutionsData as any)?.institutions ?? []}
      />
    </div>
  );
}
