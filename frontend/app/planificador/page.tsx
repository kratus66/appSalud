'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronDown, Plus, RefreshCw, Send, CheckCircle, XCircle,
  Trash2, Search, AlertTriangle, Calendar, Users, Bell, X,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { withAuth } from '@/components/auth/withAuth';
import { useAuthStore } from '@/store/auth';
import { schedulesService } from '@/services/schedules.service';
import { usersService } from '@/services/users.service';
import { UserRole } from '@/types';

import type { WorkSchedule, ShiftType, ShiftAssignment } from '@/types/schedule.types';
import {
  SHIFT_LABELS, SHIFT_COLORS, SHIFT_SHORT_LABELS,
  STATUS_LABELS, STATUS_COLORS,
} from '@/types/schedule.types';

import { GenerateModal } from './components/GenerateModal';
import { AbsenceModal } from './components/AbsenceModal';

// ─── Utilidades ────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin', DOCTOR: 'Médico', PLANIFICADOR: 'Planificador',
  APROBADOR: 'Aprobador', CONSULTA: 'Consulta',
  RECEPCIONISTA: 'Recepción', ENFERMERO: 'Enfermería',
  AUXILIAR: 'Auxiliar', CONDUCTOR: 'Conductor',
};

const ABSENCE_COLORS: Record<string, string> = {
  VACATION: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  SICK_LEAVE: 'bg-orange-100 text-orange-800 border-orange-300',
  PERSONAL: 'bg-purple-100 text-purple-800 border-purple-300',
  UNPREDICTED: 'bg-red-100 text-red-800 border-red-300',
};

const ABSENCE_SHORT: Record<string, string> = {
  VACATION: 'V', SICK_LEAVE: 'I', PERSONAL: 'P', UNPREDICTED: '!',
};

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function dateKey(d: Date) {
  return d.toISOString().split('T')[0];
}

function toDateKey(raw: string | Date | undefined): string {
  if (!raw) return '';
  if (raw instanceof Date) return dateKey(raw);
  const s = String(raw);
  return s.length >= 10 ? s.slice(0, 10) : dateKey(new Date(s));
}

// ─── ShiftBadge ────────────────────────────────────────────────────────────────

function ShiftBadge({
  shiftType, absenceType, compact = false,
}: {
  shiftType: ShiftType;
  absenceType?: string | null;
  compact?: boolean;
}) {
  const size = compact ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  if (absenceType) {
    const short = ABSENCE_SHORT[absenceType] ?? '?';
    const color = ABSENCE_COLORS[absenceType] ?? 'bg-gray-100 text-gray-500';
    return (
      <span className={`inline-flex items-center justify-center font-bold border rounded ${color} ${size}`}>
        {short}
      </span>
    );
  }
  const short = SHIFT_SHORT_LABELS[shiftType] ?? '?';
  const color = SHIFT_COLORS[shiftType] ?? 'bg-gray-100 text-gray-500 border-gray-200';
  const isOff = shiftType === 'DAY_OFF';
  return (
    <span className={`inline-flex items-center justify-center font-bold border rounded ${color} ${size} ${isOff ? 'opacity-35' : ''}`}>
      {short}
    </span>
  );
}

// ─── CreateScheduleModal ───────────────────────────────────────────────────────

function CreateScheduleModal({
  onClose, onCreated,
}: {
  onClose: () => void;
  onCreated: (s: WorkSchedule) => void;
}) {
  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const [form, setForm] = useState({
    name: `Malla ${first.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}`,
    periodType: 'MONTHLY' as const,
    startDate: first.toISOString().split('T')[0],
    endDate: last.toISOString().split('T')[0],
    notes: '',
  });
  const mutation = useMutation({
    mutationFn: () => schedulesService.create(form),
    onSuccess: (s) => { toast.success('Malla creada'); onCreated(s); },
    onError: () => toast.error('Error al crear la malla'),
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-bold text-gray-900">Nueva malla de turnos</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input type="text" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
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
          <div className="flex justify-end gap-3 pt-1">
            <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancelar
            </button>
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !form.name || !form.startDate || !form.endDate}
              className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Creando...' : 'Crear malla'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ShiftPickerPopover ────────────────────────────────────────────────────────

const SHIFT_OPTIONS: ShiftType[] = ['MORNING', 'AFTERNOON', 'NIGHT_12H', 'SPECIAL', 'DAY_OFF', 'NIGHT_6H'];
const SHIFT_TIME_HINT: Record<string, string> = {
  MORNING: '07–13h', AFTERNOON: '13–19h', NIGHT_12H: '19–07h',
  SPECIAL: '07–19h', DAY_OFF: 'Libre', NIGHT_6H: '19–01h',
};

function ShiftPickerPopover({
  scheduleId, userId, dateStr, current, onClose, onSaved,
}: {
  scheduleId: string; userId: string; dateStr: string;
  current?: ShiftAssignment; onClose: () => void; onSaved: () => void;
}) {
  const assignMutation = useMutation({
    mutationFn: (shiftType: ShiftType) =>
      schedulesService.bulkAssign(scheduleId, { assignments: [{ userId, assignmentDate: dateStr, shiftType }] }),
    onSuccess: () => { toast.success('Turno actualizado'); onSaved(); onClose(); },
    onError: () => toast.error('Error al actualizar turno'),
  });
  const deleteMutation = useMutation({
    mutationFn: () => schedulesService.deleteAssignment(scheduleId, current!.id),
    onSuccess: () => { toast.success('Turno eliminado'); onSaved(); onClose(); },
    onError: () => toast.error('Error al eliminar turno'),
  });
  const isBusy = assignMutation.isPending || deleteMutation.isPending;
  const dStr = new Date(dateStr + 'T12:00').toLocaleDateString('es-CO', {
    weekday: 'short', day: 'numeric', month: 'short',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl p-4 w-72" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700 capitalize">{dStr}</span>
          <button onClick={onClose}><X size={16} className="text-gray-400" /></button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {SHIFT_OPTIONS.map((s) => (
            <button
              key={s} disabled={isBusy} onClick={() => assignMutation.mutate(s)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 text-xs font-medium transition-all hover:scale-105 active:scale-95 ${
                current?.shiftType === s
                  ? SHIFT_COLORS[s] + ' border-current shadow-sm'
                  : SHIFT_COLORS[s] + ' opacity-75 hover:opacity-100 border-transparent'
              }`}
            >
              <span className="text-base font-bold">{SHIFT_SHORT_LABELS[s]}</span>
              <span className="font-normal leading-tight text-center" style={{ fontSize: 9 }}>{SHIFT_TIME_HINT[s]}</span>
            </button>
          ))}
        </div>
        {current && (
          <button onClick={() => deleteMutation.mutate()} disabled={isBusy}
            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50">
            <Trash2 size={12} /> Quitar asignación
          </button>
        )}
      </div>
    </div>
  );
}

// ─── RejectModal ───────────────────────────────────────────────────────────────

function RejectModal({ scheduleId, onClose, onRejected }: {
  scheduleId: string; onClose: () => void; onRejected: () => void;
}) {
  const [reason, setReason] = useState('');
  const mutation = useMutation({
    mutationFn: () => schedulesService.reject(scheduleId, reason),
    onSuccess: () => { toast.success('Malla rechazada'); onRejected(); onClose(); },
    onError: () => toast.error('Error al rechazar'),
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-bold text-gray-900">Rechazar malla</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <div className="px-5 py-4">
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-400 focus:outline-none"
            placeholder="Motivo del rechazo..." />
        </div>
        <div className="flex justify-end gap-3 px-5 pb-4">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancelar</button>
          <button onClick={() => mutation.mutate()} disabled={!reason.trim() || mutation.isPending}
            className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
            {mutation.isPending ? 'Rechazando...' : 'Rechazar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PlanificadorPage ──────────────────────────────────────────────────────────

function PlanificadorPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Estado principal
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [workerSearch, setWorkerSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [shiftPicker, setShiftPicker] = useState<{
    userId: string; dateStr: string; current?: ShiftAssignment;
  } | null>(null);
  const [absenceModal, setAbsenceModal] = useState<{
    userId: string; dateStr: string; assignment: ShiftAssignment;
  } | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showScheduleDropdown, setShowScheduleDropdown] = useState(false);

  const canEdit = user?.role === UserRole.ADMIN
    || (user?.role as string) === 'PLANIFICADOR'
    || user?.role === UserRole.SUPER_ADMIN;

  const canApprove = user?.role === UserRole.ADMIN
    || (user?.role as string) === 'APROBADOR'
    || user?.role === UserRole.SUPER_ADMIN;

  // ─── Queries ──────────────────────────────────────────────────────────────

  const { data: schedules = [], isLoading: loadingList } = useQuery({
    queryKey: ['schedules'],
    queryFn: schedulesService.getAll,
  });

  const { data: activeSchedule, isLoading: loadingSchedule } = useQuery({
    queryKey: ['schedule', selectedScheduleId],
    queryFn: () => schedulesService.getById(selectedScheduleId!),
    enabled: !!selectedScheduleId,
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.getAll(),
  });

  // ─── Datos computados ─────────────────────────────────────────────────────

  const allWorkers = useMemo(() => {
    const raw = (usersData as any)?.users
      ?? (usersData as any)?.data
      ?? (Array.isArray(usersData) ? usersData : []);
    return (raw as Array<{ id: string; firstName: string; lastName: string; role: string; isActive?: boolean; deletedAt?: string | null }>)
      .filter((u) => !u.deletedAt && u.isActive !== false);
  }, [usersData]);

  const roles = useMemo(() => {
    const set = new Set<string>(allWorkers.map((w) => w.role));
    return ['ALL', ...Array.from(set).sort()];
  }, [allWorkers]);

  const filteredWorkers = useMemo(() => {
    return allWorkers.filter((w) => {
      const matchSearch = !workerSearch
        || `${w.firstName} ${w.lastName}`.toLowerCase().includes(workerSearch.toLowerCase());
      const matchRole = roleFilter === 'ALL' || w.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [allWorkers, workerSearch, roleFilter]);

  // Mapa rápido: userId → dateStr → ShiftAssignment
  const assignmentMap = useMemo(() => {
    const map: Record<string, Record<string, ShiftAssignment>> = {};
    if (!activeSchedule?.assignments) return map;
    for (const a of activeSchedule.assignments) {
      if (!map[a.userId]) map[a.userId] = {};
      map[a.userId][toDateKey(a.assignmentDate)] = a;
    }
    return map;
  }, [activeSchedule]);

  // Todas las fechas del período activo
  const scheduleDates = useMemo(() => {
    if (!activeSchedule) return [];
    const dates: Date[] = [];
    const start = new Date(activeSchedule.startDate);
    const end = new Date(activeSchedule.endDate);
    start.setUTCHours(12, 0, 0, 0);
    end.setUTCHours(12, 0, 0, 0);
    const cur = new Date(start);
    while (cur <= end) {
      dates.push(new Date(cur));
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    return dates;
  }, [activeSchedule]);

  const selectedWorker = useMemo(
    () => allWorkers.find((w) => w.id === selectedWorkerId) ?? null,
    [allWorkers, selectedWorkerId],
  );

  const stats = useMemo(() => {
    const absences = activeSchedule?.assignments?.filter((a: any) => a.absenceType).length ?? 0;
    const alerts = activeSchedule?.violations?.filter((v: any) => v.severity === 'ERROR').length ?? 0;
    return { total: allWorkers.length, absences, alerts };
  }, [activeSchedule, allWorkers]);

  const todayKey = dateKey(new Date());
  const isDraft = activeSchedule?.status === 'DRAFT';
  const isPending = activeSchedule?.status === 'PENDING_APPROVAL';

  // ─── Mutaciones ───────────────────────────────────────────────────────────

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['schedules'] });
    if (selectedScheduleId) {
      queryClient.invalidateQueries({ queryKey: ['schedule', selectedScheduleId] });
    }
  }, [queryClient, selectedScheduleId]);

  const validateMutation = useMutation({
    mutationFn: () => schedulesService.validate(selectedScheduleId!),
    onSuccess: (r: any) => {
      toast[r.isValid ? 'success' : 'warning'](
        r.isValid ? 'Malla válida' : `${r.summary.totalErrors} errores · ${r.summary.totalWarnings} advertencias`,
      );
      refetch();
    },
    onError: () => toast.error('Error al validar'),
  });

  const submitMutation = useMutation({
    mutationFn: () => schedulesService.submit(selectedScheduleId!),
    onSuccess: () => { toast.success('Enviada a aprobación'); refetch(); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Error al enviar'),
  });

  const approveMutation = useMutation({
    mutationFn: () => schedulesService.approve(selectedScheduleId!),
    onSuccess: () => { toast.success('Malla aprobada ✓'); refetch(); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Error al aprobar'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => schedulesService.delete(selectedScheduleId!),
    onSuccess: () => { toast.success('Malla eliminada'); setSelectedScheduleId(null); refetch(); },
    onError: () => toast.error('Error al eliminar'),
  });

  const handleCellClick = useCallback((userId: string, dateStr: string, current?: ShiftAssignment) => {
    if (!activeSchedule || !isDraft || !canEdit) return;
    setShiftPicker({ userId, dateStr, current });
  }, [activeSchedule, isDraft, canEdit]);

  const handleAbsenceClick = useCallback((userId: string, dateStr: string, assignment: ShiftAssignment) => {
    if (!activeSchedule || !isDraft || !canEdit) return;
    setAbsenceModal({ userId, dateStr, assignment });
  }, [activeSchedule, isDraft, canEdit]);

  // ─── Render ───────────────────────────────────────────────────────────────

  const selectedSchedule = schedules.find((s) => s.id === selectedScheduleId) ?? null;

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-gray-50">

        {/* ══ TOP BAR ════════════════════════════════════════════════════════ */}
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 shrink-0 flex-wrap">

          {/* Selector de malla */}
          <div className="relative">
            <button
              onClick={() => setShowScheduleDropdown(!showScheduleDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Calendar size={14} className="text-indigo-500" />
              <span className="max-w-44 truncate">
                {selectedSchedule?.name ?? 'Seleccionar malla'}
              </span>
              <ChevronDown size={13} />
            </button>

            {showScheduleDropdown && (
              <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-30 max-h-72 overflow-y-auto">
                {loadingList ? (
                  <div className="px-4 py-3 text-sm text-gray-400">Cargando...</div>
                ) : schedules.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-400">Sin mallas</div>
                ) : (
                  schedules.map((s) => (
                    <button key={s.id}
                      onClick={() => { setSelectedScheduleId(s.id); setShowScheduleDropdown(false); }}
                      className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-0 ${s.id === selectedScheduleId ? 'bg-indigo-50' : ''}`}
                    >
                      <div className="text-sm font-medium text-gray-800 truncate">{s.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${STATUS_COLORS[s.status]}`}>
                          {STATUS_LABELS[s.status]}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(s.startDate).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', timeZone: 'UTC' })}
                          {' – '}
                          {new Date(s.endDate).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', timeZone: 'UTC' })}
                        </span>
                      </div>
                    </button>
                  ))
                )}
                <div className="border-t border-gray-100 p-2">
                  <button onClick={() => { setShowCreate(true); setShowScheduleDropdown(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg">
                    <Plus size={14} /> Nueva malla
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Estado de la malla */}
          {activeSchedule && (
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[activeSchedule.status]}`}>
              {STATUS_LABELS[activeSchedule.status]}
            </span>
          )}

          {/* Stats */}
          <div className="flex items-center gap-1.5 ml-1">
            <span className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
              <Users size={11} /> {stats.total} personas
            </span>
            {stats.absences > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                <Bell size={11} /> {stats.absences} novedades
              </span>
            )}
            {stats.alerts > 0 && (
              <span className="flex items-center gap-1 text-xs text-red-700 bg-red-100 px-2 py-1 rounded-full">
                <AlertTriangle size={11} /> {stats.alerts} alertas
              </span>
            )}
          </div>

          <div className="flex-1" />

          {/* Acciones */}
          <div className="flex items-center gap-1.5">
            {canEdit && isDraft && (
              <>
                <button onClick={() => setShowGenerate(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
                  <Zap size={13} /> Generar
                </button>
                <button onClick={() => validateMutation.mutate()} disabled={validateMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 disabled:opacity-50">
                  <RefreshCw size={13} className={validateMutation.isPending ? 'animate-spin' : ''} /> Validar
                </button>
                <button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  <Send size={13} /> Enviar
                </button>
              </>
            )}
            {canApprove && isPending && (
              <>
                <button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50">
                  <CheckCircle size={13} /> Aprobar
                </button>
                <button onClick={() => setShowRejectModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100">
                  <XCircle size={13} /> Rechazar
                </button>
              </>
            )}
            {canEdit && isDraft && (
              <button
                onClick={() => { if (confirm('¿Eliminar esta malla? Esta acción no se puede deshacer.')) deleteMutation.mutate(); }}
                disabled={deleteMutation.isPending}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>

        {/* ══ LEYENDA DE TURNOS ══════════════════════════════════════════════ */}
        <div className="bg-white border-b border-gray-100 px-4 py-1.5 flex items-center gap-3 flex-wrap shrink-0 text-xs">
          {(['MORNING', 'AFTERNOON', 'NIGHT_12H', 'SPECIAL', 'DAY_OFF'] as ShiftType[]).map((s) => (
            <span key={s} className={`flex items-center gap-1 font-medium px-2 py-0.5 rounded border ${SHIFT_COLORS[s]}`}>
              <span className="font-bold">{SHIFT_SHORT_LABELS[s]}</span>
              <span className="hidden sm:inline">= {SHIFT_LABELS[s]}</span>
            </span>
          ))}
          <span className="text-gray-400 ml-1">
            V=Vacaciones · I=Incapacidad · P=Personal · !=Imprevisto
          </span>
          <span className="text-gray-300 text-xs ml-auto hidden md:block">
            Clic = cambiar turno · Clic derecho = novedad
          </span>
        </div>

        {/* ══ CONTENIDO PRINCIPAL ════════════════════════════════════════════ */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── LEFT: Lista de personal ──────────────────────────────────── */}
          <aside className="w-52 shrink-0 border-r border-gray-200 bg-white flex flex-col">
            <div className="p-3 border-b border-gray-100">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Personal ({filteredWorkers.length})
              </div>
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text" value={workerSearch}
                  onChange={(e) => setWorkerSearch(e.target.value)}
                  placeholder="Buscar persona..."
                  className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Filtro por rol */}
            <div className="px-2 py-1.5 border-b border-gray-100 flex flex-wrap gap-1">
              {roles.slice(0, 7).map((r) => (
                <button key={r} onClick={() => setRoleFilter(r)}
                  className={`px-2 py-0.5 text-xs rounded-full transition-colors ${roleFilter === r ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {r === 'ALL' ? 'Todos' : (ROLE_LABELS[r] ?? r)}
                </button>
              ))}
            </div>

            {/* Lista de trabajadores */}
            <div className="flex-1 overflow-y-auto">
              {filteredWorkers.map((worker) => {
                const workerAssigns = assignmentMap[worker.id] ?? {};
                const upcoming = Object.entries(workerAssigns)
                  .filter(([d]) => d >= todayKey)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .slice(0, 4)
                  .map(([, a]) => a);
                const isSelected = selectedWorkerId === worker.id;
                return (
                  <button key={worker.id}
                    onClick={() => setSelectedWorkerId(isSelected ? null : worker.id)}
                    className={`w-full text-left px-3 py-2 border-b border-gray-50 transition-colors hover:bg-gray-50 ${isSelected ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold shrink-0" style={{ fontSize: 11 }}>
                        {worker.firstName[0]}{worker.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-gray-800 truncate leading-tight">
                          {worker.firstName} {worker.lastName}
                        </div>
                        <div className="text-gray-400 leading-tight" style={{ fontSize: 10 }}>
                          {ROLE_LABELS[worker.role] ?? worker.role}
                        </div>
                      </div>
                    </div>
                    {upcoming.length > 0 && (
                      <div className="flex gap-0.5 mt-1.5 ml-9">
                        {upcoming.map((a, i) => (
                          <ShiftBadge key={i} shiftType={a.shiftType as ShiftType} absenceType={a.absenceType} compact />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
              {filteredWorkers.length === 0 && (
                <div className="px-4 py-6 text-center text-xs text-gray-400">
                  {workerSearch ? 'Sin resultados' : 'Sin trabajadores activos'}
                </div>
              )}
            </div>
          </aside>

          {/* ── CENTER: Grid de turnos ───────────────────────────────────── */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {!selectedScheduleId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <Calendar size={52} className="mb-4 opacity-20" />
                <p className="text-lg font-medium">Selecciona una malla de turnos</p>
                <p className="text-sm mt-1">O crea una nueva desde el selector superior</p>
                {canEdit && (
                  <button onClick={() => setShowCreate(true)}
                    className="mt-5 flex items-center gap-2 px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
                    <Plus size={16} /> Nueva malla
                  </button>
                )}
              </div>
            ) : loadingSchedule ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <RefreshCw size={20} className="animate-spin mr-2" /> Cargando malla...
              </div>
            ) : !activeSchedule ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">No se pudo cargar la malla</div>
            ) : (
              <div className="flex-1 overflow-auto">
                <table className="border-collapse min-w-max w-full" style={{ fontSize: 11 }}>
                  <thead className="sticky top-0 z-10 bg-white">
                    <tr>
                      {/* Columna fija: nombre trabajador */}
                      <th className="sticky left-0 z-20 bg-white border-b-2 border-r border-gray-200 px-3 py-2 text-left font-semibold text-gray-500 w-44 min-w-44">
                        Personal
                      </th>
                      {/* Columnas de días */}
                      {scheduleDates.map((d) => {
                        const dow = d.getUTCDay();
                        const isWeekend = dow === 0 || dow === 6;
                        const dk = dateKey(d);
                        const isToday = dk === todayKey;
                        return (
                          <th key={dk}
                            className={`border-b-2 border-gray-200 border-r border-gray-100 px-0.5 py-1 text-center w-10 min-w-10 font-medium
                              ${isWeekend ? 'bg-slate-50 text-slate-400' : 'text-gray-600'}
                              ${isToday ? '!bg-indigo-50 !text-indigo-700' : ''}`}
                          >
                            <div className="text-gray-400 font-normal leading-none mb-0.5" style={{ fontSize: 9 }}>
                              {DAYS_ES[dow]}
                            </div>
                            <div className="font-bold">{d.getUTCDate()}</div>
                          </th>
                        );
                      })}
                      <th className="border-b-2 border-gray-200 px-2 py-2 text-center text-gray-500 font-medium w-14 min-w-14">
                        Horas
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWorkers.map((worker, rowIdx) => {
                      const workerAssigns = assignmentMap[worker.id] ?? {};
                      let totalHours = 0;
                      const cells = scheduleDates.map((d) => {
                        const dk = dateKey(d);
                        const assignment = workerAssigns[dk];
                        if (assignment) totalHours += assignment.hoursWorked ?? 0;
                        return { dk, assignment };
                      });
                      const isSelected = selectedWorkerId === worker.id;
                      const isEven = rowIdx % 2 === 0;
                      return (
                        <tr key={worker.id}
                          className={`transition-colors ${isSelected ? 'bg-indigo-50/60' : isEven ? 'bg-white' : 'bg-slate-50/40'} hover:bg-blue-50/30`}
                        >
                          {/* Nombre (sticky) */}
                          <td className={`sticky left-0 z-10 border-r border-gray-200 px-3 py-1 ${isSelected ? 'bg-indigo-50' : isEven ? 'bg-white' : 'bg-slate-50'}`}>
                            <button
                              onClick={() => setSelectedWorkerId(isSelected ? null : worker.id)}
                              className="flex items-center gap-2 w-full text-left group"
                            >
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 shrink-0 flex items-center justify-center text-white font-bold" style={{ fontSize: 9 }}>
                                {worker.firstName[0]}{worker.lastName[0]}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-gray-800 truncate leading-tight">{worker.firstName} {worker.lastName}</div>
                                <div className="text-gray-400 leading-none" style={{ fontSize: 9 }}>{ROLE_LABELS[worker.role] ?? worker.role}</div>
                              </div>
                            </button>
                          </td>

                          {/* Celdas de turno */}
                          {cells.map(({ dk, assignment }) => {
                            const dow = new Date(dk + 'T12:00').getUTCDay();
                            const isWeekend = dow === 0 || dow === 6;
                            const isToday = dk === todayKey;
                            const hasAbsence = !!assignment?.absenceType;
                            return (
                              <td key={dk}
                                className={`border-b border-gray-100 border-r border-gray-50 p-0.5 text-center select-none transition-colors
                                  ${isWeekend ? 'bg-slate-50/60' : ''}
                                  ${isToday ? 'bg-indigo-50/60' : ''}
                                  ${(isDraft && canEdit) ? 'cursor-pointer hover:bg-blue-100/60' : 'cursor-default'}`}
                                onClick={() => {
                                  if (!isDraft || !canEdit) return;
                                  if (hasAbsence) handleAbsenceClick(worker.id, dk, assignment!);
                                  else handleCellClick(worker.id, dk, assignment);
                                }}
                                onContextMenu={(e) => {
                                  if (assignment && isDraft && canEdit) {
                                    e.preventDefault();
                                    handleAbsenceClick(worker.id, dk, assignment);
                                  }
                                }}
                                title={assignment
                                  ? `${SHIFT_LABELS[assignment.shiftType as ShiftType] ?? assignment.shiftType}${assignment.absenceType ? ` · ${assignment.absenceType}` : ''}`
                                  : 'Sin turno — clic para asignar'}
                              >
                                {assignment ? (
                                  <ShiftBadge
                                    shiftType={assignment.shiftType as ShiftType}
                                    absenceType={assignment.absenceType}
                                    compact
                                  />
                                ) : (
                                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded text-gray-200 ${isDraft && canEdit ? 'hover:text-gray-400 hover:bg-gray-100' : ''}`}>
                                    ·
                                  </span>
                                )}
                              </td>
                            );
                          })}

                          {/* Total de horas */}
                          <td className="border-b border-gray-100 px-2 py-1 text-center">
                            <span className={`font-bold ${totalHours >= 36 ? 'text-green-600' : totalHours > 0 ? 'text-amber-600' : 'text-gray-300'}`}>
                              {totalHours > 0 ? `${totalHours}h` : '—'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredWorkers.length === 0 && (
                      <tr>
                        <td colSpan={scheduleDates.length + 2} className="py-16 text-center text-gray-400 text-sm">
                          Sin trabajadores que coincidan con el filtro
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── RIGHT: Panel detalle trabajador ─────────────────────────── */}
          {selectedWorker && activeSchedule && (
            <aside className="w-60 shrink-0 border-l border-gray-200 bg-white flex flex-col overflow-y-auto">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">Detalle</h3>
                <button onClick={() => setSelectedWorkerId(null)}>
                  <X size={15} className="text-gray-400 hover:text-gray-600" />
                </button>
              </div>

              {/* Info del trabajador */}
              <div className="px-4 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-base">
                    {selectedWorker.firstName[0]}{selectedWorker.lastName[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm leading-tight">
                      {selectedWorker.firstName} {selectedWorker.lastName}
                    </div>
                    <div className="text-xs text-gray-500">{ROLE_LABELS[selectedWorker.role] ?? selectedWorker.role}</div>
                  </div>
                </div>

                {/* Resumen de horas */}
                {(() => {
                  const assigns = Object.values(assignmentMap[selectedWorker.id] ?? {});
                  const totalH = assigns.reduce((s, a) => s + (a.hoursWorked ?? 0), 0);
                  const absenceCnt = assigns.filter((a: any) => a.absenceType).length;
                  const weeks = scheduleDates.length > 0 ? Math.ceil(scheduleDates.length / 7) : 1;
                  const targetH = weeks * 36;
                  return (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className={`rounded-lg p-2 text-center ${totalH >= targetH - 6 ? 'bg-green-50' : totalH > 0 ? 'bg-amber-50' : 'bg-gray-50'}`}>
                        <div className={`font-bold text-base ${totalH >= targetH - 6 ? 'text-green-700' : totalH > 0 ? 'text-amber-700' : 'text-gray-500'}`}>{totalH}h</div>
                        <div className="text-gray-500">/{targetH}h</div>
                      </div>
                      <div className={`rounded-lg p-2 text-center ${absenceCnt ? 'bg-amber-50' : 'bg-gray-50'}`}>
                        <div className={`font-bold text-base ${absenceCnt ? 'text-amber-700' : 'text-gray-400'}`}>{absenceCnt}</div>
                        <div className={absenceCnt ? 'text-amber-600' : 'text-gray-500'}>Novedades</div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Distribución de turnos */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Turnos</div>
                {(['MORNING', 'AFTERNOON', 'NIGHT_12H', 'SPECIAL', 'DAY_OFF'] as ShiftType[]).map((s) => {
                  const count = Object.values(assignmentMap[selectedWorker.id] ?? {})
                    .filter((a) => a.shiftType === s && !a.absenceType).length;
                  if (!count) return null;
                  return (
                    <div key={s} className="flex items-center gap-2 mb-1.5">
                      <span className={`w-5 h-5 rounded border text-xs flex items-center justify-center font-bold ${SHIFT_COLORS[s]}`}>
                        {SHIFT_SHORT_LABELS[s]}
                      </span>
                      <span className="flex-1 text-xs text-gray-600">{SHIFT_LABELS[s]}</span>
                      <span className="text-xs font-medium text-gray-700">{count}d</span>
                    </div>
                  );
                })}
              </div>

              {/* Novedades (ausencias) */}
              <div className="px-4 py-3">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Novedades</div>
                {Object.entries(assignmentMap[selectedWorker.id] ?? {})
                  .filter(([, a]) => a.absenceType)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([dk, a]) => (
                    <div key={dk} className="flex items-start gap-2 mb-2">
                      <span className={`w-5 h-5 rounded border text-xs flex items-center justify-center font-bold shrink-0 mt-0.5 ${ABSENCE_COLORS[a.absenceType!] ?? 'bg-gray-100'}`}>
                        {ABSENCE_SHORT[a.absenceType!] ?? '?'}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-gray-700">
                          {new Date(dk + 'T12:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                        </div>
                        {a.absenceNotes && (
                          <div className="text-gray-400 truncate" style={{ fontSize: 10 }}>{a.absenceNotes}</div>
                        )}
                      </div>
                    </div>
                  ))}
                {!Object.values(assignmentMap[selectedWorker.id] ?? {}).some((a: any) => a.absenceType) && (
                  <div className="text-xs text-gray-400 italic">Sin novedades registradas</div>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* ══ MODALES ════════════════════════════════════════════════════════ */}

      {showCreate && (
        <CreateScheduleModal
          onClose={() => setShowCreate(false)}
          onCreated={(s) => { setShowCreate(false); setSelectedScheduleId(s.id); refetch(); }}
        />
      )}

      {shiftPicker && activeSchedule && (
        <ShiftPickerPopover
          scheduleId={activeSchedule.id}
          userId={shiftPicker.userId}
          dateStr={shiftPicker.dateStr}
          current={shiftPicker.current}
          onClose={() => setShiftPicker(null)}
          onSaved={refetch}
        />
      )}

      {absenceModal && activeSchedule && (
        <AbsenceModal
          scheduleId={activeSchedule.id}
          assignment={absenceModal.assignment}
          dateStr={absenceModal.dateStr}
          workerName={
            `${allWorkers.find((w) => w.id === absenceModal.userId)?.firstName ?? ''} `
            + `${allWorkers.find((w) => w.id === absenceModal.userId)?.lastName ?? ''}`
          }
          onClose={() => setAbsenceModal(null)}
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

      {showGenerate && selectedScheduleId && (
        <GenerateModal
          scheduleId={selectedScheduleId}
          onClose={() => setShowGenerate(false)}
          onGenerated={() => { setShowGenerate(false); refetch(); }}
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
