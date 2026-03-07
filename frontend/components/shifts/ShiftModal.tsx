'use client';

import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { Shift, UserRole, ShiftType } from '@/types';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ShiftFormData) => Promise<void>;
  shift?: Shift | null;
  isLoading?: boolean;
  institutions?: any[];
}

export interface ShiftFormData {
  name: string;
  startTime: string;
  endTime: string;
  shiftType: ShiftType;
  color: string;
  institutionId?: string;
}

const shiftTypeOptions = [
  { value: ShiftType.MORNING, label: 'Mañana' },
  { value: ShiftType.AFTERNOON, label: 'Tarde' },
  { value: ShiftType.NIGHT, label: 'Noche' },
  { value: ShiftType.SPECIAL, label: 'Especial' },
];

const colorOptions = [
  { value: '#FCD34D', label: 'Amarillo' },
  { value: '#FB923C', label: 'Naranja' },
  { value: '#60A5FA', label: 'Azul' },
  { value: '#34D399', label: 'Verde' },
  { value: '#A78BFA', label: 'Violeta' },
  { value: '#F87171', label: 'Rojo' },
];

export function ShiftModal({
  isOpen,
  onClose,
  onSubmit,
  shift,
  isLoading = false,
  institutions = [],
}: ShiftModalProps) {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ShiftFormData>({
    defaultValues: shift
      ? {
          name: shift.name,
          startTime: shift.startTime,
          endTime: shift.endTime,
          shiftType: shift.shiftType,
          color: shift.color,
        }
      : {
          name: '',
          startTime: '',
          endTime: '',
          shiftType: ShiftType.MORNING,
          color: '#FCD34D',
        },
  });

  const selectedColor = watch('color');

  useEffect(() => {
    if (shift) {
      reset({
        name: shift.name,
        startTime: shift.startTime,
        endTime: shift.endTime,
        shiftType: shift.shiftType,
        color: shift.color,
      });
    } else {
      reset({
        name: '',
        startTime: '',
        endTime: '',
        shiftType: ShiftType.MORNING,
        color: '#FCD34D',
      });
    }
  }, [shift, reset]);

  if (!isOpen) return null;

  const handleFormSubmit = (data: ShiftFormData) => {
    const submitData = { ...data };
    
    if (!isSuperAdmin) {
      delete submitData.institutionId;
    }
    
    onSubmit(submitData as ShiftFormData);
    reset();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {shift ? 'Editar Turno' : 'Nuevo Turno'}
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
              Nombre del Turno *
            </label>
            <input
              {...register('name', {
                required: 'El nombre es requerido',
                minLength: {
                  value: 2,
                  message: 'Mínimo 2 caracteres',
                },
              })}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Turno Mañana"
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Hora Inicio *
              </label>
              <input
                {...register('startTime', {
                  required: 'La hora de inicio es requerida',
                })}
                type="time"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              {errors.startTime && (
                <p className="text-sm text-red-600 mt-1">{errors.startTime.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Hora Fin *
              </label>
              <input
                {...register('endTime', {
                  required: 'La hora de fin es requerida',
                })}
                type="time"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              {errors.endTime && (
                <p className="text-sm text-red-600 mt-1">{errors.endTime.message}</p>
              )}
            </div>
          </div>

          {/* Shift Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tipo de Turno *
            </label>
            <select
              {...register('shiftType', {
                required: 'El tipo de turno es requerido',
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            >
              {shiftTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.shiftType && (
              <p className="text-sm text-red-600 mt-1">{errors.shiftType.message}</p>
            )}
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Color *
            </label>
            <div className="grid grid-cols-6 gap-3">
              {colorOptions.map((option) => (
                <label
                  key={option.value}
                  className="relative cursor-pointer"
                  title={option.label}
                >
                  <input
                    {...register('color', {
                      required: 'El color es requerido',
                    })}
                    type="radio"
                    value={option.value}
                    className="sr-only"
                    disabled={isLoading}
                  />
                  <div
                    className={`w-12 h-12 rounded-lg border-2 transition-all ${
                      selectedColor === option.value
                        ? 'border-blue-500 shadow-md scale-110'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: option.value }}
                  />
                </label>
              ))}
            </div>
            {errors.color && (
              <p className="text-sm text-red-600 mt-1">{errors.color.message}</p>
            )}
          </div>

          {/* Institution (only for SUPER_ADMIN when creating) */}
          {isSuperAdmin && !shift && (
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
              {isLoading ? 'Guardando...' : shift ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
