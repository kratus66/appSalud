'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { withAuth } from '@/components/auth/withAuth';
import { UserRole } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { institutionsService } from '@/services/institutions.service';
import { Building2, Plus, Search, Edit2, Ban, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { InstitutionModal, InstitutionFormData } from '@/components/institutions/InstitutionModal';
import { toast } from 'sonner';

function InstitucionesPage() {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['institutions', search],
    queryFn: () => institutionsService.getAll({ search }),
  });

  const createMutation = useMutation({
    mutationFn: (data: InstitutionFormData) => {
      const payload = {
        name: data.name,
        code: data.code,
        metadata: {
          address: data.address,
          phone: data.phone,
          email: data.email,
        },
      };
      return institutionsService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institutions'] });
      toast.success('Institución creada exitosamente');
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear institución');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: InstitutionFormData }) => {
      const payload = {
        name: data.name,
        metadata: {
          address: data.address,
          phone: data.phone,
          email: data.email,
        },
      };
      return institutionsService.update(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institutions'] });
      toast.success('Institución actualizada exitosamente');
      setIsModalOpen(false);
      setEditingInstitution(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar institución');
    },
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => institutionsService.suspend(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institutions'] });
      toast.success('Institución suspendida exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al suspender institución');
    },
  });

  const handleCreateClick = () => {
    setEditingInstitution(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (institution: any) => {
    setEditingInstitution(institution);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingInstitution(null);
  };

  const handleModalSubmit = async (data: InstitutionFormData) => {
    if (editingInstitution) {
      await updateMutation.mutateAsync({ id: editingInstitution.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleSuspend = async (id: string) => {
    if (confirm('¿Está seguro que desea suspender esta institución?')) {
      await suspendMutation.mutateAsync(id);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Instituciones</h1>
            <p className="text-gray-600">Gestiona todas las instituciones del sistema</p>
          </div>
          <button onClick={handleCreateClick} className="btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Nueva Institución</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar instituciones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>

        {/* Institutions List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <p>Cargando...</p>
          ) : data?.institutions && data.institutions.length > 0 ? (
            data.institutions.map((inst: any) => (
              <div key={inst.id} className="card hover:shadow-hospital transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{inst.name}</h3>
                      <p className="text-sm text-gray-500">{inst.code}</p>
                    </div>
                  </div>
                  <span
                    className={`badge ${
                      inst.status === 'ACTIVE'
                        ? 'badge-medical'
                        : inst.status === 'SUSPENDED'
                        ? 'badge-danger'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {inst.status}
                  </span>
                </div>

                {/* Institution Details */}
                <div className="space-y-2 text-sm mb-4">
                  {inst.metadata?.address && (
                    <div className="text-gray-600">
                      <span className="font-medium">Dirección:</span> {inst.metadata.address}
                    </div>
                  )}
                  {inst.metadata?.phone && (
                    <div className="text-gray-600">
                      <span className="font-medium">Teléfono:</span> {inst.metadata.phone}
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-100">
                    <span className="text-gray-600">Usuarios:</span>
                    <span className="font-semibold text-gray-900">{inst.userCount || 0}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => handleEditClick(inst)}
                    className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center space-x-1"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Editar</span>
                  </button>
                  {inst.status === 'ACTIVE' ? (
                    <button
                      onClick={() => handleSuspend(inst.id)}
                      className="flex-1 bg-danger-50 text-danger-700 hover:bg-danger-100 border border-danger-200 rounded-lg text-sm py-2 flex items-center justify-center space-x-1 transition-colors"
                      disabled={suspendMutation.isPending}
                    >
                      <Ban className="w-4 h-4" />
                      <span>Suspender</span>
                    </button>
                  ) : (
                    <button
                      className="flex-1 bg-gray-100 text-gray-500 rounded-lg text-sm py-2 flex items-center justify-center space-x-1 cursor-not-allowed"
                      disabled
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Suspendida</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 col-span-full text-center py-8">
              No se encontraron instituciones
            </p>
          )}
        </div>
      </div>

      {/* Modal */}
      <InstitutionModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        institution={editingInstitution}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </DashboardLayout>
  );
}

export default withAuth(InstitucionesPage, [UserRole.SUPER_ADMIN]);
