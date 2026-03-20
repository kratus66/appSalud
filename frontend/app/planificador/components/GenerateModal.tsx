'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, Zap, Info } from 'lucide-react';
import { toast } from 'sonner';
import { schedulesService } from '@/services/schedules.service';

export function GenerateModal({
  scheduleId, onClose, onGenerated,
}: {
  scheduleId: string;
  onClose: () => void;
  onGenerated: () => void;
}) {
  const [considerPrevious, setConsiderPrevious] = useState(true);

  const mutation = useMutation({
    mutationFn: () =>
      schedulesService.generate(scheduleId, { considerPreviousMonth: considerPrevious }),
    onSuccess: (result) => {
      toast.success(
        `Malla generada: ${result.generated} asignaciones para ${result.workers} trabajadores`,
      );
      onGenerated();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? 'Error al generar la malla'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-purple-600" />
            <h2 className="font-bold text-gray-900">Generar malla automáticamente</h2>
          </div>
          <button onClick={onClose}>
            <X size={20} className="text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Explicación */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex gap-3">
            <Info size={15} className="text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Reglas de generación automática:</p>
              <ul className="space-y-0.5 text-blue-700" style={{ fontSize: 12 }}>
                <li>• 36 horas semanales por trabajador</li>
                <li>• <strong>M / T</strong> (6h): 6 días trabajo + 1 libre</li>
                <li>• <strong>N / MT</strong> (12h): 3 turnos + 3 descansos + 1 libre</li>
                <li>• Rota el tipo de turno cada semana del mes</li>
                <li>• Distribución aleatoria del día libre</li>
              </ul>
            </div>
          </div>

          {/* Rotación mensual */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <button
              type="button"
              role="switch"
              aria-checked={considerPrevious}
              onClick={() => setConsiderPrevious(!considerPrevious)}
              className={`relative inline-flex w-10 h-6 rounded-full transition-colors ${considerPrevious ? 'bg-indigo-600' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${considerPrevious ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
            <div>
              <div className="text-sm font-medium text-gray-800">Consultar mes anterior</div>
              <div className="text-xs text-gray-500">
                Alterna los turnos respecto al mes previo para maximizar la variedad
              </div>
            </div>
          </label>

          {/* Advertencia */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
            ⚠️ Esta acción reemplazará todas las asignaciones existentes de la malla,{' '}
            <strong>excepto las novedades/ausencias ya marcadas</strong>.
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 pb-5">
          <button onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancelar
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            <Zap size={14} />
            {mutation.isPending ? 'Generando...' : 'Generar malla'}
          </button>
        </div>
      </div>
    </div>
  );
}
