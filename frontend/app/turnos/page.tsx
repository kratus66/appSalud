'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shiftsService } from '@/services/shifts.service';
import { institutionsService } from '@/services/institutions.service';
import { Shift, UserRole, ShiftType } from '@/types';
import { useAuthStore } from '@/store/auth';
import { Clock, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { withAuth } from '@/components/auth/withAuth';
import { ShiftModal, ShiftFormData } from '@/components/shifts/ShiftModal';
import { toast } from 'sonner';

const shiftTypeLabels: Record<ShiftType, string> = {
  [ShiftType.MORNING]: 'Mañana',
  [ShiftType.AFTERNOON]: 'Tarde',
  [ShiftType.NIGHT]: 'Noche',
  [ShiftType.SPECIAL]: 'Especial',
};

function ShiftsPage() {
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

  // Query para instituciones (solo SUPER_ADMIN)
  const { data: institutionsData } = useQuery({
    queryKey: ['institutions'],
    queryFn: () => institutionsService.getAll(),
    enabled: isSuperAdmin,
  });

  // Mutación para crear
  const createMutation = useMutation({
    mutationFn: (data: ShiftFormData) => shiftsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast.success('Turno creado exitosamente');
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear turno');
    },
  });

  // Mutación para actualizar
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ShiftFormData }) =>
      shiftsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast.success('Turno actualizado exitosamente');
      setIsModalOpen(false);
      setSelectedShift(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar turno');
    },
  });

  // Mutación para eliminar
  const deleteMutation = useMutation({
    mutationFn: (id: string) => shiftsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast.success('Turno eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar turno');
    },
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

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar el turno "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const filteredShifts = shifts.filter((shift: Shift) =>
    shift.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div>
        <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-8 h-8" />
            Turnos Clínicos
          </h1>
          <p className="text-gray-600 mt-1">
            Configuración de horarios y turnos de trabajo
          </p>
        </div>
        
        {canEdit && (
          <button 
            onClick={() => {
              setSelectedShift(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nuevo Turno
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar turnos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Turno
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Horario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Color
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
                  Cargando...
                </td>
              </tr>
            ) : filteredShifts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No se encontraron turnos
                </td>
              </tr>
            ) : (
              filteredShifts.map((shift: Shift) => (
                <tr key={shift.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{shift.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {shift.startTime} - {shift.endTime}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {shiftTypeLabels[shift.shiftType]}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: shift.color }}
                      />
                      <span className="text-sm text-gray-600">{shift.color}</span>
                    </div>
                  </td>
                  {user?.role === UserRole.SUPER_ADMIN && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{shift.institution?.name}</div>
                    </td>
                  )}
                  {canEdit && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleEdit(shift)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(shift.id, shift.name)}
                        className="text-red-600 hover:text-red-900"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}

      {/* ShiftModal */}
      <ShiftModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        shift={selectedShift}
        isLoading={createMutation.isPending || updateMutation.isPending}
        institutions={institutionsData?.institutions || []}
      />
          </tbody>
        </table>
      </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(ShiftsPage);
