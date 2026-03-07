'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { withAuth } from '@/components/auth/withAuth';
import { UserRole } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { auditService } from '@/services/audit.service';
import { Activity, Filter } from 'lucide-react';

function AuditoriaPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['audit', 'events'],
    queryFn: () => auditService.getEvents({ limit: 50 }),
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES');
  };

  const getEventTypeColor = (eventType: string) => {
    if (eventType.includes('LOGIN_SUCCESS')) return 'badge-medical';
    if (eventType.includes('LOGIN_FAILED')) return 'badge-danger';
    if (eventType.includes('CREATED')) return 'badge-primary';
    if (eventType.includes('DELETED')) return 'badge-danger';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Auditoría</h1>
            <p className="text-gray-600">Registro de eventos del sistema</p>
          </div>
          <button className="btn-secondary flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filtros</span>
          </button>
        </div>

        {/* Events List */}
        <div className="card">
          <div className="space-y-3">
            {isLoading ? (
              <p className="text-center py-8 text-gray-500">Cargando eventos...</p>
            ) : data?.events && data.events.length > 0 ? (
              data.events.map((event: any) => (
                <div
                  key={event.id}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <Activity className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`badge ${getEventTypeColor(event.eventType)}`}>
                            {event.eventType.replace(/_/g, ' ')}
                          </span>
                          {event.user && (
                            <span className="text-sm text-gray-600">
                              por {event.user.firstName} {event.user.lastName}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{formatDate(event.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                  {event.details && (
                    <div className="mt-2 pl-8">
                      <pre className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-200 overflow-x-auto">
                        {JSON.stringify(event.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center py-8 text-gray-500">No hay eventos registrados</p>
            )}
          </div>

          {data?.total && (
            <div className="mt-4 pt-4 border-t border-gray-200 text-center text-sm text-gray-600">
              Mostrando {data.events.length} de {data.total} eventos
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(AuditoriaPage, [UserRole.SUPER_ADMIN, UserRole.ADMIN]);
