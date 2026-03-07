'use client';

import { User, Mail, Building2, Shield } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

export function ConsultaDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Perfil</h1>
        <p className="text-gray-600">Información de tu cuenta</p>
      </div>

      {/* Profile Card */}
      <div className="card bg-gradient-to-br from-primary-50 to-medical-50 border-2 border-primary-200">
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 bg-gradient-to-br from-primary-600 to-medical-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <span className="text-3xl font-bold text-white">
              {user?.firstName[0]}{user?.lastName[0]}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-gray-600 mb-2">{user?.email}</p>
            <span className="badge-primary text-sm">
              {user?.role.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Información Personal</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Nombre Completo</p>
              <p className="font-semibold text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-semibold text-gray-900">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Rol</p>
              <p className="font-semibold text-gray-900">
                {user?.role.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-medical-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-medical-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Institución</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Nombre</p>
              <p className="font-semibold text-gray-900">
                {user?.institution?.name || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Código</p>
              <p className="font-semibold text-gray-900">
                {user?.institution?.code || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Access Notice */}
      <div className="card bg-blue-50 border-2 border-blue-200">
        <div className="flex items-start space-x-3">
          <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-gray-900 mb-1">Acceso de Solo Lectura</h3>
            <p className="text-gray-600 text-sm">
              Tu rol de Consulta te permite visualizar información del sistema sin realizar modificaciones.
              Si necesitas permisos adicionales, contacta a tu administrador.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
