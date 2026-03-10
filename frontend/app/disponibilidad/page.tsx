'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { withAuth } from '@/components/auth/withAuth';
import { availabilityService } from '@/services/availability.service';
import { usersService } from '@/services/users.service';
import { patientsService } from '@/services/patients.service';
import {
  UserRole, DoctorSchedule, TimeBlock, RecurringAppointment,
  RecurringFrequency, SlotStatus, AvailabilitySlot,
} from '@/types';
import { Calendar, Clock, Ban, RefreshCw, Plus, Trash2, ChevronDown } from 'lucide-react';

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const FREQ_LABELS: Record<RecurringFrequency, string> = {
  WEEKLY: 'Semanal',
  BIWEEKLY: 'Quincenal',
  MONTHLY: 'Mensual',
};

const SLOT_COLORS: Record<SlotStatus, string> = {
  FREE: 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200 cursor-pointer',
  BOOKED: 'bg-blue-100 border-blue-300 text-blue-800 cursor-not-allowed opacity-80',
  BLOCKED: 'bg-gray-300 border-gray-400 text-gray-600 cursor-not-allowed opacity-80',
};

function AvailabilityPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'schedules' | 'blocks' | 'recurring' | 'slots'>('schedules');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // ─── Schedule form ───────────────────────────────────────────
  const [scheduleForm, setScheduleForm] = useState({
    dayOfWeek: 1, startTime: '08:00', endTime: '17:00', slotDuration: 30,
  });

  // ─── Block form ──────────────────────────────────────────────
  const [blockForm, setBlockForm] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00', endTime: '10:00', reason: '',
  });

  // ─── Recurring form ──────────────────────────────────────────
  const [recurringForm, setRecurringForm] = useState({
    patientId: '', dayOfWeek: 1, startTime: '09:00', endTime: '09:30',
    frequency: RecurringFrequency.WEEKLY, reason: '',
    startDate: new Date().toISOString().split('T')[0], endDate: '',
  });

  // Load doctors
  const { data: doctorsData } = useQuery({
    queryKey: ['doctors-all'],
    queryFn: () => usersService.getAll(),
  });
  const doctors = (doctorsData?.users ?? []).filter((u: any) => u.role === UserRole.DOCTOR && u.isActive);

  // Load patients
  const { data: patientsData } = useQuery({
    queryKey: ['patients-all'],
    queryFn: () => patientsService.getAll(),
    enabled: tab === 'recurring',
  });
  const patients = patientsData?.patients ?? [];

  // Load schedule
  const { data: schedules = [] } = useQuery<DoctorSchedule[]>({
    queryKey: ['schedule', selectedDoctorId],
    queryFn: () => availabilityService.getScheduleByDoctor(selectedDoctorId),
    enabled: !!selectedDoctorId,
  });

  // Load blocks
  const { data: blocks = [] } = useQuery<TimeBlock[]>({
    queryKey: ['blocks', selectedDoctorId],
    queryFn: () => availabilityService.getBlocksByDoctor(selectedDoctorId),
    enabled: !!selectedDoctorId,
  });

  // Load recurring
  const { data: recurring = [] } = useQuery<RecurringAppointment[]>({
    queryKey: ['recurring', selectedDoctorId],
    queryFn: () => availabilityService.getRecurringByDoctor(selectedDoctorId),
    enabled: !!selectedDoctorId && tab === 'recurring',
  });

  // Load availability slots
  const { data: slotsData, isLoading: loadingSlots } = useQuery({
    queryKey: ['slots', selectedDoctorId, selectedDate],
    queryFn: () => availabilityService.getSlots(selectedDoctorId, selectedDate),
    enabled: !!selectedDoctorId && !!selectedDate && tab === 'slots',
  });

  // Mutations
  const createScheduleMut = useMutation({
    mutationFn: (dto: any) => availabilityService.createOrUpdateSchedule(dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['schedule', selectedDoctorId] }); toast.success('Horario guardado'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al guardar horario'),
  });

  const deleteScheduleMut = useMutation({
    mutationFn: availabilityService.deleteSchedule,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['schedule', selectedDoctorId] }); toast.success('Horario eliminado'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  const createBlockMut = useMutation({
    mutationFn: (dto: any) => availabilityService.createBlock(dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['blocks', selectedDoctorId] }); toast.success('Bloqueo creado'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al crear bloqueo'),
  });

  const deleteBlockMut = useMutation({
    mutationFn: availabilityService.deleteBlock,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['blocks', selectedDoctorId] }); toast.success('Bloqueo eliminado'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  const cancelRecurringMut = useMutation({
    mutationFn: availabilityService.cancelRecurring,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recurring', selectedDoctorId] }); toast.success('Cita recurrente cancelada'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  const createRecurringMut = useMutation({
    mutationFn: (dto: any) => availabilityService.createRecurring(dto),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['recurring', selectedDoctorId] });
      qc.invalidateQueries({ queryKey: ['appointments'] });
      toast.success(`Cita recurrente creada — ${res.generatedAppointments.length} citas generadas`);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al crear cita recurrente'),
  });

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId) return toast.error('Seleccione un médico');
    createScheduleMut.mutate({ doctorId: selectedDoctorId, ...scheduleForm });
  };

  const handleCreateBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId) return toast.error('Seleccione un médico');
    createBlockMut.mutate({ doctorId: selectedDoctorId, ...blockForm });
  };

  const handleCreateRecurring = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId) return toast.error('Seleccione un médico');
    if (!recurringForm.patientId) return toast.error('Seleccione un paciente');
    createRecurringMut.mutate({
      doctorId: selectedDoctorId,
      ...recurringForm,
      endDate: recurringForm.endDate || undefined,
    });
  };

  const tabs = [
    { id: 'schedules', label: 'Horarios', icon: Clock },
    { id: 'blocks', label: 'Bloqueos', icon: Ban },
    { id: 'recurring', label: 'Recurrentes', icon: RefreshCw },
    { id: 'slots', label: 'Disponibilidad', icon: Calendar },
  ] as const;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Disponibilidad Médica</h1>
          <p className="text-gray-500 mt-1">Gestiona horarios, bloqueos y citas recurrentes</p>
        </div>

        {/* Doctor selector */}
        <div className="bg-white rounded-lg border p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Médico</label>
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccione un médico...</option>
            {doctors.map((d: any) => (
              <option key={d.id} value={d.id}>
                Dr(a). {d.firstName} {d.lastName} {d.specialty ? `— ${d.specialty}` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors
                  ${tab === id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* ─── HORARIOS tab ─── */}
        {tab === 'schedules' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Plus size={18} className="text-blue-600" />
                Definir horario laboral
              </h2>
              <form onSubmit={handleCreateSchedule} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Día de la semana</label>
                  <select
                    value={scheduleForm.dayOfWeek}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, dayOfWeek: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    {DAY_NAMES.map((name, i) => (
                      <option key={i} value={i}>{name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora inicio</label>
                    <input type="time" value={scheduleForm.startTime}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora fin</label>
                    <input type="time" value={scheduleForm.endTime}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duración del slot (min)</label>
                  <select value={scheduleForm.slotDuration}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, slotDuration: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    {[15, 20, 30, 45, 60].map((m) => <option key={m} value={m}>{m} min</option>)}
                  </select>
                </div>
                <button type="submit" disabled={!selectedDoctorId || createScheduleMut.isPending}
                  className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 font-medium">
                  {createScheduleMut.isPending ? 'Guardando...' : 'Guardar horario'}
                </button>
              </form>
            </div>

            {/* Schedule list */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="font-semibold text-gray-800 mb-4">Horarios configurados</h2>
              {!selectedDoctorId ? (
                <p className="text-sm text-gray-400">Seleccione un médico para ver sus horarios</p>
              ) : schedules.length === 0 ? (
                <p className="text-sm text-gray-400">No hay horarios configurados</p>
              ) : (
                <div className="space-y-2">
                  {schedules.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div>
                        <p className="font-medium text-gray-900">{DAY_NAMES[s.dayOfWeek]}</p>
                        <p className="text-sm text-gray-500">{s.startTime} — {s.endTime} · Slots de {s.slotDuration} min</p>
                      </div>
                      <button onClick={() => deleteScheduleMut.mutate(s.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── BLOQUEOS tab ─── */}
        {tab === 'blocks' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Plus size={18} className="text-red-600" />
                Crear bloqueo de agenda
              </h2>
              <form onSubmit={handleCreateBlock} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                  <input type="date" value={blockForm.date}
                    onChange={(e) => setBlockForm({ ...blockForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora inicio</label>
                    <input type="time" value={blockForm.startTime}
                      onChange={(e) => setBlockForm({ ...blockForm, startTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora fin</label>
                    <input type="time" value={blockForm.endTime}
                      onChange={(e) => setBlockForm({ ...blockForm, endTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motivo (opcional)</label>
                  <input type="text" placeholder="Ej: Vacaciones, Reunión médica..."
                    value={blockForm.reason}
                    onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <button type="submit" disabled={!selectedDoctorId || createBlockMut.isPending}
                  className="w-full py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 font-medium">
                  {createBlockMut.isPending ? 'Creando...' : 'Crear bloqueo'}
                </button>
              </form>
            </div>

            {/* Blocks list */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="font-semibold text-gray-800 mb-4">Bloqueos activos</h2>
              {!selectedDoctorId ? (
                <p className="text-sm text-gray-400">Seleccione un médico</p>
              ) : blocks.length === 0 ? (
                <p className="text-sm text-gray-400">No hay bloqueos registrados</p>
              ) : (
                <div className="space-y-2">
                  {blocks.map((b) => (
                    <div key={b.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                      <div>
                        <p className="font-medium text-gray-900">
                          {new Date(b.date + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </p>
                        <p className="text-sm text-gray-600">{b.startTime} — {b.endTime}</p>
                        {b.reason && <p className="text-xs text-gray-500 mt-0.5">📌 {b.reason}</p>}
                      </div>
                      <button onClick={() => deleteBlockMut.mutate(b.id)}
                        className="p-1.5 text-red-500 hover:bg-red-100 rounded">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── RECURRENTES tab ─── */}
        {tab === 'recurring' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Plus size={18} className="text-purple-600" />
                Nueva cita recurrente
              </h2>
              <form onSubmit={handleCreateRecurring} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paciente</label>
                  <select value={recurringForm.patientId}
                    onChange={(e) => setRecurringForm({ ...recurringForm, patientId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md" required>
                    <option value="">Seleccione...</option>
                    {patients.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName} — {p.documentNumber}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Día</label>
                    <select value={recurringForm.dayOfWeek}
                      onChange={(e) => setRecurringForm({ ...recurringForm, dayOfWeek: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md">
                      {DAY_NAMES.map((n, i) => <option key={i} value={i}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia</label>
                    <select value={recurringForm.frequency}
                      onChange={(e) => setRecurringForm({ ...recurringForm, frequency: e.target.value as RecurringFrequency })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md">
                      {Object.entries(FREQ_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora inicio</label>
                    <input type="time" value={recurringForm.startTime}
                      onChange={(e) => setRecurringForm({ ...recurringForm, startTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora fin</label>
                    <input type="time" value={recurringForm.endTime}
                      onChange={(e) => setRecurringForm({ ...recurringForm, endTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
                    <input type="date" value={recurringForm.startDate}
                      onChange={(e) => setRecurringForm({ ...recurringForm, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin (opcional)</label>
                    <input type="date" value={recurringForm.endDate}
                      onChange={(e) => setRecurringForm({ ...recurringForm, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                  <input type="text" placeholder="Ej: Terapia semanal"
                    value={recurringForm.reason}
                    onChange={(e) => setRecurringForm({ ...recurringForm, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <button type="submit" disabled={!selectedDoctorId || createRecurringMut.isPending}
                  className="w-full py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-300 font-medium">
                  {createRecurringMut.isPending ? 'Creando...' : 'Crear cita recurrente'}
                </button>
              </form>
            </div>

            {/* Recurring list */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="font-semibold text-gray-800 mb-4">Citas recurrentes activas</h2>
              {!selectedDoctorId ? (
                <p className="text-sm text-gray-400">Seleccione un médico</p>
              ) : recurring.length === 0 ? (
                <p className="text-sm text-gray-400">No hay citas recurrentes</p>
              ) : (
                <div className="space-y-3">
                  {recurring.map((r) => (
                    <div key={r.id} className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">
                            {r.patient.firstName} {r.patient.lastName}
                          </p>
                          <p className="text-sm text-purple-700">
                            {FREQ_LABELS[r.frequency]} — {DAY_NAMES[r.dayOfWeek]} {r.startTime}–{r.endTime}
                          </p>
                          {r.reason && <p className="text-xs text-gray-500">📌 {r.reason}</p>}
                          <p className="text-xs text-gray-400">
                            {new Date(r.startDate).toLocaleDateString('es-CO')}
                            {r.endDate ? ` → ${new Date(r.endDate).toLocaleDateString('es-CO')}` : ' → indefinido'}
                          </p>
                        </div>
                        <button onClick={() => { if (confirm('¿Cancelar esta cita recurrente y sus futuras instancias?')) cancelRecurringMut.mutate(r.id); }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── SLOTS tab ─── */}
        {tab === 'slots' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border p-4 flex gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input type="date" value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              {/* Legend */}
              <div className="flex gap-3 ml-auto text-xs">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-300 inline-block" /> Libre</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-300 inline-block" /> Cita</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-400 inline-block" /> Bloqueado</span>
              </div>
            </div>

            {!selectedDoctorId ? (
              <p className="text-sm text-gray-400">Seleccione un médico</p>
            ) : loadingSlots ? (
              <div className="text-center py-8 text-gray-400">Cargando disponibilidad...</div>
            ) : !slotsData?.hasSchedule ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <p className="text-yellow-800 font-medium">El médico no tiene horario configurado para este día</p>
                <p className="text-yellow-600 text-sm mt-1">Ve a la pestaña "Horarios" para configurarlo</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-800">
                    {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h2>
                  {slotsData.summary && (
                    <div className="flex gap-3 text-sm">
                      <span className="text-green-700 font-medium">{slotsData.summary.free} libre</span>
                      <span className="text-blue-700 font-medium">{slotsData.summary.booked} cita</span>
                      <span className="text-gray-600 font-medium">{slotsData.summary.blocked} bloqueado</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {slotsData.slots.map((slot: AvailabilitySlot) => (
                    <div
                      key={slot.time}
                      title={
                        slot.status === SlotStatus.BOOKED
                          ? `${slot.patientName}${slot.reason ? ' — ' + slot.reason : ''}`
                          : slot.status === SlotStatus.BLOCKED
                          ? `Bloqueado${slot.blockReason ? ': ' + slot.blockReason : ''}`
                          : 'Disponible'
                      }
                      className={`p-2 rounded border text-center text-xs font-medium transition-all ${SLOT_COLORS[slot.status]}`}
                    >
                      <div>{slot.time}</div>
                      {slot.status === SlotStatus.BOOKED && (
                        <div className="mt-0.5 text-xs truncate text-blue-700">{slot.patientName?.split(' ')[0]}</div>
                      )}
                      {slot.status === SlotStatus.BLOCKED && (
                        <div className="mt-0.5 text-xs text-gray-500">🔒</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default withAuth(AvailabilityPage, [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPCIONISTA]);
