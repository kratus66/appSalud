'use client';

import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { Contract, UserRole } from '@/types';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ContractFormData) => Promise<void>;
  contract?: Contract | null;
  isLoading?: boolean;
  institutions?: any[];
}

export interface ContractFormData {
  name: string;
  weeklyHours: number;
  maxConsecutiveNights: number;
  requiredRestHours: number;
  rulesConfig?: string;
  institutionId?: string;
}

export function ContractModal({
  isOpen,
  onClose,
  onSubmit,
  contract,
  isLoading = false,
  institutions = [],
}: ContractModalProps) {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContractFormData>({
    defaultValues: contract
      ? {
          name: contract.name,
          weeklyHours: contract.weeklyHours,
          maxConsecutiveNights: contract.maxConsecutiveNights,
          requiredRestHours: contract.requiredRestHours,
          rulesConfig: contract.rulesConfig || '',
        }
      : {
          name: '',
          weeklyHours: 40,
          maxConsecutiveNights: 3,
          requiredRestHours: 12,
          rulesConfig: '',
        },
  });

  useEffect(() => {
    if (contract) {
      reset({
        name: contract.name,
        weeklyHours: contract.weeklyHours,
        maxConsecutiveNights: contract.maxConsecutiveNights,
        requiredRestHours: contract.requiredRestHours,
        rulesConfig: contract.rulesConfig || '',
      });
    } else {
      reset({
        name: '',
        weeklyHours: 40,
        maxConsecutiveNights: 3,
        requiredRestHours: 12,
        rulesConfig: '',
      });
    }
  }, [contract, reset]);

  if (!isOpen) return null;

  const handleFormSubmit = (data: ContractFormData) => {
    const submitData = { ...data };
    
    // Convertir a números
    submitData.weeklyHours = Number(submitData.weeklyHours);
    submitData.maxConsecutiveNights = Number(submitData.maxConsecutiveNights);
    submitData.requiredRestHours = Number(submitData.requiredRestHours);
    
    onSubmit(submitData as ContractFormData);
    reset();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {contract ? 'Editar Contrato' : 'Nuevo Contrato'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nombre del Contrato *
            </label>
            <input
              {...register('name', {
                required: 'El nombre es requerido',
                minLength: {
                  value: 3,
                  message: 'Mínimo 3 caracteres',
                },
                maxLength: {
                  value: 100,
                  message: 'Máximo 100 caracteres',
                },
              })}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Contrato 48 Horas Semanales"
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Weekly Hours */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Horas Semanales *
              </label>
              <input
                {...register('weeklyHours', {
                  required: 'Las horas semanales son requeridas',
                  min: {
                    value: 1,
                    message: 'Mínimo 1 hora',
                  },
                  max: {
                    value: 168,
                    message: 'Máximo 168 horas',
                  },
                })}
                type="number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              {errors.weeklyHours && (
                <p className="text-sm text-red-600 mt-1">{errors.weeklyHours.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Noches Consecutivas *
              </label>
              <input
                {...register('maxConsecutiveNights', {
                  required: 'Este campo es requerido',
                  min: {
                    value: 0,
                    message: 'Mínimo 0',
                  },
                  max: {
                    value: 30,
                    message: 'Máximo 30',
                  },
                })}
                type="number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              {errors.maxConsecutiveNights && (
                <p className="text-sm text-red-600 mt-1">{errors.maxConsecutiveNights.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Descanso (hrs) *
              </label>
              <input
                {...register('requiredRestHours', {
                  required: 'Este campo es requerido',
                  min: {
                    value: 0,
                    message: 'Mínimo 0',
                  },
                  max: {
                    value: 72,
                    message: 'Máximo 72',
                  },
                })}
                type="number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              {errors.requiredRestHours && (
                <p className="text-sm text-red-600 mt-1">{errors.requiredRestHours.message}</p>
              )}
            </div>
          </div>

          {/* Institution (only for SUPER_ADMIN when creating) */}
          {isSuperAdmin && !contract && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Institución *
              </label>
              <select
                {...register('institutionId', {
                  required: 'Debe seleccionar una institución',
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              >
                <option value="">Seleccionar institución...</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name} ({inst.code})
                  </option>
                ))}
              </select>
              {errors.institutionId && (
                <p className="text-sm text-red-600 mt-1">{errors.institutionId.message}</p>
              )}
            </div>
          )}

          {/* Rules Config (Optional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Configuración de Reglas (JSON)
            </label>
            <textarea
              {...register('rulesConfig')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder='{"allowOvertimeOnWeekends": true, "maxDailyHours": 12}'
              rows={3}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Opcional: Configuración adicional en formato JSON
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? 'Guardando...' : contract ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
