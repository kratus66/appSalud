'use client';

import { FileText, Calendar, CheckCircle, Clock } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';

export function PlanificadorDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard de Planificación</h1>
        <p className="text-gray-600">Gestiona tus tareas de planificación</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tareas Pendientes"
          value={8}
          icon={Clock}
          color="warning"
        />
        <StatCard
          title="En Progreso"
          value={5}
          icon={FileText}
          color="primary"
        />
        <StatCard
          title="Completadas"
          value={23}
          icon={CheckCircle}
          color="medical"
        />
        <StatCard
          title="Próximas"
          value={12}
          icon={Calendar}
          color="primary"
        />
      </div>

      {/* Configuration Notice */}
      <div className="card bg-gradient-to-br from-primary-50 to-medical-50 border-2 border-primary-200">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Vista Operativa de Planificación
            </h3>
            <p className="text-gray-600">
              Aquí se mostrarán las herramientas de planificación específicas de tu institución
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="p-4 border-2 border-primary-200 rounded-lg hover:bg-primary-50 transition-colors text-left group">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                <FileText className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Nueva Planificación</p>
                <p className="text-sm text-gray-500">Crear nuevo plan</p>
              </div>
            </div>
          </button>
          <button className="p-4 border-2 border-medical-200 rounded-lg hover:bg-medical-50 transition-colors text-left group">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-medical-100 rounded-lg flex items-center justify-center group-hover:bg-medical-200 transition-colors">
                <Calendar className="w-5 h-5 text-medical-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Ver Calendario</p>
                <p className="text-sm text-gray-500">Planificaciones programadas</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
