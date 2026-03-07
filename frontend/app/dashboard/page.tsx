'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/auth';
import { UserRole } from '@/types';
import { SuperAdminDashboard } from '@/components/dashboard/SuperAdminDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { PlanificadorDashboard } from '@/components/dashboard/PlanificadorDashboard';
import { AprobadorDashboard } from '@/components/dashboard/AprobadorDashboard';
import { ConsultaDashboard } from '@/components/dashboard/ConsultaDashboard';
import { withAuth } from '@/components/auth/withAuth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

function DashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
    }
  }, [isAuthenticated, user, router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const renderDashboard = () => {
    switch (user.role) {
      case UserRole.SUPER_ADMIN:
        return <SuperAdminDashboard />;
      case UserRole.ADMIN:
        return <AdminDashboard />;
      case UserRole.PLANIFICADOR:
        return <PlanificadorDashboard />;
      case UserRole.APROBADOR:
        return <AprobadorDashboard />;
      case UserRole.CONSULTA:
        return <ConsultaDashboard />;
      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-600">Rol no reconocido</p>
          </div>
        );
    }
  };

  return (
    <DashboardLayout>
      {renderDashboard()}
    </DashboardLayout>
  );
}

export default withAuth(DashboardPage);
