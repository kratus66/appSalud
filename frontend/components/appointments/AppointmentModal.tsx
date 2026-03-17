'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Appointment, AppointmentStatus, Patient, SlotStatus, AvailabilitySlot } from '@/types';
import { patientsService } from '@/services/patients.service';
import { doctorsService } from '@/services/doctors.service';
import { availabilityService } from '@/services/availability.service';
import { Search, Clock } from 'lucide-react';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  appointment?: Appointment | null;
  preselectedDate?: string | null;
}

const SLOT_COLORS: Record<SlotStatus, string> = {
  FREE: 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200 cursor-pointer',
  BOOKED: 'bg-blue-100 border-blue-300 text-blue-800 cursor-not-allowed opacity-70',
  BLOCKED: 'bg-gray-200 border-gray-400 text-gray-500 cursor-not-allowed opacity-70',
};

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
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [documentNumber, setDocumentNumber] = useState('');
  const [searchedPatient, setSearchedPatient] = useState<Patient | null>(null);
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [patientMode, setPatientMode] = useState<'search' | 'select'>('search');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [useManualTime, setUseManualTime] = useState(false);

  // Cargar doctores
  const { data: doctorsData } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => doctorsService.getAll(),
    enabled: isOpen,
  });

  // Cargar todos los pacientes (para modo selector)
  const { data: patientsData } = useQuery({
    queryKey: ['patients-all'],
    queryFn: () => patientsService.getAll(),
    enabled: isOpen && patientMode === 'select',
  });

  // Cargar slots de disponibilidad
  const { data: slotsData, isLoading: loadingSlots } = useQuery({
    queryKey: ['slots-modal', formData.doctorId, selectedDate],
    queryFn: () => availabilityService.getSlots(formData.doctorId, selectedDate),
    enabled: !!formData.doctorId && !!selectedDate && isOpen && !appointment,
  });

  const doctors = doctorsData?.doctors || [];
  const allPatients = patientsData?.patients || [];

  // Especialidades únicas (vienen de doctorProfile.specialty.name)
  const specialties = Array.from(
    new Set(doctors.map((d: any) => d.doctorProfile?.specialty?.name).filter(Boolean))
  ).sort() as string[];

  // Doctores filtrados por especialidad
  const filteredDoctors = specialtyFilter
    ? doctors.filter((d: any) => d.doctorProfile?.specialty?.name === specialtyFilter)
    : doctors;

  // Doctor seleccionado actualmente
  const selectedDoctor = doctors.find((d: any) => d.id === formData.doctorId);

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
        setFormData((prev) => ({ ...prev, patientId: patient.id }));
        setSearchError('');
      } else {
        setSearchError('No se encontró ningún paciente con ese documento');
        setSearchedPatient(null);
        setFormData((prev) => ({ ...prev, patientId: '' }));
      }
    } catch {
      setSearchError('Error al buscar el paciente');
      setSearchedPatient(null);
      setFormData((prev) => ({ ...prev, patientId: '' }));
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearPatient = () => {
    setDocumentNumber('');
    setSearchedPatient(null);
    setSearchError('');
    setFormData((prev) => ({ ...prev, patientId: '' }));
  };

  const handleSelectSlot = (slot: AvailabilitySlot) => {
    if (slot.status !== SlotStatus.FREE) return;
    setSelectedSlot(slot);
    setFormData((prev) => ({ ...prev, startTime: slot.time, endTime: slot.endTime }));
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
      setUseManualTime(true);
    } else {
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
      setSelectedSlot(null);
      setSearchedPatient(null);
      setDocumentNumber('');
      setUseManualTime(false);
    }
  }, [appointment, preselectedDate, isOpen]);

  // Clear slot selection when doctor or date changes
  useEffect(() => {
    setSelectedSlot(null);
    setFormData((prev) => ({ ...prev, startTime: '', endTime: '' }));
  }, [formData.doctorId, selectedDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId) {
      alert('Debe seleccionar un paciente');
      return;
    }
    if (!formData.startTime || !formData.endTime) {
      alert('Debe seleccionar un horario');
      return;
    }
    onSubmit(formData);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setFormData((prev) => ({ ...prev, appointmentDate: date }));
  };

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
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* ── PACIENTE ── */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">Paciente *</label>
              {!appointment && (
                <div className="flex gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => { setPatientMode('search'); handleClearPatient(); }}
                    className={`px-2 py-1 rounded ${patientMode === 'search' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    Buscar por doc.
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPatientMode('select'); handleClearPatient(); }}
                    className={`px-2 py-1 rounded ${patientMode === 'select' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    Seleccionar de lista
                  </button>
                </div>
              )}
            </div>

            {appointment ? (
              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                <p className="text-gray-900">
                  {appointment.patient.firstName} {appointment.patient.lastName}
                </p>
                <p className="text-sm text-gray-500">Doc: {appointment.patient.documentNumber}</p>
              </div>
            ) : patientMode === 'search' ? (
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
                    {isSearching ? <span>Buscando...</span> : <><Search size={18} /> Buscar</>}
                  </button>
                </div>
                {searchedPatient && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md flex justify-between items-start">
                    <div>
                      <p className="font-medium text-green-900">
                        {searchedPatient.firstName} {searchedPatient.lastName}
                      </p>
                      <p className="text-sm text-green-700">Doc: {searchedPatient.documentNumber}</p>
                    </div>
                    <button type="button" onClick={handleClearPatient} className="text-green-700 hover:text-green-900">✕</button>
                  </div>
                )}
                {searchError && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700">{searchError}</p>
                  </div>
                )}
                <input type="hidden" value={formData.patientId} required />
              </>
            ) : (
              <select
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Seleccione un paciente...</option>
                {allPatients.map((p: Patient) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} — {p.documentType} {p.documentNumber}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* ── DOCTOR ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor *</label>

            {/* Filtro por especialidad */}
            <select
              value={specialtyFilter}
              onChange={(e) => { setSpecialtyFilter(e.target.value); setFormData({ ...formData, doctorId: '' }); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2 text-sm bg-gray-50"
            >
              <option value="">Todas las especialidades</option>
              {specialties.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={formData.doctorId}
              onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Seleccione un doctor...</option>
              {filteredDoctors.map((doctor: any) => (
                <option key={doctor.id} value={doctor.id}>
                  Dr(a). {doctor.firstName} {doctor.lastName}
                  {doctor.doctorProfile?.specialty?.name ? ` — ${doctor.doctorProfile.specialty.name}` : ''}
                </option>
              ))}
            </select>

            {(selectedDoctor as any)?.doctorProfile?.specialty?.name && (
              <p className="mt-1 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded inline-block">
                🩺 {(selectedDoctor as any).doctorProfile.specialty.name}
              </p>
            )}
          </div>

          {/* ── FECHA Y HORAS ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
            <input
              type="date"
              value={formData.appointmentDate}
              onChange={(e) => handleDateChange(e.target.value)}
              required
              min={!appointment ? new Date().toISOString().split('T')[0] : undefined}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* ── SELECTOR DE SLOT / HORARIO ── */}
          {!appointment ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Horario *</label>
                <button
                  type="button"
                  onClick={() => { setUseManualTime(!useManualTime); setSelectedSlot(null); setFormData((prev) => ({ ...prev, startTime: '', endTime: '' })); }}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {useManualTime ? '← Ver disponibilidad' : 'Ingresar hora manual'}
                </button>
              </div>

              {useManualTime ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Hora inicio</label>
                    <select value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      required className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                      <option value="">Seleccione...</option>
                      {timeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Hora fin</label>
                    <select value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      required className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                      <option value="">Seleccione...</option>
                      {timeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              ) : !formData.doctorId || !formData.appointmentDate ? (
                <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4 text-center text-sm text-gray-400">
                  <Clock size={20} className="mx-auto mb-1 opacity-40" />
                  Seleccione médico y fecha para ver disponibilidad
                </div>
              ) : loadingSlots ? (
                <div className="text-center py-4 text-sm text-gray-400">Cargando disponibilidad...</div>
              ) : !slotsData?.hasSchedule ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                  ⚠️ El médico no tiene horario configurado para ese día.
                  <button type="button" onClick={() => setUseManualTime(true)}
                    className="ml-2 text-blue-600 underline">Ingresar hora manual</button>
                </div>
              ) : (
                <div>
                  {/* Legend */}
                  <div className="flex gap-3 text-xs mb-2">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-green-300 inline-block" /> Libre</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-300 inline-block" /> Cita</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-gray-400 inline-block" /> Bloqueado</span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-1">
                    {slotsData.slots.map((slot: AvailabilitySlot) => {
                      const isSelected = selectedSlot?.time === slot.time;
                      return (
                        <button
                          type="button"
                          key={slot.time}
                          disabled={slot.status !== SlotStatus.FREE}
                          onClick={() => handleSelectSlot(slot)}
                          title={
                            slot.status === SlotStatus.BOOKED
                              ? `Cita: ${slot.patientName}${slot.reason ? ' — ' + slot.reason : ''}`
                              : slot.status === SlotStatus.BLOCKED
                              ? `Bloqueado${slot.blockReason ? ': ' + slot.blockReason : ''}`
                              : slot.time
                          }
                          className={`py-1.5 rounded border text-xs font-medium transition-all
                            ${isSelected ? 'bg-blue-600 border-blue-700 text-white ring-2 ring-blue-400' : SLOT_COLORS[slot.status]}`}
                        >
                          {slot.time}
                          {slot.status === SlotStatus.BOOKED && <div className="text-xs truncate opacity-70">{slot.patientName?.split(' ')[0]}</div>}
                          {slot.status === SlotStatus.BLOCKED && <div>🔒</div>}
                        </button>
                      );
                    })}
                  </div>
                  {selectedSlot && (
                    <p className="mt-2 text-xs text-blue-700 bg-blue-50 rounded px-2 py-1 inline-block">
                      ✓ Seleccionado: {selectedSlot.time} – {selectedSlot.endTime}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            // Edit mode: show current times, editable
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Hora inicio</label>
                <select value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                  {timeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Hora fin</label>
                <select value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                  {timeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de Consulta</label>
            <input
              type="text"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Ej: Consulta general, Control, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {appointment && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
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
            <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700">
              {appointment ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
