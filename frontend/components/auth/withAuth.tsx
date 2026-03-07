'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles?: string[]
) {
  return function AuthenticatedComponent(props: P) {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();

    useEffect(() => {
      // Verificar si está autenticado
      if (!isAuthenticated || !user) {
        router.push('/login');
        return;
      }

      // Verificar roles permitidos
      if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirigir a dashboard si no tiene permisos
        router.push('/dashboard');
      }
    }, [isAuthenticated, user, router]);

    // Si no está autenticado, no renderizar nada
    if (!isAuthenticated || !user) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      );
    }

    // Si hay roles permitidos y el usuario no los tiene, no renderizar
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-danger-600 font-semibold">No tienes permisos para acceder a esta página</p>
            <button onClick={() => router.push('/dashboard')} className="btn-primary mt-4">
              Volver al Dashboard
            </button>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
