'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Plus, X, AlertCircle, UserPlus, Settings2 } from 'lucide-react';
import { toast } from 'sonner';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { withAuth } from '@/components/auth/withAuth';
import { useAuthStore } from '@/store/auth';
import { schedulesService } from '@/services/schedules.service';
import { usersService } from '@/services/users.service';

import { ScheduleGrid } from '../programacion/components/ScheduleGrid';
import { ViolationsPanel } from '../programacion/components/ViolationsPanel';
import { ScheduleHeader } from '../programacion/components/ScheduleHeader';
import { ShiftsTab } from './components/ShiftsTab';

import type {
  WorkSchedule,
  ShiftType,
  ShiftAssignment,
  CreateScheduleDto,
  ValidationResult,
  ScheduleViolation,
} from '@/types/schedule.types';
import { SHIFT_LABELS, SHIFT_COLORS } from '@/types/schedule.types';
import { UserRole } from '@/types';

// ─── Modal Crear Malla ────────────────────────────────────────────────────────

function CreateScheduleModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (s: WorkSchedule) => void;
}) {
  const [form, setForm] = useState<CreateScheduleDto>({
    name: '',
    periodType: 'MONTHLY',
    startDate: '',
    endDate: '',
    notes: '',
  });

  const mutation = useMutation({
    mutationFn: (dto: CreateScheduleDto) => schedulesService.create(dto),
    onSuccess: (s) => { toast.success('Malla creada'); onCreated(s); },
    onError: () => toast.error('Error al crear la malla'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.startDate || !form.endDate) {
      toast.error('Nombre, fecha inicio y fin son obligatorios');
      return;
    }
    mutation.mutate(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">Nueva malla de turnos</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              type="text" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="Ej. Malla Enero 2025"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de período</label>
            <select
              value={form.periodType}
              onChange={(e) => setForm({ ...form, periodType: e.target.value as any })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="WEEKLY">Semanal</option>
              <option value="BIWEEKLY">Quincenal</option>
              <option value="MONTHLY">Mensual</option>
              <option value="CUSTOM">Personalizado</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inicio *</label>
              <input type="date" value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fin *</label>
              <input type="date" value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {mutation.isPending ? 'Creando...' : 'Crear malla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal Asignar Turno ──────────────────────────────────────────────────────

// Horas predeterminadas por tipo de turno
const DEFAULT_TIMES: Record<ShiftType, { start: string; end: string }> = {
  MORNING:   { start: '07:00', end: '13:00' },
  AFTERNOON: { start: '13:00', end: '19:00' },
  NIGHT_6H:  { start: '19:00', end: '01:00' },
  NIGHT_12H: { start: '19:00', end: '07:00' },
  DAY_OFF:   { start: '', end: '' },
  SPECIAL:   { start: '08:00', end: '16:00' },
};

function AssignShiftModal({
  scheduleId, userId, dateStr, current, workers, minDate, maxDate, onClose, onSaved,
}: {
  scheduleId: string;
  userId: string;
  dateStr: string;
  current?: ShiftAssignment;
  workers: Array<{ id: string; name: string }>;
  minDate?: string;
  maxDate?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [selectedUser, setSelectedUser] = useState(userId || workers[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState(dateStr);
  const [shiftType, setShiftType] = useState<ShiftType>(
    (current?.shiftType as ShiftType) ?? 'MORNING',
  );
  const [startTime, setStartTime] = useState(
    current?.startTime ?? DEFAULT_TIMES[(current?.shiftType as ShiftType) ?? 'MORNING'].start,
  );
  const [endTime, setEndTime] = useState(
    current?.endTime ?? DEFAULT_TIMES[(current?.shiftType as ShiftType) ?? 'MORNING'].end,
  );

  const handleShiftTypeChange = (s: ShiftType) => {
    setShiftType(s);
    setStartTime(DEFAULT_TIMES[s].start);
    setEndTime(DEFAULT_TIMES[s].end);
  };

  const shiftOptions: ShiftType[] = ['MORNING', 'AFTERNOON', 'NIGHT_6H', 'NIGHT_12H', 'DAY_OFF', 'SPECIAL'];

  const mutation = useMutation({
    mutationFn: () =>
      schedulesService.bulkAssign(scheduleId, {
        assignments: [{
          userId: selectedUser,
          assignmentDate: selectedDate,
          shiftType,
          startTime: startTime || undefined,
          endTime: endTime || undefined,
        }],
      }),
    onSuccess: () => { toast.success('Turno asignado'); onSaved(); onClose(); },
    onError: () => toast.error('Error al asignar turno'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => schedulesService.deleteAssignment(scheduleId, current!.id),
    onSuccess: () => { toast.success('Turno eliminado'); onSaved(); onClose(); },
    onError: () => toast.error('Error al eliminar turno'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-bold text-gray-900">Asignar turno</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input type="date" value={selectedDate} min={minDate} max={maxDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trabajador</label>
            <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
              {workers.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de turno</label>
            <div className="grid grid-cols-2 gap-2">
              {shiftOptions.map((s) => (
                <button key={s} type="button" onClick={() => handleShiftTypeChange(s)}
                  className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                    shiftType === s ? SHIFT_COLORS[s] + ' ring-2 ring-indigo-400' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}>
                  {SHIFT_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
          {shiftType !== 'DAY_OFF' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora inicio</label>
                <input type="time" value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora fin</label>
                <input type="time" value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-between gap-3 px-5 pb-4">
          {current && (
            <button onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}
              className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50">
              Quitar
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            <button onClick={onClose}
              className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancelar
            </button>
            <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
              className="px-3 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Rechazar ───────────────────────────────────────────────────────────

function RejectModal({
  scheduleId, onClose, onRejected,
}: {
  scheduleId: string;
  onClose: () => void;
  onRejected: () => void;
}) {
  const [reason, setReason] = useState('');
  const mutation = useMutation({
    mutationFn: () => schedulesService.reject(scheduleId, reason),
    onSuccess: () => { toast.success('Malla rechazada'); onRejected(); onClose(); },
    onError: () => toast.error('Error al rechazar'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-bold text-gray-900">Rechazar malla</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="px-5 py-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Motivo del rechazo *</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-400 focus:outline-none"
            placeholder="Describe el motivo..."
          />
        </div>
        <div className="flex justify-end gap-3 px-5 pb-4">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={() => mutation.mutate()} disabled={!reason.trim() || mutation.isPending}
            className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
            {mutation.isPending ? 'Rechazando...' : 'Rechazar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────

type Tab = 'mallas' | 'turnos';

function PlanificadorPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>('mallas');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [violations, setViolations] = useState<ScheduleViolation[]>([]);
  const [showViolations, setShowViolations] = useState(false);
  const [assignModal, setAssignModal] = useState<{
    userId: string;
    dateStr: string;
    current?: ShiftAssignment;
  } | null>(null);

  const canApprove =
    user?.role === UserRole.ADMIN ||
    user?.role === (('APROBADOR' as any) as UserRole) ||
    user?.role === UserRole.SUPER_ADMIN;

  const canEdit =
    user?.role === UserRole.ADMIN ||
    user?.role === (('PLANIFICADOR' as any) as UserRole) ||
    user?.role === UserRole.SUPER_ADMIN;

  // ─── Queries ──────────────────────────────────────────────────────────────

  const { data: schedules = [], isLoading: loadingList } = useQuery({
    queryKey: ['schedules'],
    queryFn: schedulesService.getAll,
    enabled: activeTab === 'mallas',
  });

  const { data: activeSchedule, isLoading: loadingSchedule } = useQuery({
    queryKey: ['schedule', selectedScheduleId],
    queryFn: () => schedulesService.getById(selectedScheduleId!),
    enabled: !!selectedScheduleId,
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.getAll(),
    enabled: !!selectedScheduleId,
  });

  const workers = (
    (usersData as any)?.users ??
    (usersData as any)?.data ??
    (Array.isArray(usersData) ? usersData : [])
  ).map((u: any) => ({ id: u.id, name: `${u.firstName} ${u.lastName}` }));

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['schedules'] });
    if (selectedScheduleId) {
      queryClient.invalidateQueries({ queryKey: ['schedule', selectedScheduleId] });
    }
  };

  // ─── Mutaciones ────────────────────────────────────────────────────────────

  const validateMutation = useMutation({
    mutationFn: () => schedulesService.validate(selectedScheduleId!),
    onSuccess: (result: ValidationResult) => {
      setViolations(result.violations as any);
      setShowViolations(true);
      if (result.isValid) {
        toast.success('Malla válida — sin violaciones');
      } else {
        toast.warning(`${result.summary.totalErrors} errores, ${result.summary.totalWarnings} advertencias`);
      }
      refetch();
    },
    onError: () => toast.error('Error al validar'),
  });

  const submitMutation = useMutation({
    mutationFn: () => schedulesService.submit(selectedScheduleId!),
    onSuccess: () => { toast.success('Malla enviada a aprobación'); refetch(); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Error al enviar la malla'),
  });

  const approveMutation = useMutation({
    mutationFn: () => schedulesService.approve(selectedScheduleId!),
    onSuccess: () => { toast.success('Malla aprobada'); refetch(); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Error al aprobar la malla'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => schedulesService.delete(selectedScheduleId!),
    onSuccess: () => {
      toast.success('Malla eliminada');
      setSelectedScheduleId(null);
      refetch();
    },
    onError: () => toast.error('Error al eliminar'),
  });

  const isActionLoading =
    validateMutation.isPending ||
    submitMutation.isPending ||
    approveMutation.isPending ||
    deleteMutation.isPending;

  const assignmentCount = activeSchedule?.assignments?.length ?? 0;
  const hasErrors = violations.some((v: any) => v.severity === 'ERROR');

  const handleCellClick = useCallback(
    (userId: string, dateStr: string, current?: ShiftAssignment) => {
      if (!activeSchedule || activeSchedule.status !== 'DRAFT' || !canEdit) return;
      setAssignModal({ userId, dateStr, current });
    },
    [activeSchedule, canEdit],
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">

        {/* ─── Tabs ──────────────────────────────────────────── */}
        <div className="border-b border-gray-200 bg-white shrink-0">
          <nav className="flex gap-0 px-4" aria-label="Pestañas">
            <button
              onClick={() => setActiveTab('mallas')}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'mallas'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CalendarDays size={16} />
              Mallas de turnos
            </button>
            <button
              onClick={() => setActiveTab('turnos')}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'turnos'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings2 size={16} />
              Tipos de turno
            </button>
          </nav>
        </div>

        {/* ─── Contenido de pestañas ─────────────────────────── */}
        {activeTab === 'turnos' ? (
          <div className="flex-1 overflow-auto">
            <ShiftsTab />
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* Panel lateral: lista de mallas */}
            <aside className="w-64 shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col">
              <div className="px-4 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-bold text-gray-900 text-sm">Planificador</h2>
                  {canEdit && (
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                      title="Nueva malla"
                    >
                      <Plus size={15} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto py-2">
                {loadingList ? (
                  <div className="px-4 text-sm text-gray-400">Cargando...</div>
                ) : schedules.length === 0 ? (
                  <div className="px-4 text-sm text-gray-400">Sin mallas creadas</div>
                ) : (
                  schedules.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedScheduleId(s.id)}
                      className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-white transition-colors ${
                        selectedScheduleId === s.id ? 'bg-white border-l-2 border-l-indigo-500' : ''
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-800 truncate">{s.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(s.startDate).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', timeZone: 'UTC' })}
                        {' — '}
                        {new Date(s.endDate).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', timeZone: 'UTC' })}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                          s.status === 'DRAFT' ? 'bg-gray-100 text-gray-600' :
                          s.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-700' :
                          s.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                          s.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {s.status === 'DRAFT' ? 'Borrador' :
                           s.status === 'PENDING_APPROVAL' ? 'Pendiente' :
                           s.status === 'APPROVED' ? 'Aprobada' :
                           s.status === 'REJECTED' ? 'Rechazada' : 'Archivada'}
                        </span>
                        {s._count && (
                          <span className="text-xs text-gray-400">{s._count.assignments} turnos</span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </aside>

            {/* Área principal */}
            <main className="flex-1 overflow-hidden flex flex-col">
              {!selectedScheduleId ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                  <CalendarDays size={48} className="mb-4 opacity-30" />
                  <p className="text-lg font-medium">Selecciona una malla</p>
                  <p className="text-sm">O crea una nueva con el botón +</p>
                </div>
              ) : loadingSchedule ? (
                <div className="flex-1 flex items-center justify-center text-gray-400">Cargando malla...</div>
              ) : !activeSchedule ? (
                <div className="flex-1 flex items-center justify-center text-gray-400">No se pudo cargar la malla</div>
              ) : (
                <div className="flex-1 overflow-auto flex flex-col gap-4 p-4">
                  <ScheduleHeader
                    schedule={activeSchedule}
                    assignmentCount={assignmentCount}
                    hasErrors={hasErrors}
                    canApprove={canApprove}
                    isLoading={isActionLoading}
                    onValidate={() => validateMutation.mutate()}
                    onSubmit={() => submitMutation.mutate()}
                    onApprove={() => approveMutation.mutate()}
                    onReject={() => setShowRejectModal(true)}
                    onDelete={() => deleteMutation.mutate()}
                  />

                  {showViolations && (
                    <ViolationsPanel violations={violations} onClose={() => setShowViolations(false)} />
                  )}

                  {/* Leyenda */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    {(['MORNING', 'AFTERNOON', 'NIGHT_6H', 'NIGHT_12H', 'DAY_OFF', 'SPECIAL'] as const).map((s) => (
                      <span key={s} className={`px-2 py-0.5 rounded border font-medium ${SHIFT_COLORS[s]}`}>
                        {SHIFT_LABELS[s]}
                      </span>
                    ))}
                    {canEdit && activeSchedule.status === 'DRAFT' && (
                      <button
                        onClick={() => setAssignModal({
                          userId: workers[0]?.id ?? '',
                          dateStr: activeSchedule.startDate.split('T')[0],
                        })}
                        disabled={workers.length === 0}
                        title={workers.length === 0 ? 'No hay trabajadores disponibles' : 'Agregar un turno manualmente'}
                        className="ml-2 flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <UserPlus size={13} />
                        Agregar turno
                      </button>
                    )}
                  </div>

                  <ScheduleGrid
                    schedule={activeSchedule}
                    onCellClick={handleCellClick}
                    readOnly={activeSchedule.status !== 'DRAFT' || !canEdit}
                  />

                  {(activeSchedule.assignments?.length ?? 0) === 0 && workers.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                      <AlertCircle size={16} />
                      Esta malla aún no tiene asignaciones. Haz clic en el grid o usa "Agregar turno".
                    </div>
                  )}
                </div>
              )}
            </main>
          </div>
        )}
      </div>

      {/* ─── Modales ──────────────────────────────────────────── */}
      {showCreateModal && (
        <CreateScheduleModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(s) => { setShowCreateModal(false); setSelectedScheduleId(s.id); refetch(); }}
        />
      )}

      {assignModal && activeSchedule && (
        <AssignShiftModal
          scheduleId={activeSchedule.id}
          userId={assignModal.userId}
          dateStr={assignModal.dateStr}
          current={assignModal.current}
          workers={workers}
          minDate={activeSchedule.startDate.split('T')[0]}
          maxDate={activeSchedule.endDate.split('T')[0]}
          onClose={() => setAssignModal(null)}
          onSaved={refetch}
        />
      )}

      {showRejectModal && selectedScheduleId && (
        <RejectModal
          scheduleId={selectedScheduleId}
          onClose={() => setShowRejectModal(false)}
          onRejected={refetch}
        />
      )}
    </DashboardLayout>
  );
}

export default withAuth(PlanificadorPage, [
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
  ('PLANIFICADOR' as any) as UserRole,
  ('APROBADOR' as any) as UserRole,
]);
