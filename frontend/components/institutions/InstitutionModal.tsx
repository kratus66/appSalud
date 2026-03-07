'use client';

import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { Institution } from '@/types';
import { useEffect } from 'react';

interface InstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InstitutionFormData) => Promise<void>;
  institution?: Institution;
  isLoading?: boolean;
}

export interface InstitutionFormData {
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  metadata?: {
    capacity?: number;
    specialties?: string[];
    emergencyPhone?: string;
  };
}

export function InstitutionModal({
  isOpen,
  onClose,
  onSubmit,
  institution,
  isLoading = false,
}: InstitutionModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InstitutionFormData>({
    defaultValues: institution
      ? {
          name: institution.name,
          code: institution.code,
          address: institution.metadata?.address,
          phone: institution.metadata?.phone,
          email: institution.metadata?.email,
        }
      : undefined,
  });

  useEffect(() => {
    if (institution) {
      reset({
        name: institution.name,
        code: institution.code,
        address: institution.metadata?.address,
        phone: institution.metadata?.phone,
        email: institution.metadata?.email,
      });
    } else {
      reset({
        name: '',
        code: '',
        address: '',
        phone: '',
        email: '',
      });
    }
  }, [institution, reset]);

  if (!isOpen) return null;

  const handleFormSubmit = (data: InstitutionFormData) => {
    onSubmit(data);
    reset();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {institution ? 'Editar Institución' : 'Nueva Institución'}
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
              Nombre de la Institución *
            </label>
            <input
              {...register('name', {
                required: 'El nombre es requerido',
                minLength: {
                  value: 3,
                  message: 'Mínimo 3 caracteres',
                },
              })}
              type="text"
              className="input"
              placeholder="Hospital Central"
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-danger-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Code */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Código Único *
            </label>
            <input
              {...register('code', {
                required: 'El código es requerido',
                pattern: {
                  value: /^[A-Z0-9]{3,10}$/,
                  message: 'Código inválido (solo mayúsculas y números, 3-10 caracteres)',
                },
              })}
              type="text"
              className="input uppercase"
              placeholder="HOSP001"
              disabled={isLoading || !!institution}
              maxLength={10}
            />
            {errors.code && (
              <p className="text-sm text-danger-600 mt-1">{errors.code.message}</p>
            )}
            {institution && (
              <p className="text-xs text-gray-500 mt-1">
                El código no puede modificarse después de crear la institución
              </p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Dirección
            </label>
            <input
              {...register('address')}
              type="text"
              className="input"
              placeholder="Av. Principal 123, Ciudad"
              disabled={isLoading}
            />
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                {...register('phone')}
                type="tel"
                className="input"
                placeholder="+1234567890"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                {...register('email', {
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Email inválido',
                  },
                })}
                type="email"
                className="input"
                placeholder="contacto@hospital.com"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-danger-600 mt-1">{errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Guardando...' : institution ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
