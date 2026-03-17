'use client';

import { CheckCircle, Clock, Send, XCircle, Trash2, AlertTriangle } from 'lucide-react';
import type { WorkSchedule, ScheduleStatus } from '../../../types/schedule.types';
import { STATUS_LABELS, STATUS_COLORS } from '../../../types/schedule.types';

interface Props {
  schedule: WorkSchedule;
  assignmentCount: number;
  hasErrors: boolean;
  onValidate: () => void;
  onSubmit: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
  canApprove: boolean;
  isLoading?: boolean;
}

function StatusBadge({ status }: { status: ScheduleStatus }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function ScheduleHeader({
  schedule,
  assignmentCount,
  hasErrors,
  onValidate,
  onSubmit,
  onApprove,
  onReject,
  onDelete,
  canApprove,
  isLoading = false,
}: Props) {
  const isDraft = schedule.status === 'DRAFT';
  const isPending = schedule.status === 'PENDING_APPROVAL';
  const isApproved = schedule.status === 'APPROVED';
  const isRejected = schedule.status === 'REJECTED';

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-gray-900 truncate">{schedule.name}</h2>
            <StatusBadge status={schedule.status} />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {fmtDate(schedule.startDate)} — {fmtDate(schedule.endDate)}
            {schedule.periodType && (
              <span className="ml-2 text-gray-400">· {schedule.periodType}</span>
            )}
          </p>
          {schedule.rejectReason && (
            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
              <XCircle size={13} />
              Razón de rechazo: {schedule.rejectReason}
            </p>
          )}
          {schedule.createdBy && (
            <p className="text-xs text-gray-400 mt-0.5">
              Creado por {schedule.createdBy.firstName} {schedule.createdBy.lastName}
            </p>
          )}
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap gap-2 shrink-0">
          {isDraft && (
            <>
              <button
                disabled={isLoading}
                onClick={onValidate}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 transition-colors"
              >
                <CheckCircle size={15} />
                Validar
              </button>
              <button
                disabled={isLoading || assignmentCount === 0}
                onClick={onSubmit}
                title={assignmentCount === 0 ? 'Asigna turnos antes de enviar' : undefined}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={15} />
                Enviar a aprobación
              </button>
              <button
                disabled={isLoading}
                onClick={onDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 transition-colors"
              >
                <Trash2 size={15} />
                Eliminar
              </button>
            </>
          )}

          {isPending && canApprove && (
            <>
              <button
                disabled={isLoading || hasErrors}
                onClick={onApprove}
                title={hasErrors ? 'Corrige los errores de validación antes de aprobar' : undefined}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <CheckCircle size={15} />
                Aprobar
              </button>
              <button
                disabled={isLoading}
                onClick={onReject}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 transition-colors"
              >
                <XCircle size={15} />
                Rechazar
              </button>
            </>
          )}

          {isPending && !canApprove && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-amber-600">
              <Clock size={15} />
              En revisión
            </div>
          )}


        </div>
      </div>

      {/* Alertas contextuales */}
      {isDraft && assignmentCount === 0 && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>
            <strong>Sin asignaciones.</strong> Debes asignar turnos a los trabajadores antes de enviar la malla a aprobación.
          </span>
        </div>
      )}

      {isDraft && assignmentCount > 0 && hasErrors && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>
            <strong>Errores de validación pendientes.</strong> Valida y corrige los errores antes de enviar a aprobación.
          </span>
        </div>
      )}

      {isPending && hasErrors && canApprove && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>
            <strong>Esta malla tiene errores de validación.</strong> No puede aprobarse hasta que sean corregidos.
          </span>
        </div>
      )}


    </div>
  );
}
