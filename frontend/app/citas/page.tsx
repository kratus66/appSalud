'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { appointmentsService } from '@/services/appointments.service';
import { useAuthStore } from '@/store/auth';
import { UserRole, Appointment, AppointmentStatus } from '@/types';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { withAuth } from '@/components/auth/withAuth';
import AppointmentModal from '@/components/appointments/AppointmentModal';

function AppointmentsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [preselectedDate, setPreselectedDate] = useState<string | null>(null);

  // Calcular rango de fechas para la semana
  const getWeekRange = (date: string) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lunes
    const monday = new Date(d.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    return {
      startDate: monday.toISOString().split('T')[0],
      endDate: sunday.toISOString().split('T')[0],
    };
  };

  // Calcular rango de fechas para el mes
  const getMonthRange = (date: string) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    return {
      startDate: firstDay.toISOString().split('T')[0],
      endDate: lastDay.toISOString().split('T')[0],
    };
  };

  const dateRange = viewMode === 'week' ? getWeekRange(selectedDate) : getMonthRange(selectedDate);

  // Cargar citas
  const { data, isLoading } = useQuery({
    queryKey: ['appointments', dateRange.startDate, dateRange.endDate],
    queryFn: () => appointmentsService.getAll({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    }),
  });

  // Crear cita
  const createMutation = useMutation({
    mutationFn: appointmentsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Cita creada exitosamente');
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear la cita');
    },
  });

  // Actualizar cita
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      appointmentsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Cita actualizada exitosamente');
      setIsModalOpen(false);
      setSelectedAppointment(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar la cita');
    },
  });

  // Cancelar cita
  const cancelMutation = useMutation({
    mutationFn: appointmentsService.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Cita cancelada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al cancelar la cita');
    },
  });

  const handleCreate = (date?: string) => {
    setSelectedAppointment(null);
    setPreselectedDate(date || null);
    setIsModalOpen(true);
  };

  const handleEdit = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setPreselectedDate(null);
    setIsModalOpen(true);
  };

  const handleCancel = (id: string) => {
    if (confirm('¿Está seguro de cancelar esta cita?')) {
      cancelMutation.mutate(id);
    }
  };

  const handleSubmit = (data: any) => {
    if (selectedAppointment) {
      updateMutation.mutate({ id: selectedAppointment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const appointments = data?.appointments || [];

  // Generar días de la semana
  const generateWeekDays = () => {
    const days = [];
    const start = new Date(dateRange.startDate);
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push(date);
    }
    return days;
  };

  // Generar días del mes (incluye días del mes anterior y siguiente para llenar semanas completas)
  const generateMonthDays = () => {
    const d = new Date(selectedDate);
    const year = d.getFullYear();
    const month = d.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Lunes = 0
    const daysInMonth = lastDay.getDate();
    const days: Date[] = [];
    
    // Días del mes anterior
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonthLastDay - i));
    }
    
    // Días del mes actual
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    // Días del mes siguiente
    const remainingDays = 42 - days.length; // 6 semanas completas
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    return days;
  };

  const calendarDays = viewMode === 'week' ? generateWeekDays() : generateMonthDays();

  // Agrupar citas por fecha
  const appointmentsByDate = appointments.reduce((acc: any, apt: Appointment) => {
    const date = apt.appointmentDate.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(apt);
    return acc;
  }, {});

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

  const navigate = (direction: 'prev' | 'next') => {
    const current = new Date(selectedDate);
    if (viewMode === 'week') {
      current.setDate(current.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      current.setMonth(current.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const getHeaderText = () => {
    if (viewMode === 'week') {
      return `${new Date(dateRange.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })} - ${new Date(dateRange.endDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    } else {
      const d = new Date(selectedDate);
      return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Citas Médicas</h1>
          <button
            onClick={() => handleCreate()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            + Nueva Cita
          </button>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => navigate('prev')}
              className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              Hoy
            </button>
            <button
              onClick={() => navigate('next')}
              className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              Siguiente →
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-lg font-semibold text-gray-700 capitalize">
              {getHeaderText()}
            </div>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'week'
                    ? 'bg-white text-blue-600 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'month'
                    ? 'bg-white text-blue-600 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Mes
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Cargando...</div>
        ) : (
          <>
            {viewMode === 'month' && (
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                  <div key={day} className="text-center font-semibold text-gray-600 py-2">
                    {day}
                  </div>
                ))}
              </div>
            )}
            <div className={`grid gap-2 ${viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-7'}`}>
              {calendarDays.map((day, index) => {
                const dateStr = day.toISOString().split('T')[0];
                const dayAppointments = appointmentsByDate[dateStr] || [];
                const isToday = dateStr === new Date().toISOString().split('T')[0];
                const currentMonth = new Date(selectedDate).getMonth();
                const isCurrentMonth = day.getMonth() === currentMonth;

                return (
                  <div
                    key={`${dateStr}-${index}`}
                    className={`group relative bg-white border rounded-lg p-3 transition-all ${
                      viewMode === 'week' ? 'min-h-[300px]' : 'min-h-[120px]'
                    } ${
                      isToday ? 'border-blue-500 border-2' : 'border-gray-200'
                    } ${
                      viewMode === 'month' && !isCurrentMonth ? 'opacity-40' : ''
                    } hover:shadow-md hover:border-blue-300`}
                  >
                    <div className="font-semibold text-gray-800 mb-2 text-center">
                      {viewMode === 'week' && (
                        <div className="text-xs text-gray-500">
                          {day.toLocaleDateString('es-ES', { weekday: 'short' })}
                        </div>
                      )}
                      <div className={`text-lg ${isToday ? 'text-blue-600' : ''}`}>
                        {day.getDate()}
                      </div>
                    </div>

                    {/* Botón + que aparece en hover */}
                    <button
                      onClick={() => handleCreate(dateStr)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500 hover:bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-lg"
                      title="Crear cita"
                    >
                      +
                    </button>

                    <div className="space-y-1">
                      {dayAppointments
                        .slice(0, viewMode === 'month' ? 3 : 10)
                        .sort((a: Appointment, b: Appointment) => a.startTime.localeCompare(b.startTime))
                        .map((apt: Appointment) => (
                          <div
                            key={apt.id}
                            className={`text-xs p-2 rounded border cursor-pointer ${getStatusColor(apt.status)}`}
                            onClick={() => handleEdit(apt)}
                          >
                            <div className="font-medium">
                              {apt.startTime} - {apt.endTime}
                            </div>
                            <div className="truncate">
                              {apt.patient.firstName} {apt.patient.lastName}
                            </div>
                            {viewMode === 'week' && (
                              <>
                                <div className="text-xs opacity-75 truncate">
                                  Dr. {apt.doctor.firstName} {apt.doctor.lastName}
                                </div>
                                {apt.reason && (
                                  <div className="text-xs opacity-75 truncate mt-1">
                                    {apt.reason}
                                  </div>
                                )}
                                <div className="text-xs mt-1">
                                  {getStatusLabel(apt.status)}
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      {viewMode === 'month' && dayAppointments.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{dayAppointments.length - 3} más
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Leyenda</h3>
          <div className="flex flex-wrap gap-4">
            {Object.values(AppointmentStatus).map((status) => (
              <div key={status} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${getStatusColor(status)}`}></div>
                <span className="text-sm text-gray-700">{getStatusLabel(status)}</span>
              </div>
            ))}
          </div>
        </div>

        <AppointmentModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAppointment(null);
            setPreselectedDate(null);
          }}
          onSubmit={handleSubmit}
          appointment={selectedAppointment}
          preselectedDate={preselectedDate}
        />
      </div>
    </DashboardLayout>
  );
}

export default withAuth(AppointmentsPage, [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.RECEPCIONISTA,
  UserRole.PLANIFICADOR,
]);
