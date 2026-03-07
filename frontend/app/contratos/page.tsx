'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contractsService } from '@/services/contracts.service';
import { institutionsService } from '@/services/institutions.service';
import { Contract, UserRole } from '@/types';
import { useAuthStore } from '@/store/auth';
import { FileText, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { withAuth } from '@/components/auth/withAuth';
import { ContractModal, ContractFormData } from '@/components/contracts/ContractModal';
import { toast } from 'sonner';

function ContractsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  const canEdit = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN;
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['contracts', searchTerm],
    queryFn: () => contractsService.getAll({ search: searchTerm || undefined }),
  });

  // Query para instituciones (solo SUPER_ADMIN)
  const { data: institutionsData } = useQuery({
    queryKey: ['institutions'],
    queryFn: () => institutionsService.getAll(),
    enabled: isSuperAdmin,
  });

  // Mutación para crear
  const createMutation = useMutation({
    mutationFn: (data: ContractFormData) => {
      // Si no es SUPER_ADMIN, agregar la institución del usuario
      if (!isSuperAdmin && user?.institutionId) {
        return contractsService.create({ ...data, institutionId: user.institutionId });
      }
      return contractsService.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Contrato creado exitosamente');
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear contrato');
    },
  });

  // Mutación para actualizar
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ContractFormData }) =>
      contractsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Contrato actualizado exitosamente');
      setIsModalOpen(false);
      setSelectedContract(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar contrato');
    },
  });

  // Mutación para eliminar
  const deleteMutation = useMutation({
    mutationFn: (id: string) => contractsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Contrato eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar contrato');
    },
  });

  const handleEdit = (contract: Contract) => {
    setSelectedContract(contract);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedContract(null);
  };

  const handleModalSubmit = async (data: ContractFormData) => {
    if (selectedContract) {
      await updateMutation.mutateAsync({ id: selectedContract.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar el contrato "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const filteredContracts = contracts.filter((contract: Contract) =>
    contract.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div>
        <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-8 h-8" />
            Contratos Laborales
          </h1>
          <p className="text-gray-600 mt-1">
            Configuración de contratos y reglas laborales
          </p>
        </div>
        
        {canEdit && (
          <button 
            onClick={() => {
              setSelectedContract(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nuevo Contrato
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar contratos..."
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
                Contrato
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Horas Semanales
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Noches Consecutivas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descanso (hrs)
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
            ) : filteredContracts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No se encontraron contratos
                </td>
              </tr>
            ) : (
              filteredContracts.map((contract: Contract) => (
                <tr key={contract.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{contract.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{contract.weeklyHours}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{contract.maxConsecutiveNights}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{contract.requiredRestHours}</div>
                  </td>
                  {user?.role === UserRole.SUPER_ADMIN && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{contract.institution?.name}</div>
                    </td>
                  )}
                  {canEdit && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleEdit(contract)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(contract.id, contract.name)}
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
          </tbody>
        </table>
      </div>

      {/* ContractModal */}
      <ContractModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        contract={selectedContract}
        isLoading={createMutation.isPending || updateMutation.isPending}
        institutions={institutionsData?.institutions || []}
      />
      </div>
    </DashboardLayout>
  );
}

export default withAuth(ContractsPage);
