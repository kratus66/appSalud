'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  CheckSquare,
  Eye,
  Settings,
  LogOut,
  Activity,
  Clock,
  Calendar,
  UserCircle,
  CalendarCheck,
  CalendarClock,
  Stethoscope,
  Tag,
  CalendarRange,
  Ban,
  BarChart2,
  Shield,
  DollarSign,
  CreditCard,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { UserRole } from '@/types';
import { authService } from '@/services/auth.service';
import { toast } from 'sonner';
import clsx from 'clsx';

function LogoutButton() {
  const router = useRouter();
  const { clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try {
      await authService.logout();
      clearAuth();
      toast.success('Sesión cerrada exitosamente');
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Limpiar de todos modos
      clearAuth();
      router.push('/login');
    }
  };

  return (
    <button 
      onClick={handleLogout}
      aria-label="Cerrar sesión"
      className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-primary-200 hover:bg-danger-600 hover:text-white transition-all duration-200"
    >
      <LogOut className="w-5 h-5" aria-hidden="true" />
      <span className="font-medium">Cerrar Sesión</span>
    </button>
  );
}

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  roles: UserRole[];
}

const menuItems: MenuItem[] = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    href: '/dashboard',
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PLANIFICADOR, UserRole.APROBADOR, UserRole.CONSULTA, UserRole.DOCTOR, UserRole.RECEPCIONISTA],
  },
  {
    icon: Building2,
    label: 'Instituciones',
    href: '/instituciones',
    roles: [UserRole.SUPER_ADMIN],
  },
  {
    icon: Users,
    label: 'Usuarios',
    href: '/usuarios',
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  },
  {
    icon: UserCircle,
    label: 'Pacientes',
    href: '/pacientes',
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPCIONISTA, UserRole.DOCTOR],
  },
  {
    icon: CalendarCheck,
    label: 'Citas',
    href: '/citas',
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPCIONISTA, UserRole.PLANIFICADOR],
  },
  {
    icon: CalendarRange,
    label: 'Disponibilidad',
    href: '/disponibilidad',
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPCIONISTA],
  },
  {
    icon: BarChart2,
    label: 'Reportes',
    href: '/reportes',
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PLANIFICADOR, UserRole.APROBADOR, UserRole.CONSULTA],
  },
  {
    icon: CalendarClock,
    label: 'Mi Agenda',
    href: '/mi-agenda',
    roles: [UserRole.DOCTOR],
  },
  {
    icon: Ban,
    label: 'Mi Horario',
    href: '/mi-horario',
    roles: [UserRole.DOCTOR],
  },
  {
    icon: Stethoscope,
    label: 'Médicos',
    href: '/medicos',
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  },
  {
    icon: Tag,
    label: 'Especialidades',
    href: '/especialidades',
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  },
  {
    icon: Building2,
    label: 'Servicios',
    href: '/servicios',
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PLANIFICADOR],
  },
  {
    icon: Clock,
    label: 'Turnos',
    href: '/turnos',
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PLANIFICADOR],
  },
  {
    icon: FileText,
    label: 'Contratos',
    href: '/contratos',
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PLANIFICADOR],
  },
  {
    icon: Calendar,
    label: 'Festivos',
    href: '/festivos',
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PLANIFICADOR, UserRole.APROBADOR, UserRole.CONSULTA],
  },
  {
    icon: Activity,
    label: 'Auditoría',
    href: '/auditoria',
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  },
  // ── Admin SaaS (Solo SUPER_ADMIN) ──
  {
    icon: Shield,
    label: 'Panel Admin',
    href: '/admin/dashboard',
    roles: [UserRole.SUPER_ADMIN],
  },
  {
    icon: DollarSign,
    label: 'Planes',
    href: '/admin/planes',
    roles: [UserRole.SUPER_ADMIN],
  },
  {
    icon: CreditCard,
    label: 'Suscripciones',
    href: '/admin/suscripciones',
    roles: [UserRole.SUPER_ADMIN],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  if (!user) return null;

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(user.role)
  );

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-primary-900 to-primary-800 text-white shadow-2xl z-40 flex flex-col">
      {/* Logo / Header */}
      <div className="flex items-center justify-center h-16 border-b border-primary-700 px-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-medical-500 rounded-lg flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Hospital SaaS</h1>
            <p className="text-xs text-primary-300">Sistema de Gestión</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="px-6 py-4 border-b border-primary-700 bg-primary-850/50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold">
              {user.firstName[0]}{user.lastName[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-primary-300 truncate">
              {user.role.replace('_', ' ')}
            </p>
          </div>
        </div>
        {user.institution && (
          <div className="mt-2 px-2 py-1 bg-primary-700/50 rounded text-xs text-primary-200">
            {user.institution.name}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin scrollbar-thumb-primary-600 scrollbar-track-transparent">
        <ul className="space-y-1">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={clsx(
                    'flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group',
                    isActive
                      ? 'bg-medical-500 text-white shadow-lg'
                      : 'text-primary-200 hover:bg-primary-700/50 hover:text-white'
                  )}
                >
                  <Icon
                    className={clsx(
                      'w-5 h-5 transition-transform duration-200',
                      isActive ? 'scale-110' : 'group-hover:scale-110'
                    )}
                  />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-primary-700 bg-primary-900/50 shrink-0">
        <LogoutButton />
      </div>
    </aside>
  );
}
