'use client';

import { useQuery } from '@tanstack/react-query';
import { Users, UserPlus, Activity, PieChart } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { usersService } from '@/services/users.service';

export function AdminDashboard() {
  const { data: usersStats } = useQuery({
    queryKey: ['users', 'stats'],
    queryFn: () => usersService.getStats(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Institucional</h1>
        <p className="text-gray-600">Gestión de tu institución</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Usuarios"
          value={usersStats?.total || 0}
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Usuarios Activos"
          value={usersStats?.active || 0}
          icon={Activity}
          color="medical"
        />
        <StatCard
          title="Nuevos Este Mes"
          value={usersStats?.recent?.length || 0}
          icon={UserPlus}
          color="primary"
        />
        <StatCard
          title="Roles Diferentes"
          value={usersStats?.byRole?.length || 0}
          icon={PieChart}
          color="medical"
        />
      </div>

      {/* Users by Role */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Distribución por Rol</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {usersStats?.byRole?.map((roleData: any) => (
            <div
              key={roleData.role}
              className="p-4 bg-gradient-to-br from-primary-50 to-medical-50 rounded-lg border border-primary-200"
            >
              <p className="text-sm font-medium text-gray-600 mb-1">
                {roleData.role.replace('_', ' ')}
              </p>
              <p className="text-2xl font-bold text-primary-700">{roleData.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Users */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Últimos Usuarios Creados</h2>
        <div className="space-y-3">
          {usersStats?.recent && usersStats.recent.length > 0 ? (
            usersStats.recent.map((user: any) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary-700">
                      {user.firstName[0]}{user.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <span className="badge-primary">{user.role.replace('_', ' ')}</span>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No hay usuarios recientes</p>
          )}
        </div>
      </div>
    </div>
  );
}
