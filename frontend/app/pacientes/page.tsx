'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { patientsService } from '@/services/patients.service';
import { institutionsService } from '@/services/institutions.service';
import { useAuthStore } from '@/store/auth';
import { UserRole, Patient } from '@/types';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { withAuth } from '@/components/auth/withAuth';
import PatientModal from '@/components/patients/PatientModal';

function PatientsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

  // Cargar pacientes
  const { data, isLoading } = useQuery({
    queryKey: ['patients', searchTerm],
    queryFn: () => patientsService.getAll(searchTerm),
  });

  // Cargar instituciones (solo para SUPER_ADMIN)
  const { data: institutionsData } = useQuery({
    queryKey: ['institutions'],
    queryFn: () => institutionsService.getAll(),
    enabled: isSuperAdmin,
  });

  // Crear paciente
  const createMutation = useMutation({
    mutationFn: patientsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Paciente creado exitosamente');
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear el paciente');
    },
  });

  // Actualizar paciente
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      patientsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Paciente actualizado exitosamente');
      setIsModalOpen(false);
      setSelectedPatient(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar el paciente');
    },
  });

  // Eliminar paciente
  const deleteMutation = useMutation({
    mutationFn: patientsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Paciente eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar el paciente');
    },
  });

  const handleCreate = () => {
    setSelectedPatient(null);
    setIsModalOpen(true);
  };

  const handleEdit = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de eliminar este paciente?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (data: any) => {
    if (selectedPatient) {
      updateMutation.mutate({ id: selectedPatient.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const patients = data?.patients || [];
  const institutions = institutionsData?.institutions || [];

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Pacientes</h1>
          <button
            onClick={handleCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            + Nuevo Paciente
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar por nombre o documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-8">Cargando...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Documento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Contacto
                  </th>
                  {isSuperAdmin && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Institución
                    </th>
                  )}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {patients.map((patient: Patient) => (
                  <tr key={patient.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {patient.firstName} {patient.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {patient.documentType} {patient.documentNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {patient.phone || patient.email || '-'}
                      </div>
                    </td>
                    {isSuperAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {patient.institution?.name || '-'}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(patient)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(patient.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
                {patients.length === 0 && (
                  <tr>
                    <td
                      colSpan={isSuperAdmin ? 5 : 4}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No hay pacientes registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <PatientModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPatient(null);
          }}
          onSubmit={handleSubmit}
          patient={selectedPatient}
          institutions={institutions}
          isSuperAdmin={isSuperAdmin}
        />
      </div>
    </DashboardLayout>
  );
}

export default withAuth(PatientsPage, [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.RECEPCIONISTA,
  UserRole.DOCTOR,
]);
