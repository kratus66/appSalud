'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doctorsService } from '@/services/doctors.service';
import { specialtiesService } from '@/services/specialties.service';
import {
  Doctor,
  UserRole,
  Specialty,
  CreateDoctorDto,
  UpdateDoctorDto,
} from '@/types';
import { useAuthStore } from '@/store/auth';
import {
  Stethoscope,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Eye,
  Mail,
  Phone,
  Building2,
  Award,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { withAuth } from '@/components/auth/withAuth';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

// ─── Doctor Modal ─────────────────────────────────────────────────────────────
interface DoctorModalProps {
  isOpen: boolean;
  doctor: Doctor | null;
  specialties: Specialty[];
  onClose: () => void;
  onSubmit: (data: CreateDoctorDto | UpdateDoctorDto) => void;
  isLoading: boolean;
}

function DoctorModal({ isOpen, doctor, specialties, onClose, onSubmit, isLoading }: DoctorModalProps) {
  const isEdit = !!doctor;

  const [form, setForm] = useState({
    firstName: doctor?.firstName ?? '',
    lastName: doctor?.lastName ?? '',
    email: doctor?.email ?? '',
    password: '',
    specialtyId: doctor?.doctorProfile?.specialtyId ?? '',
    licenseNumber: doctor?.doctorProfile?.licenseNumber ?? '',
    phone: doctor?.doctorProfile?.phone ?? '',
    consultingRoom: doctor?.doctorProfile?.consultingRoom ?? '',
    bio: doctor?.doctorProfile?.bio ?? '',
  });

  if (!isOpen) return null;

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error('Nombre y apellido son requeridos');
      return;
    }
    if (!isEdit && !form.password) {
      toast.error('La contraseña es requerida');
      return;
    }
    if (!form.specialtyId) {
      toast.error('Selecciona una especialidad');
      return;
    }

    const payload: any = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      specialtyId: form.specialtyId,
      licenseNumber: form.licenseNumber || undefined,
      phone: form.phone || undefined,
      consultingRoom: form.consultingRoom || undefined,
      bio: form.bio || undefined,
    };
    if (!isEdit) payload.password = form.password;
    if (isEdit && form.password) payload.password = form.password;

    onSubmit(payload);
  };

  const selectedSpecialty = specialties.find((s) => s.id === form.specialtyId);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              {isEdit ? 'Editar Médico' : 'Registrar Médico'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Datos personales */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Datos Personales
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre(s) *</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => set('firstName', e.target.value)}
                  placeholder="Alejandro"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apellido(s) *</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => set('lastName', e.target.value)}
                  placeholder="Vargas Restrepo"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="dr.vargas@clinica.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isEdit ? 'Nueva Contraseña (opcional)' : 'Contraseña *'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  placeholder={isEdit ? 'Dejar en blanco para no cambiar' : 'Mínimo 8 caracteres'}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Información profesional */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Información Profesional
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Specialty */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad *</label>
                <div className="relative">
                  <select
                    value={form.specialtyId}
                    onChange={(e) => set('specialtyId', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none"
                  >
                    <option value="">Seleccionar especialidad...</option>
                    {specialties.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                {selectedSpecialty && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedSpecialty.color }} />
                    <span className="text-xs text-gray-500">{selectedSpecialty.name}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Award className="inline w-3.5 h-3.5 mr-1" />
                  Número de Tarjeta Profesional
                </label>
                <input
                  type="text"
                  value={form.licenseNumber}
                  onChange={(e) => set('licenseNumber', e.target.value)}
                  placeholder="TP-12345-COL"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="inline w-3.5 h-3.5 mr-1" />
                  Teléfono de Contacto
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="+57 310 000 0000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Building2 className="inline w-3.5 h-3.5 mr-1" />
                  Consultorio
                </label>
                <input
                  type="text"
                  value={form.consultingRoom}
                  onChange={(e) => set('consultingRoom', e.target.value)}
                  placeholder="Consultorio 101 - Piso 2"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Biografía Profesional</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => set('bio', e.target.value)}
                  rows={3}
                  placeholder="Breve resumen de experiencia y formación..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
            >
              {isLoading ? 'Guardando...' : isEdit ? 'Actualizar Médico' : 'Registrar Médico'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Doctor Detail Panel ──────────────────────────────────────────────────────
interface DoctorDetailPanelProps {
  doctor: Doctor;
  onClose: () => void;
  onEdit: () => void;
  canEdit: boolean;
}

function DoctorDetailPanel({ doctor, onClose, onEdit, canEdit }: DoctorDetailPanelProps) {
  const sp = doctor.doctorProfile?.specialty;
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-40 flex flex-col border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-semibold text-gray-900">Perfil del Médico</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Avatar */}
        <div className="flex flex-col items-center text-center">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white mb-3"
            style={{ backgroundColor: sp?.color ?? '#64748b' }}
          >
            {getInitials(doctor.firstName, doctor.lastName)}
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            Dr(a). {doctor.firstName} {doctor.lastName}
          </h3>
          {sp && (
            <span
              className="mt-1.5 text-xs font-medium px-3 py-1 rounded-full"
              style={{ backgroundColor: sp.color + '20', color: sp.color }}
            >
              {sp.name}
            </span>
          )}
          <span className={`mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${
            doctor.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
          }`}>
            {doctor.isActive ? 'Activo' : 'Inactivo'}
          </span>
        </div>

        {/* Contact */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contacto</h4>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Mail className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="truncate">{doctor.email}</span>
          </div>
          {doctor.doctorProfile?.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Phone className="w-4 h-4 text-gray-400 shrink-0" />
              <span>{doctor.doctorProfile.phone}</span>
            </div>
          )}
          {doctor.doctorProfile?.consultingRoom && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
              <span>{doctor.doctorProfile.consultingRoom}</span>
            </div>
          )}
        </div>

        {/* Professional */}
        {(doctor.doctorProfile?.licenseNumber || doctor.doctorProfile?.bio) && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Información Profesional</h4>
            {doctor.doctorProfile?.licenseNumber && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Award className="w-4 h-4 text-gray-400 shrink-0" />
                <span>{doctor.doctorProfile.licenseNumber}</span>
              </div>
            )}
            {doctor.doctorProfile?.bio && (
              <p className="text-sm text-gray-600 leading-relaxed">{doctor.doctorProfile.bio}</p>
            )}
          </div>
        )}

        {/* Registered */}
        <p className="text-xs text-gray-400 text-center">
          Registrado el {new Date(doctor.createdAt).toLocaleDateString('es-CO', {
            year: 'numeric', month: 'long', day: 'numeric',
          })}
        </p>
      </div>

      {/* Actions */}
      {canEdit && (
        <div className="p-4 border-t">
          <button
            onClick={onEdit}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            <Edit2 className="w-4 h-4" />
            Editar Médico
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function DoctorsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState<Doctor | null>(null);
  const [detailDoctor, setDetailDoctor] = useState<Doctor | null>(null);

  const canEdit = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN;

  // Queries
  const { data, isLoading } = useQuery({
    queryKey: ['doctors', search, filterSpecialty],
    queryFn: () =>
      doctorsService.getAll({
        search: search || undefined,
        specialtyId: filterSpecialty || undefined,
        includeInactive: false,
      }),
  });

  const { data: specialtiesData } = useQuery({
    queryKey: ['specialties'],
    queryFn: () => specialtiesService.getAll(),
  });

  const doctors = data?.doctors ?? [];
  const specialties = specialtiesData?.specialties ?? [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (d: CreateDoctorDto) => doctorsService.create(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      toast.success('Médico registrado exitosamente');
      setIsModalOpen(false);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al crear médico'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: UpdateDoctorDto }) => doctorsService.update(id, d),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      toast.success('Médico actualizado');
      setIsModalOpen(false);
      setSelected(null);
      setDetailDoctor(updated);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al actualizar'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => doctorsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      toast.success('Médico eliminado');
      setDetailDoctor(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al eliminar'),
  });

  const handleOpenCreate = () => { setSelected(null); setIsModalOpen(true); };
  const handleOpenEdit = (d: Doctor) => { setSelected(d); setIsModalOpen(true); };

  const handleSubmit = (payload: CreateDoctorDto | UpdateDoctorDto) => {
    if (selected) {
      updateMutation.mutate({ id: selected.id, d: payload as UpdateDoctorDto });
    } else {
      createMutation.mutate(payload as CreateDoctorDto);
    }
  };

  const handleDelete = (d: Doctor) => {
    if (confirm(`¿Eliminar al médico Dr(a). ${d.firstName} ${d.lastName}?\nEsta acción no se puede deshacer.`)) {
      deleteMutation.mutate(d.id);
    }
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-blue-600" />
              </div>
              Médicos y Especialistas
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {data?.total ?? 0} médico{(data?.total ?? 0) !== 1 ? 's' : ''} registrado{(data?.total ?? 0) !== 1 ? 's' : ''}
            </p>
          </div>
          {canEdit && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Registrar Médico
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar médico..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div className="relative min-w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={filterSpecialty}
              onChange={(e) => setFilterSpecialty(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none"
            >
              <option value="">Todas las especialidades</option>
              {specialties.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Specialty count pills */}
        {filterSpecialty === '' && specialties.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {specialties.map((s) => (
              <button
                key={s.id}
                onClick={() => setFilterSpecialty(s.id)}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors hover:opacity-80"
                style={{ borderColor: s.color, color: s.color, backgroundColor: s.color + '10' }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                {s.name}
              </button>
            ))}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="divide-y divide-gray-100">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                  <div className="w-12 h-12 rounded-xl bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-40" />
                    <div className="h-3 bg-gray-100 rounded w-60" />
                  </div>
                </div>
              ))}
            </div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No hay médicos registrados</p>
              {canEdit && (
                <button onClick={handleOpenCreate} className="mt-3 text-blue-600 hover:underline text-sm">
                  Registrar el primer médico
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {doctors.map((doc) => {
                const sp = doc.doctorProfile?.specialty;
                return (
                  <div
                    key={doc.id}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setDetailDoctor(doc)}
                  >
                    {/* Avatar */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{ backgroundColor: sp?.color ?? '#64748b' }}
                    >
                      {getInitials(doc.firstName, doc.lastName)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm">
                          Dr(a). {doc.firstName} {doc.lastName}
                        </p>
                        {!doc.isActive && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Inactivo</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{doc.email}</p>
                      {doc.doctorProfile?.licenseNumber && (
                        <p className="text-xs text-gray-400">TP: {doc.doctorProfile.licenseNumber}</p>
                      )}
                    </div>

                    {/* Specialty badge */}
                    {sp && (
                      <div
                        className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full shrink-0"
                        style={{ backgroundColor: sp.color + '20', color: sp.color }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sp.color }} />
                        {sp.name}
                      </div>
                    )}

                    {/* Consulting room */}
                    {doc.doctorProfile?.consultingRoom && (
                      <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-500 shrink-0">
                        <Building2 className="w-3.5 h-3.5" />
                        {doc.doctorProfile.consultingRoom}
                      </div>
                    )}

                    {/* Actions */}
                    {canEdit && (
                      <div
                        className="flex gap-1 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setDetailDoctor(doc)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(doc)}
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {detailDoctor && (
        <DoctorDetailPanel
          doctor={detailDoctor}
          onClose={() => setDetailDoctor(null)}
          onEdit={() => { handleOpenEdit(detailDoctor); }}
          canEdit={canEdit}
        />
      )}

      {/* Modal */}
      <DoctorModal
        isOpen={isModalOpen}
        doctor={selected}
        specialties={specialties}
        onClose={() => { setIsModalOpen(false); setSelected(null); }}
        onSubmit={handleSubmit}
        isLoading={isMutating}
      />
    </DashboardLayout>
  );
}

export default withAuth(DoctorsPage, [UserRole.SUPER_ADMIN, UserRole.ADMIN]);
