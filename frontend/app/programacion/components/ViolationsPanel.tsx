'use client';

import { AlertTriangle, AlertCircle, CheckCircle2, X } from 'lucide-react';
import type { ScheduleViolation, ViolationSeverity } from '../../../types/schedule.types';

interface Props {
  violations: ScheduleViolation[];
  onClose?: () => void;
}

const VIOLATION_TYPE_LABELS: Record<string, string> = {
  WEEKLY_HOURS: 'Horas semanales',
  MAX_CONSECUTIVE: 'Turnos consecutivos',
  REST_AFTER_NIGHT: 'Descanso post-noche',
  MIN_COVERAGE: 'Cobertura mínima',
  DUPLICATE_NIGHT: 'Turno nocturno duplicado',
};

function SeverityBadge({ severity }: { severity: ViolationSeverity }) {
  if (severity === 'ERROR') {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-red-600">
        <AlertCircle size={12} />
        Error
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs font-semibold text-yellow-600">
      <AlertTriangle size={12} />
      Advertencia
    </span>
  );
}

export function ViolationsPanel({ violations, onClose }: Props) {
  const errors = violations.filter((v) => v.severity === 'ERROR');
  const warnings = violations.filter((v) => v.severity === 'WARNING');

  if (violations.length === 0) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex items-center gap-3">
        <CheckCircle2 className="text-green-500 shrink-0" size={20} />
        <div>
          <p className="font-semibold text-green-700">Malla válida</p>
          <p className="text-sm text-green-600">No se encontraron violaciones.</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="ml-auto text-green-400 hover:text-green-600">
            <X size={16} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-red-200 bg-red-100">
        <div className="flex items-center gap-2">
          <AlertCircle className="text-red-500" size={18} />
          <span className="font-semibold text-red-700">
            {violations.length} violación{violations.length !== 1 ? 'es' : ''} detectada{violations.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          {errors.length > 0 && (
            <span className="text-red-600 font-medium">{errors.length} error{errors.length !== 1 ? 'es' : ''}</span>
          )}
          {warnings.length > 0 && (
            <span className="text-yellow-600 font-medium">{warnings.length} advertencia{warnings.length !== 1 ? 's' : ''}</span>
          )}
          {onClose && (
            <button onClick={onClose} className="text-red-400 hover:text-red-600">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Lista */}
      <div className="divide-y divide-red-100 max-h-80 overflow-y-auto">
        {violations.map((v) => (
          <div
            key={v.id}
            className={`px-4 py-3 ${v.severity === 'ERROR' ? 'bg-red-50' : 'bg-yellow-50'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <SeverityBadge severity={v.severity} />
                  <span className="text-xs text-gray-500">
                    {VIOLATION_TYPE_LABELS[v.violationType] ?? v.violationType}
                  </span>
                  {v.affectedDate && (
                    <span className="text-xs text-gray-400">
                      · {new Date(v.affectedDate).toLocaleDateString('es-CO', { timeZone: 'UTC' })}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-800">{v.message}</p>
                {v.suggestion && (
                  <p className="text-xs text-gray-500 mt-0.5">💡 {v.suggestion}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
