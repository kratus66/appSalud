'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { withAuth } from '@/components/auth/withAuth';
import { UserRole } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '@/services/users.service';
import { institutionsService } from '@/services/institutions.service';
import { Users as UsersIcon, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { UserModal, UserFormData } from '@/components/users/UserModal';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth';

function UsuariosPage() {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();

  const isSuperAdmin = currentUser?.role === UserRole.SUPER_ADMIN;

  const { data, isLoading } = useQuery({
    queryKey: ['users', search],
    queryFn: () => usersService.getAll({ search }),
  });

  const { data: institutionsData } = useQuery({
    queryKey: ['institutions'],
    queryFn: () => institutionsService.getAll(),
    enabled: isSuperAdmin, // Solo cargar si es SUPER_ADMIN
    retry: false, // No reintentar si falla
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const createMutation = useMutation({
    mutationFn: (data: UserFormData) => usersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario creado exitosamente');
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear usuario');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserFormData }) =>
      usersService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario actualizado exitosamente');
      setIsModalOpen(false);
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar usuario');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar usuario');
    },
  });

  const handleCreateClick = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (user: any) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleModalSubmit = async (data: UserFormData) => {
    if (editingUser) {
      await updateMutation.mutateAsync({ id: editingUser.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro que desea eliminar este usuario?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Usuarios</h1>
            <p className="text-gray-600">
              {isSuperAdmin
                ? 'Gestiona todos los usuarios del sistema'
                : 'Gestiona los usuarios de tu institución'}
            </p>
          </div>
          <button onClick={handleCreateClick} className="btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Nuevo Usuario</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar usuarios..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>

        {/* Users List */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Usuario</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Rol</th>
                  {isSuperAdmin && (
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Institución</th>
                  )}
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Estado</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={isSuperAdmin ? 6 : 5} className="text-center py-8 text-gray-500">
                      Cargando...
                    </td>
                  </tr>
                ) : data?.users && data.users.length > 0 ? (
                  data.users.map((user: any) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
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
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className="badge-primary">{user.role.replace('_', ' ')}</span>
                      </td>
                      {isSuperAdmin && (
                        <td className="py-3 px-4 text-gray-600">
                          {user.institution?.name || 'N/A'}
                        </td>
                      )}
                      <td className="py-3 px-4">
                        <span
                          className={`badge ${
                            user.isActive ? 'badge-medical' : 'badge-danger'
                          }`}
                        >
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditClick(user)}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Editar usuario"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                            title="Eliminar usuario"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={isSuperAdmin ? 6 : 5} className="text-center py-8 text-gray-500">
                      No se encontraron usuarios
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      <UserModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        user={editingUser}
        isLoading={createMutation.isPending || updateMutation.isPending}
        institutions={institutionsData?.institutions || []}
      />
    </DashboardLayout>
  );
}

export default withAuth(UsuariosPage, [UserRole.SUPER_ADMIN, UserRole.ADMIN]);
