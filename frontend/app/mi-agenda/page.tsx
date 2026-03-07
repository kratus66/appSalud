'use client';

import { useQuery } from '@tanstack/react-query';
import { appointmentsService } from '@/services/appointments.service';
import { useAuthStore } from '@/store/auth';
import { UserRole, Appointment, AppointmentStatus } from '@/types';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { withAuth } from '@/components/auth/withAuth';

function MySchedulePage() {
  const { user } = useAuthStore();

  // Obtener citas del doctor actual para hoy y los próximos 7 días
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);

  const { data, isLoading } = useQuery({
    queryKey: ['my-appointments'],
    queryFn: () => appointmentsService.getAll({
      startDate: today.toISOString().split('T')[0],
      endDate: nextWeek.toISOString().split('T')[0],
      doctorId: user?.id,
    }),
  });

  const appointments = data?.appointments || [];

  // Agrupar por fecha
  const appointmentsByDate = appointments.reduce((acc: any, apt: Appointment) => {
    const date = apt.appointmentDate.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(apt);
    return acc;
  }, {});

  const dates = Object.keys(appointmentsByDate).sort();

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.SCHEDULED:
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case AppointmentStatus.CONFIRMED:
        return 'bg-green-100 text-green-800 border-green-300';
      case AppointmentStatus.COMPLETED:
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case AppointmentStatus.CANCELLED:
        return 'bg-red-100 text-red-800 border-red-300';
      case AppointmentStatus.NO_SHOW:
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusLabel = (status: AppointmentStatus) => {
    const labels = {
      [AppointmentStatus.SCHEDULED]: 'Programada',
      [AppointmentStatus.CONFIRMED]: 'Confirmada',
      [AppointmentStatus.COMPLETED]: 'Completada',
      [AppointmentStatus.CANCELLED]: 'Cancelada',
      [AppointmentStatus.NO_SHOW]: 'No asistió',
    };
    return labels[status];
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Mi Agenda</h1>
          <p className="text-gray-600 mt-2">
            Bienvenido Dr. {user?.firstName} {user?.lastName}
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Cargando...</div>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No tienes citas programadas para los próximos 7 días
          </div>
        ) : (
          <div className="space-y-6">
            {dates.map((date) => {
              const dateObj = new Date(date);
              const isToday = date === today.toISOString().split('T')[0];
              const dayAppointments = appointmentsByDate[date].sort((a: Appointment, b: Appointment) =>
                a.startTime.localeCompare(b.startTime)
              );

              return (
                <div key={date} className="bg-white rounded-lg shadow">
                  <div className={`px-6 py-4 border-b ${isToday ? 'bg-blue-50' : 'bg-gray-50'}`}>
                    <h2 className={`text-lg font-semibold ${isToday ? 'text-blue-800' : 'text-gray-800'}`}>
                      {dateObj.toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                      {isToday && <span className="ml-2 text-blue-600">(Hoy)</span>}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {dayAppointments.length} cita{dayAppointments.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="p-6 space-y-3">
                    {dayAppointments.map((apt: Appointment) => (
                      <div
                        key={apt.id}
                        className={`border rounded-lg p-4 ${getStatusColor(apt.status)}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="text-lg font-semibold">
                                {apt.startTime} - {apt.endTime}
                              </div>
                              <span className="text-xs px-2 py-1 rounded bg-white bg-opacity-50">
                                {getStatusLabel(apt.status)}
                              </span>
                            </div>

                            <div className="mt-2">
                              <div className="font-medium text-gray-900">
                                Paciente: {apt.patient.firstName} {apt.patient.lastName}
                              </div>
                              <div className="text-sm text-gray-700">
                                Documento: {apt.patient.documentNumber}
                              </div>
                            </div>

                            {apt.reason && (
                              <div className="mt-2">
                                <div className="text-sm font-medium text-gray-700">Motivo:</div>
                                <div className="text-sm text-gray-600">{apt.reason}</div>
                              </div>
                            )}

                            {apt.notes && (
                              <div className="mt-2">
                                <div className="text-sm font-medium text-gray-700">Notas:</div>
                                <div className="text-sm text-gray-600">{apt.notes}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default withAuth(MySchedulePage, [UserRole.DOCTOR]);
