'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { patientsService } from '@/services/patients.service';
import { institutionsService } from '@/services/institutions.service';
import { appointmentsService } from '@/services/appointments.service';
import { useAuthStore } from '@/store/auth';
import { UserRole, Patient, Appointment, AppointmentStatus, DocumentType } from '@/types';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { withAuth } from '@/components/auth/withAuth';
import PatientModal from '@/components/patients/PatientModal';

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  [AppointmentStatus.SCHEDULED]: 'Programada',
  [AppointmentStatus.CONFIRMED]: 'Confirmada',
  [AppointmentStatus.COMPLETED]: 'Completada',
  [AppointmentStatus.CANCELLED]: 'Cancelada',
  [AppointmentStatus.NO_SHOW]: 'No asistió',
};

const STATUS_COLOR: Record<AppointmentStatus, string> = {
  [AppointmentStatus.SCHEDULED]: 'bg-blue-100 text-blue-800',
  [AppointmentStatus.CONFIRMED]: 'bg-green-100 text-green-800',
  [AppointmentStatus.COMPLETED]: 'bg-gray-100 text-gray-700',
  [AppointmentStatus.CANCELLED]: 'bg-red-100 text-red-800',
  [AppointmentStatus.NO_SHOW]: 'bg-orange-100 text-orange-800',
};

function getAge(birthDate?: string | null): string {
  if (!birthDate) return '-';
  const diff = Date.now() - new Date(birthDate).getTime();
  return `${Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))} años`;
}

function PatientsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [detailPatient, setDetailPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('');

  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

  // Todos los pacientes
  const { data, isLoading } = useQuery({
    queryKey: ['patients', searchTerm],
    queryFn: () => patientsService.getAll(searchTerm),
  });

  // Instituciones (solo SUPER_ADMIN)
  const { data: institutionsData } = useQuery({
    queryKey: ['institutions'],
    queryFn: () => institutionsService.getAll(),
    enabled: isSuperAdmin,
  });

  // Citas del paciente en detalle
  const { data: patientAppointmentsData, isLoading: isLoadingAppointments } = useQuery({
    queryKey: ['patient-appointments', detailPatient?.id],
    queryFn: () => appointmentsService.getAll({ patientId: detailPatient!.id }),
    enabled: !!detailPatient,
  });

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

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => patientsService.update(id, data),
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

  const deleteMutation = useMutation({
    mutationFn: patientsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Paciente eliminado exitosamente');
      if (detailPatient) setDetailPatient(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar el paciente');
    },
  });

  const handleCreate = () => { setSelectedPatient(null); setIsModalOpen(true); };
  const handleEdit = (patient: Patient) => { setSelectedPatient(patient); setIsModalOpen(true); };
  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de eliminar este paciente?')) deleteMutation.mutate(id);
  };
  const handleSubmit = (formData: any) => {
    if (selectedPatient) updateMutation.mutate({ id: selectedPatient.id, data: formData });
    else createMutation.mutate(formData);
  };

  const patients: Patient[] = data?.patients || [];
  const institutions = institutionsData?.institutions || [];
  const patientAppointments: Appointment[] = patientAppointmentsData?.appointments || [];

  // Stats rápidas
  const totalPatients = patients.length;
  const femaleCount = patients.filter((p) => p.gender === 'F').length;
  const maleCount = patients.filter((p) => p.gender === 'M').length;

  // Filtro por género en cliente
  const filtered = genderFilter
    ? patients.filter((p) => p.gender === genderFilter)
    : patients;

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Encabezado */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Pacientes</h1>
            <p className="text-sm text-gray-500 mt-1">Gestión completa de pacientes registrados</p>
          </div>
          <button
            onClick={handleCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            + Nuevo Paciente
          </button>
        </div>

        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
            <div className="text-3xl">🏥</div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{totalPatients}</p>
              <p className="text-sm text-gray-500">Total pacientes</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
            <div className="text-3xl">👩</div>
            <div>
              <p className="text-2xl font-bold text-pink-600">{femaleCount}</p>
              <p className="text-sm text-gray-500">Femenino</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
            <div className="text-3xl">👨</div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{maleCount}</p>
              <p className="text-sm text-gray-500">Masculino</p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <input
            type="text"
            placeholder="Buscar por nombre o documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[220px] max-w-sm px-4 py-2 border border-gray-300 rounded-md text-sm"
          />
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Todos los géneros</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
          </select>
        </div>

        <div className="flex gap-6">
          {/* Tabla principal */}
          <div className={`flex-1 transition-all ${detailPatient ? 'hidden lg:block' : ''}`}>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Cargando pacientes...</div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documento</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Edad / Género</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                      {isSuperAdmin && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Institución</th>
                      )}
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filtered.map((patient: Patient) => (
                      <tr
                        key={patient.id}
                        className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                          detailPatient?.id === patient.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                        onClick={() => setDetailPatient(patient)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-medium text-sm ${
                              patient.gender === 'F' ? 'bg-pink-500' : 'bg-blue-500'
                            }`}>
                              {patient.firstName[0]}{patient.lastName[0]}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {patient.firstName} {patient.lastName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700 mr-1">
                            {patient.documentType}
                          </span>
                          <span className="text-sm text-gray-900">{patient.documentNumber}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {getAge(patient.birthDate)} / {patient.gender === 'F' ? 'F' : patient.gender === 'M' ? 'M' : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {patient.phone || patient.email || '-'}
                        </td>
                        {isSuperAdmin && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(patient as any).institution?.name || '-'}
                          </td>
                        )}
                        <td
                          className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleEdit(patient)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
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
                    {filtered.length === 0 && (
                      <tr>
                        <td
                          colSpan={isSuperAdmin ? 6 : 5}
                          className="px-6 py-12 text-center text-gray-400"
                        >
                          {searchTerm || genderFilter
                            ? 'No se encontraron pacientes con los filtros aplicados'
                            : 'No hay pacientes registrados'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Panel de detalle */}
          {detailPatient && (
            <div className="w-full lg:w-96 bg-white rounded-lg shadow flex flex-col">
              {/* Header del panel */}
              <div className="flex justify-between items-center px-5 py-4 border-b bg-gray-50 rounded-t-lg">
                <h3 className="font-semibold text-gray-800">Detalle del Paciente</h3>
                <button
                  onClick={() => setDetailPatient(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 overflow-y-auto flex-1 space-y-5">
                {/* Avatar e info básica */}
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold ${
                    detailPatient.gender === 'F' ? 'bg-pink-500' : 'bg-blue-500'
                  }`}>
                    {detailPatient.firstName[0]}{detailPatient.lastName[0]}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-800">
                      {detailPatient.firstName} {detailPatient.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {detailPatient.documentType} {detailPatient.documentNumber}
                    </p>
                  </div>
                </div>

                {/* Información personal */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <h4 className="font-medium text-gray-700 mb-3">Información Personal</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-gray-500">Fecha nac.:</span></div>
                    <div className="text-gray-800">
                      {detailPatient.birthDate
                        ? new Date(detailPatient.birthDate).toLocaleDateString('es-CO')
                        : '-'}
                    </div>
                    <div><span className="text-gray-500">Edad:</span></div>
                    <div className="text-gray-800">{getAge(detailPatient.birthDate)}</div>
                    <div><span className="text-gray-500">Género:</span></div>
                    <div className="text-gray-800">
                      {detailPatient.gender === 'F' ? 'Femenino' : detailPatient.gender === 'M' ? 'Masculino' : '-'}
                    </div>
                    <div><span className="text-gray-500">Teléfono:</span></div>
                    <div className="text-gray-800">{detailPatient.phone || '-'}</div>
                    <div><span className="text-gray-500">Email:</span></div>
                    <div className="text-gray-800 truncate">{detailPatient.email || '-'}</div>
                    <div><span className="text-gray-500">Dirección:</span></div>
                    <div className="text-gray-800">{detailPatient.address || '-'}</div>
                  </div>
                </div>

                {/* Acciones rápidas */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(detailPatient)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(detailPatient.id)}
                    className="px-3 py-2 bg-red-100 text-red-700 text-sm rounded-md hover:bg-red-200"
                  >
                    Eliminar
                  </button>
                </div>

                {/* Citas del paciente */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Historial de Citas</h4>
                  {isLoadingAppointments ? (
                    <p className="text-sm text-gray-400 text-center py-4">Cargando citas...</p>
                  ) : patientAppointments.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-lg">
                      Sin citas registradas
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {patientAppointments
                        .sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime())
                        .map((apt: Appointment) => (
                          <div key={apt.id} className="border border-gray-200 rounded-lg p-3 text-sm">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-medium text-gray-800">
                                {new Date(apt.appointmentDate).toLocaleDateString('es-CO', {
                                  day: '2-digit', month: 'short', year: 'numeric',
                                })}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[apt.status]}`}>
                                {STATUS_LABEL[apt.status]}
                              </span>
                            </div>
                            <p className="text-gray-600">
                              {apt.startTime} - {apt.endTime}
                            </p>
                            <p className="text-gray-500 text-xs mt-0.5">
                              Dr(a). {apt.doctor.firstName} {apt.doctor.lastName}
                            </p>
                            {apt.reason && (
                              <p className="text-gray-500 text-xs mt-1 italic">"{apt.reason}"</p>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {isModalOpen && (
          <PatientModal
            isOpen={isModalOpen}
            onClose={() => { setIsModalOpen(false); setSelectedPatient(null); }}
            onSubmit={handleSubmit}
            patient={selectedPatient}
            institutions={isSuperAdmin ? institutions : []}
            isSuperAdmin={isSuperAdmin}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

export default withAuth(PatientsPage, [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.RECEPCIONISTA,
  UserRole.PLANIFICADOR,
  UserRole.CONSULTA,
]);

