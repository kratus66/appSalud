'use client';

import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { User, UserRole } from '@/types';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => Promise<void>;
  user?: User;
  isLoading?: boolean;
  institutions?: any[];
}

export interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: UserRole;
  institutionId?: string;
}

export function UserModal({
  isOpen,
  onClose,
  onSubmit,
  user,
  isLoading = false,
  institutions = [],
}: UserModalProps) {
  const { user: currentUser } = useAuthStore();
  const isSuperAdmin = currentUser?.role === UserRole.SUPER_ADMIN;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<UserFormData>({
    defaultValues: user
      ? {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          institutionId: user.institutionId || undefined,
        }
      : {
          institutionId: !isSuperAdmin ? currentUser?.institutionId || undefined : undefined,
        },
  });

  const selectedRole = watch('role');

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        institutionId: user.institutionId || undefined,
      });
    } else {
      reset({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: UserRole.CONSULTA,
        institutionId: !isSuperAdmin ? currentUser?.institutionId || undefined : undefined,
      });
    }
  }, [user, reset, isSuperAdmin, currentUser]);

  if (!isOpen) return null;

  const handleFormSubmit = (data: UserFormData) => {
    // Crear una copia de los datos con tipo flexible para permitir eliminar propiedades
    const submitData: Partial<UserFormData> & { firstName: string; lastName: string; role: UserRole } = { ...data };
    
    // Si estamos editando un usuario, eliminar institutionId (no se puede cambiar)
    if (user) {
      delete submitData.institutionId;
      delete submitData.email; // El email tampoco se puede cambiar
      // Si no se proporcionó nueva contraseña, eliminar el campo
      if (!submitData.password || submitData.password.trim() === '') {
        delete submitData.password;
      }
    } else {
      // Solo para creación de usuarios
      // Si no es SUPER_ADMIN y el usuario actual tiene institución, forzar esa institución
      if (!isSuperAdmin && currentUser?.institutionId) {
        submitData.institutionId = currentUser.institutionId;
      }
    }
    
    // Si el rol es SUPER_ADMIN, no debe tener institución
    if (submitData.role === UserRole.SUPER_ADMIN) {
      delete submitData.institutionId;
    }
    
    onSubmit(submitData as any);
    reset();
  };

  const availableRoles = isSuperAdmin
    ? [
        { value: UserRole.SUPER_ADMIN, label: 'Super Admin' },
        { value: UserRole.ADMIN, label: 'Administrador' },
        { value: UserRole.PLANIFICADOR, label: 'Planificador' },
        { value: UserRole.APROBADOR, label: 'Aprobador' },
        { value: UserRole.CONSULTA, label: 'Consulta' },
      ]
    : [
        { value: UserRole.ADMIN, label: 'Administrador' },
        { value: UserRole.PLANIFICADOR, label: 'Planificador' },
        { value: UserRole.APROBADOR, label: 'Aprobador' },
        { value: UserRole.CONSULTA, label: 'Consulta' },
      ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {user ? 'Editar Usuario' : 'Nuevo Usuario'}
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
          {/* First & Last Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre *
              </label>
              <input
                {...register('firstName', {
                  required: 'El nombre es requerido',
                  minLength: {
                    value: 2,
                    message: 'Mínimo 2 caracteres',
                  },
                })}
                type="text"
                className="input"
                placeholder="Juan"
                disabled={isLoading}
              />
              {errors.firstName && (
                <p className="text-sm text-danger-600 mt-1">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Apellido *
              </label>
              <input
                {...register('lastName', {
                  required: 'El apellido es requerido',
                  minLength: {
                    value: 2,
                    message: 'Mínimo 2 caracteres',
                  },
                })}
                type="text"
                className="input"
                placeholder="Pérez"
                disabled={isLoading}
              />
              {errors.lastName && (
                <p className="text-sm text-danger-600 mt-1">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email *
            </label>
            <input
              {...register('email', {
                required: 'El email es requerido',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Email inválido',
                },
              })}
              type="email"
              className="input"
              placeholder="usuario@hospital.com"
              disabled={isLoading || !!user}
            />
            {errors.email && (
              <p className="text-sm text-danger-600 mt-1">{errors.email.message}</p>
            )}
            {user && (
              <p className="text-xs text-gray-500 mt-1">
                El email no puede modificarse después de crear el usuario
              </p>
            )}
          </div>

          {/* Password - Solo al crear */}
          {!user && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contraseña *
              </label>
              <input
                {...register('password', {
                  required: 'La contraseña es requerida',
                  minLength: {
                    value: 8,
                    message: 'Mínimo 8 caracteres',
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                    message: 'Debe incluir mayúsculas, minúsculas, números y símbolos',
                  },
                })}
                type="password"
                className="input"
                placeholder="********"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-danger-600 mt-1">{errors.password.message}</p>
              )}
            </div>
          )}

          {/* Role */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Rol *
            </label>
            <select
              {...register('role', {
                required: 'El rol es requerido',
              })}
              className="input"
              disabled={isLoading}
            >
              <option value="">Selecciona un rol</option>
              {availableRoles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
            {errors.role && (
              <p className="text-sm text-danger-600 mt-1">{errors.role.message}</p>
            )}
          </div>

          {/* Institution - Solo si no es SUPER_ADMIN */}
          {selectedRole !== UserRole.SUPER_ADMIN && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Institución *
              </label>
              {isSuperAdmin ? (
                <select
                  {...register('institutionId', {
                    required: 'La institución es requerida',
                  })}
                  className="input"
                  disabled={isLoading}
                >
                  <option value="">Selecciona una institución</option>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} ({inst.code})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="input bg-gray-100"
                  value={currentUser?.institution?.name || ''}
                  disabled
                />
              )}
              {errors.institutionId && (
                <p className="text-sm text-danger-600 mt-1">{errors.institutionId.message}</p>
              )}
            </div>
          )}

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
              {isLoading ? 'Guardando...' : user ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
