'use client';

import { CheckSquare, Clock, CheckCircle, XCircle } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';

export function AprobadorDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard de Aprobaciones</h1>
        <p className="text-gray-600">Gestiona las aprobaciones pendientes</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Pendientes"
          value={6}
          icon={Clock}
          color="warning"
        />
        <StatCard
          title="Aprobadas Hoy"
          value={12}
          icon={CheckCircle}
          color="medical"
        />
        <StatCard
          title="Rechazadas"
          value={2}
          icon={XCircle}
          color="danger"
        />
        <StatCard
          title="Total Mes"
          value={45}
          icon={CheckSquare}
          color="primary"
        />
      </div>

      {/* Pending Approvals */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Aprobaciones Pendientes</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">Solicitud de Planificación #{item}</h3>
                <span className="badge-warning">Pendiente</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Requiere aprobación para proceder con la planificación
              </p>
              <div className="flex space-x-2">
                <button className="btn-medical text-sm">Aprobar</button>
                <button className="btn-danger text-sm">Rechazar</button>
                <button className="btn-secondary text-sm">Ver Detalles</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Actividad Reciente</h2>
        <div className="space-y-3">
          {[
            { action: 'Aprobado', item: 'Solicitud #45', time: 'Hace 2 horas', status: 'approved' },
            { action: 'Rechazado', item: 'Solicitud #44', time: 'Hace 3 horas', status: 'rejected' },
            { action: 'Aprobado', item: 'Solicitud #43', time: 'Hace 5 horas', status: 'approved' },
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {activity.status === 'approved' ? (
                  <CheckCircle className="w-5 h-5 text-medical-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-danger-600" />
                )}
                <div>
                  <p className="font-medium text-gray-900">
                    {activity.action}: {activity.item}
                  </p>
                  <p className="text-sm text-gray-500">{activity.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
