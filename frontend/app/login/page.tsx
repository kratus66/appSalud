'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Activity, Lock, Mail, AlertCircle, Users, UserCog, Calendar } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';

interface LoginForm {
  email: string;
  password: string;
}

interface TestCredential {
  role: string;
  email: string;
  password: string;
  icon: any;
  color: string;
}

const TEST_CREDENTIALS: TestCredential[] = [
  {
    role: 'Super Admin',
    email: 'superadmin@hospital.com',
    password: 'SuperAdmin123!',
    icon: UserCog,
    color: 'from-purple-600 to-purple-700',
  },
  {
    role: 'Admin',
    email: 'admin@hospitalcentral.com',
    password: 'Admin123!',
    icon: Users,
    color: 'from-blue-600 to-blue-700',
  },
  {
    role: 'Planificador',
    email: 'planificador@hospitalcentral.com',
    password: 'Plan123!',
    icon: Calendar,
    color: 'from-green-600 to-green-700',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await authService.login(data);
      setAuth(response.user, response.accessToken);
      toast.success('¡Bienvenido!');
      router.push('/dashboard');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al iniciar sesión';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const fillCredentials = (credential: TestCredential) => {
    setValue('email', credential.email);
    setValue('password', credential.password);
    setError('');
    toast.info(`Credenciales de ${credential.role} cargadas`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-medical-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-2xl mb-4">
            <Activity className="w-12 h-12 text-primary-600" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Hospital SaaS</h1>
          <p className="text-primary-200">Sistema de Gestión Hospitalaria</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Iniciar Sesión</h2>
            <p className="text-gray-600">Ingresa tus credenciales para continuar</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-danger-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  {...register('email', {
                    required: 'El email es requerido',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email inválido',
                    },
                  })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="usuario@hospital.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-danger-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  {...register('password', {
                    required: 'La contraseña es requerida',
                    minLength: {
                      value: 8,
                      message: 'Mínimo 8 caracteres',
                    },
                  })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-danger-600">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-primary-600 to-medical-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-primary-700 hover:to-medical-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isLoading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          {/* Test Credentials Selector */}
          <div className="mt-6">
            <p className="text-sm text-gray-700 mb-3 font-medium text-center">
              Credenciales de Prueba
            </p>
            <div className="grid grid-cols-1 gap-2">
              {TEST_CREDENTIALS.map((credential) => {
                const Icon = credential.icon;
                return (
                  <button
                    key={credential.email}
                    type="button"
                    onClick={() => fillCredentials(credential)}
                    className={`flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r ${credential.color} text-white hover:shadow-lg transition-all duration-200 group`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-sm">{credential.role}</p>
                      <p className="text-xs opacity-90">{credential.email}</p>
                    </div>
                    <div className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      Click para usar
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 text-center mt-3">
              Click en cualquier rol para cargar sus credenciales automáticamente
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-primary-200 text-sm mt-6">
          © 2026 Hospital SaaS. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
