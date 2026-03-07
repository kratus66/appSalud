'use client';

import { useQuery } from '@tanstack/react-query';
import { Building2, Users, Activity, TrendingUp } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { institutionsService } from '@/services/institutions.service';
import { usersService } from '@/services/users.service';

export function SuperAdminDashboard() {
  const { data: institutionsStats } = useQuery({
    queryKey: ['institutions', 'stats'],
    queryFn: () => institutionsService.getStats(),
  });

  const { data: usersStats } = useQuery({
    queryKey: ['users', 'stats'],
    queryFn: () => usersService.getStats(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Global</h1>
        <p className="text-gray-600">Vista general del sistema</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Instituciones"
          value={institutionsStats?.total || 0}
          icon={Building2}
          color="primary"
          subtitle="Activas"
        />
        <StatCard
          title="Usuarios Globales"
          value={usersStats?.total || 0}
          icon={Users}
          color="medical"
          subtitle={`${usersStats?.active || 0} activos`}
        />
        <StatCard
          title="Instituciones Activas"
          value={institutionsStats?.byStatus?.active || 0}
          icon={Activity}
          color="medical"
        />
        <StatCard
          title="Crecimiento"
          value="+12%"
          icon={TrendingUp}
          color="primary"
          subtitle="Último mes"
        />
      </div>

      {/* Recent Institutions */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Instituciones Recientes</h2>
        <div className="space-y-3">
          {institutionsStats?.recent && institutionsStats.recent.length > 0 ? (
            institutionsStats.recent.map((inst: any) => (
              <div
                key={inst.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{inst.name}</p>
                    <p className="text-sm text-gray-500">{inst.code}</p>
                  </div>
                </div>
                <span className="badge-primary">{inst.status}</span>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No hay instituciones recientes</p>
          )}
        </div>
      </div>

      {/* Activity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Distribución por Estado</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Activas</span>
              <span className="font-bold text-medical-600">
                {institutionsStats?.byStatus?.active || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Suspendidas</span>
              <span className="font-bold text-danger-600">
                {institutionsStats?.byStatus?.suspended || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Inactivas</span>
              <span className="font-bold text-gray-600">
                {institutionsStats?.byStatus?.inactive || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Usuarios por Rol</h2>
          <div className="space-y-3">
            {usersStats?.byRole?.map((roleData: any) => (
              <div key={roleData.role} className="flex items-center justify-between">
                <span className="text-gray-700">{roleData.role.replace('_', ' ')}</span>
                <span className="font-bold text-primary-600">{roleData.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
