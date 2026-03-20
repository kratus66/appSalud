'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { schedulesService } from '@/services/schedules.service';
import type { ShiftAssignment } from '@/types/schedule.types';

const ABSENCE_OPTIONS = [
  { value: 'VACATION',    label: 'Vacaciones',  color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { value: 'SICK_LEAVE',  label: 'Incapacidad', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  { value: 'PERSONAL',    label: 'Personal',    color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { value: 'UNPREDICTED', label: 'Imprevisto',  color: 'bg-red-100 text-red-800 border-red-300' },
] as const;

export function AbsenceModal({
  scheduleId, assignment, dateStr, workerName, onClose, onSaved,
}: {
  scheduleId: string;
  assignment: ShiftAssignment;
  dateStr: string;
  workerName: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [absenceType, setAbsenceType] = useState<string>(assignment.absenceType ?? 'SICK_LEAVE');
  const [notes, setNotes] = useState(assignment.absenceNotes ?? '');

  const markMutation = useMutation({
    mutationFn: () =>
      schedulesService.markAbsence(scheduleId, assignment.id, {
        absenceType: absenceType as any,
        absenceNotes: notes || undefined,
      }),
    onSuccess: () => { toast.success('Novedad registrada'); onSaved(); onClose(); },
    onError: () => toast.error('Error al registrar novedad'),
  });

  const removeMutation = useMutation({
    mutationFn: () => schedulesService.removeAbsence(scheduleId, assignment.id),
    onSuccess: () => { toast.success('Novedad eliminada'); onSaved(); onClose(); },
    onError: () => toast.error('Error al eliminar novedad'),
  });

  const isBusy = markMutation.isPending || removeMutation.isPending;
  const formattedDate = new Date(dateStr + 'T12:00').toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h3 className="font-bold text-gray-900">Registrar novedad</h3>
            <p className="text-xs text-gray-500 mt-0.5 capitalize">
              {workerName.trim()} — {formattedDate}
            </p>
          </div>
          <button onClick={onClose}>
            <X size={20} className="text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Tipo de novedad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de novedad
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ABSENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAbsenceType(opt.value)}
                  className={`px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                    absenceType === opt.value
                      ? opt.color + ' border-current shadow-sm'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Ej. Certificado médico entregado, Nro. 12345..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
            />
          </div>

          {/* Norma */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex items-start gap-2 text-xs text-gray-600">
            <AlertTriangle size={12} className="text-amber-500 shrink-0 mt-0.5" />
            La normativa permite asignar hasta <strong className="mx-0.5">2 horas adicionales</strong> a
            compañeros para cubrir esta ausencia.
          </div>
        </div>

        <div className="flex justify-between px-5 pb-5">
          {assignment.absenceType ? (
            <button
              onClick={() => removeMutation.mutate()}
              disabled={isBusy}
              className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
            >
              Quitar novedad
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <button onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancelar
            </button>
            <button
              onClick={() => markMutation.mutate()}
              disabled={isBusy}
              className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {markMutation.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
