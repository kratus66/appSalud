'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Appointment, AppointmentStatus, Patient } from '@/types';
import { patientsService } from '@/services/patients.service';
import { usersService } from '@/services/users.service';
import { appointmentsService } from '@/services/appointments.service';
import { Search } from 'lucide-react';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  appointment?: Appointment | null;
  preselectedDate?: string | null;
}

export default function AppointmentModal({
  isOpen,
  onClose,
  onSubmit,
  appointment,
  preselectedDate,
}: AppointmentModalProps) {
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: '',
    startTime: '',
    endTime: '',
    reason: '',
    notes: '',
    status: AppointmentStatus.SCHEDULED,
  });

  const [selectedDate, setSelectedDate] = useState('');
  const [doctorAvailability, setDoctorAvailability] = useState<Appointment[]>([]);
  const [documentNumber, setDocumentNumber] = useState('');
  const [searchedPatient, setSearchedPatient] = useState<Patient | null>(null);
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Cargar doctores
  const { data: doctorsData } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => usersService.getAll(),
    enabled: isOpen,
  });

  // Buscar paciente por documento
  const handleSearchPatient = async () => {
    if (!documentNumber || documentNumber.trim() === '') {
      setSearchError('Ingrese un número de documento');
      return;
    }

    setIsSearching(true);
    setSearchError('');
    setSearchedPatient(null);
    
    try {
      const result = await patientsService.getAll(documentNumber.trim());
      const patient = result.patients?.find((p: Patient) => 
        p.documentNumber === documentNumber.trim()
      );
      
      if (patient) {
        setSearchedPatient(patient);
        setFormData({ ...formData, patientId: patient.id });
        setSearchError('');
      } else {
        setSearchError('No se encontró ningún paciente con ese documento');
        setSearchedPatient(null);
        setFormData({ ...formData, patientId: '' });
      }
    } catch (error) {
      setSearchError('Error al buscar el paciente');
      setSearchedPatient(null);
      setFormData({ ...formData, patientId: '' });
    } finally {
      setIsSearching(false);
    }
  };

  // Limpiar búsqueda de paciente
  const handleClearPatient = () => {
    setDocumentNumber('');
    setSearchedPatient(null);
    setSearchError('');
    setFormData({ ...formData, patientId: '' });
  };

  useEffect(() => {
    if (appointment) {
      setFormData({
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        appointmentDate: appointment.appointmentDate.split('T')[0],
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        reason: appointment.reason || '',
        notes: appointment.notes || '',
        status: appointment.status,
      });
      setSelectedDate(appointment.appointmentDate.split('T')[0]);
    } else {
      // Usar preselectedDate si está disponible, si no usar hoy
      const defaultDate = preselectedDate || new Date().toISOString().split('T')[0];
      setFormData({
        patientId: '',
        doctorId: '',
        appointmentDate: defaultDate,
        startTime: '',
        endTime: '',
        reason: '',
        notes: '',
        status: AppointmentStatus.SCHEDULED,
      });
      setSelectedDate(defaultDate);
    }
  }, [appointment, preselectedDate]);

  // Cargar disponibilidad del doctor cuando cambien doctor o fecha
  useEffect(() => {
    if (formData.doctorId && selectedDate) {
      appointmentsService
        .getDoctorAvailability(formData.doctorId, selectedDate)
        .then((data) => setDoctorAvailability(data))
        .catch(() => setDoctorAvailability([]));
    }
  }, [formData.doctorId, selectedDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setFormData({ ...formData, appointmentDate: date });
  };

  const doctors = doctorsData?.users.filter((u: any) => u.role === 'DOCTOR' && u.isActive) || [];

  const generateTimeOptions = () => {
    const options = [];
    for (let h = 6; h <= 20; h++) {
      for (let m = 0; m < 60; m += 15) {
        const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        options.push(time);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            {appointment ? 'Editar Cita' : 'Nueva Cita'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-4">
            {/* Búsqueda de paciente por documento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paciente *
              </label>
              
              {appointment ? (
                // Modo edición: mostrar paciente actual (solo lectura)
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                  <p className="text-gray-900">
                    {appointment.patient.firstName} {appointment.patient.lastName}
                  </p>
                  <p className="text-sm text-gray-500">
                    Doc: {appointment.patient.documentNumber}
                  </p>
                </div>
              ) : (
                // Modo creación: buscar por documento
                <>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Número de documento"
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchPatient())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <button
                      type="button"
                      onClick={handleSearchPatient}
                      disabled={isSearching}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
                    >
                      {isSearching ? (
                        <span>Buscando...</span>
                      ) : (
                        <>
                          <Search size={18} />
                          Buscar
                        </>
                      )}
                    </button>
                  </div>

                  {/* Resultado de búsqueda */}
                  {searchedPatient && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-green-900">
                            {searchedPatient.firstName} {searchedPatient.lastName}
                          </p>
                          <p className="text-sm text-green-700">
                            Doc: {searchedPatient.documentNumber}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleClearPatient}
                          className="text-green-700 hover:text-green-900"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Error de búsqueda */}
                  {searchError && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-700">{searchError}</p>
                    </div>
                  )}

                  {/* Campo oculto requerido para validación */}
                  <input
                    type="hidden"
                    value={formData.patientId}
                    required
                  />
                </>
              )}
            </div>

            {/* Doctor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Doctor *
              </label>
              <select
                value={formData.doctorId}
                onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Seleccione un doctor...</option>
                {doctors.map((doctor: any) => (
                  <option key={doctor.id} value={doctor.id}>
                    Dr. {doctor.firstName} {doctor.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha *
              </label>
              <input
                type="date"
                value={formData.appointmentDate}
                onChange={(e) => handleDateChange(e.target.value)}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora Inicio *
              </label>
              <select
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Seleccione...</option>
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora Fin *
              </label>
              <select
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Seleccione...</option>
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {doctorAvailability.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-sm font-medium text-yellow-800 mb-2">
                Citas programadas del doctor ese día:
              </p>
              <ul className="text-sm text-yellow-700 space-y-1">
                {doctorAvailability.map((apt) => (
                  <li key={apt.id}>
                    {apt.startTime} - {apt.endTime} ({apt.status})
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo de Consulta
            </label>
            <input
              type="text"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Ej: Consulta general, Control, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {appointment && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as AppointmentStatus })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value={AppointmentStatus.SCHEDULED}>Programada</option>
                <option value={AppointmentStatus.CONFIRMED}>Confirmada</option>
                <option value={AppointmentStatus.COMPLETED}>Completada</option>
                <option value={AppointmentStatus.CANCELLED}>Cancelada</option>
                <option value={AppointmentStatus.NO_SHOW}>No asistió</option>
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              {appointment ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
