'use client';

import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { Service, UserRole } from '@/types';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ServiceFormData) => Promise<void>;
  service?: Service | null;
  isLoading?: boolean;
  institutions?: any[];
}

export interface ServiceFormData {
  name: string;
  description?: string;
  isActive?: boolean;
  institutionId?: string;
}

export function ServiceModal({
  isOpen,
  onClose,
  onSubmit,
  service,
  isLoading = false,
  institutions = [],
}: ServiceModalProps) {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServiceFormData>({
    defaultValues: service
      ? {
          name: service.name,
          description: service.description || '',
          isActive: service.isActive,
        }
      : {
          isActive: true,
        },
  });

  useEffect(() => {
    if (service) {
      reset({
        name: service.name,
        description: service.description || '',
        isActive: service.isActive,
      });
    } else {
      reset({
        name: '',
        description: '',
        isActive: true,
      });
    }
  }, [service, reset]);

  if (!isOpen) return null;

  const handleFormSubmit = (data: ServiceFormData) => {
    // Si no es SUPER_ADMIN, eliminar institutionId del objeto
    const submitData = { ...data };
    
    if (!isSuperAdmin) {
      delete submitData.institutionId;
    }
    
    onSubmit(submitData as ServiceFormData);
    reset();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {service ? 'Editar Servicio' : 'Nuevo Servicio'}
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
              Nombre del Servicio *
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="UCI - Unidad de Cuidados Intensivos"
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              {...register('description')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descripción detallada del servicio hospitalario"
              rows={3}
              disabled={isLoading}
            />
          </div>

          {/* Institution (only for SUPER_ADMIN when creating) */}
          {isSuperAdmin && !service && (
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

          {/* Active Status */}
          <div className="flex items-center">
            <input
              {...register('isActive')}
              type="checkbox"
              id="isActive"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={isLoading}
            />
            <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">
              Servicio activo
            </label>
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
              {isLoading ? 'Guardando...' : service ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
