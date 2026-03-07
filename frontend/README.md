# 🏥 Hospital SaaS - Frontend

Interfaz de usuario multi-tenant para gestión hospitalaria construida con Next.js 14, TypeScript y TailwindCSS.

## 🚀 Características

- ✅ Diseño hospitalario profesional (Azul + Verde médico)
- ✅ Dashboards diferenciados por rol (5 roles)
- ✅ Rutas protegidas con HOC
- ✅ Autenticación JWT con refresh automático
- ✅ TanStack Query para gestión de estado servidor
- ✅ Zustand para estado global
- ✅ React Hook Form para formularios
- ✅ Diseño totalmente responsive
- ✅ Sidebar fijo y header superior

## 📋 Requisitos

- Node.js 18+
- npm o yarn
- Backend ejecutándose en `http://localhost:3001`

## 🔧 Instalación

1. **Instalar dependencias:**
```bash
cd frontend
npm install
```

2. **Configurar variables de entorno:**
```bash
cp .env.local.example .env.local
# El archivo ya está configurado para desarrollo local
```

3. **Ejecutar en desarrollo:**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🎨 Diseño Hospitalario

### Paleta de Colores

- **Azul Institucional (Primary)**: `#3b82f6` - Color dominante
- **Verde Médico (Medical)**: `#22c55e` - Color secundario
- **Rojo Peligro (Danger)**: `#ef4444` - Alertas y errores
- **Amarillo Advertencia (Warning)**: `#eab308` - Notificaciones

### Componentes de UI

- **Botones**: `btn-primary`, `btn-medical`, `btn-secondary`, `btn-danger`
- **Cards**: `card`, `card-stat`
- **Badges**: `badge-primary`, `badge-medical`, `badge-warning`, `badge-danger`
- **Inputs**: `input`

## 🔐 Roles y Permisos

### SUPER_ADMIN
- **Dashboard**: Estadísticas globales, instituciones, usuarios totales
- **Acceso**: Instituciones, Usuarios, Auditoría
- **Permisos**: CRUD completo de instituciones y usuarios

### ADMIN
- **Dashboard**: Estadísticas institucionales, usuarios por rol
- **Acceso**: Usuarios, Auditoría
- **Permisos**: CRUD de usuarios de su institución

### PLANIFICADOR
- **Dashboard**: Vista operativa de planificación
- **Acceso**: Planificación
- **Permisos**: Gestión de planificaciones

### APROBADOR
- **Dashboard**: Aprobaciones pendientes
- **Acceso**: Aprobaciones
- **Permisos**: Aprobar/rechazar solicitudes

### CONSULTA
- **Dashboard**: Perfil personal
- **Acceso**: Solo lectura
- **Permisos**: Visualización únicamente

## 📁 Estructura del Proyecto

```
app/
├── (auth)/
│   └── login/          # Página de login
├── dashboard/          # Dashboard principal (diferenciado por rol)
├── instituciones/      # Gestión de instituciones (SUPER_ADMIN)
├── usuarios/           # Gestión de usuarios (SUPER_ADMIN, ADMIN)
└── auditoria/          # Eventos de auditoría (SUPER_ADMIN, ADMIN)

components/
├── auth/               # HOC withAuth para rutas protegidas
├── dashboard/          # Componentes de dashboards
├── layout/             # Sidebar, Header, DashboardLayout
└── providers/          # Providers de React Query

services/
├── auth.service.ts     # Servicios de autenticación
├── users.service.ts    # Servicios de usuarios
├── institutions.service.ts  # Servicios de instituciones
└── audit.service.ts    # Servicios de auditoría

store/
└── auth.ts            # Store de Zustand para autenticación
```

## 🔄 Autenticación

### Flujo de Login

1. Usuario ingresa credenciales en `/login`
2. Backend valida y retorna:
   - Access token (15 min)
   - Refresh token (httpOnly cookie, 7 días)
3. Frontend guarda access token en localStorage
4. Axios interceptor agrega token a todas las requests
5. Si access token expira, se renueva automáticamente

### Protección de Rutas

```tsx
import { withAuth } from '@/components/auth/withAuth';
import { UserRole } from '@/types';

function MyPage() {
  return <div>Protected content</div>;
}

// Solo SUPER_ADMIN
export default withAuth(MyPage, [UserRole.SUPER_ADMIN]);

// Múltiples roles
export default withAuth(MyPage, [UserRole.SUPER_ADMIN, UserRole.ADMIN]);

// Todos los roles autenticados
export default withAuth(MyPage);
```

## 📊 Gestión de Estado

### TanStack Query (Server State)

```tsx
import { useQuery } from '@tanstack/react-query';

const { data, isLoading } = useQuery({
  queryKey: ['users'],
  queryFn: () => usersService.getAll(),
});
```

### Zustand (Client State)

```tsx
import { useAuthStore } from '@/store/auth';

const { user, setAuth, clearAuth } = useAuthStore();
```

## 🎯 Componentes Principales

### Sidebar
- Navegación principal
- Filtrada por rol del usuario
- Logo y nombre de institución
- Botón de logout

### Header
- Barra de búsqueda
- Notificaciones
- Avatar y datos de usuario

### StatCard
- Tarjetas de estadísticas
- 4 variantes de color
- Iconos de Lucide React
- Animaciones hover

### DashboardLayout
- Layout principal con Sidebar + Header
- Padding y máximo ancho
- Fondo gris claro

## 🔨 Scripts Disponibles

- `npm run dev` - Desarrollo con hot-reload
- `npm run build` - Build para producción
- `npm run start` - Servidor de producción
- `npm run lint` - Ejecutar ESLint

## 🌐 API Integration

El frontend se comunica con el backend a través de servicios:

```typescript
// Ejemplo: Obtener usuarios
import { usersService } from '@/services/users.service';

const users = await usersService.getAll({ search: 'john' });
```

### Endpoints Principales

- `POST /auth/login` - Login
- `POST /auth/refresh` - Renovar token
- `POST /auth/logout` - Logout
- `GET /users` - Listar usuarios
- `GET /institutions` - Listar instituciones
- `GET /audit/events` - Eventos de auditoría

## 🔔 Notificaciones

Usando Sonner para toasts:

```tsx
import { toast } from 'sonner';

toast.success('Operación exitosa');
toast.error('Ocurrió un error');
```

## 🛠️ Tecnologías

- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: TailwindCSS
- **Estado Cliente**: Zustand
- **Estado Servidor**: TanStack Query
- **Formularios**: React Hook Form
- **HTTP Client**: Axios
- **Iconos**: Lucide React
- **Notificaciones**: Sonner

## 📱 Responsive Design

- Mobile first approach
- Breakpoints: `sm`, `md`, `lg`, `xl`
- Sidebar colapsable en móvil (próximamente)
- Grid adaptativo en dashboards

## 🔐 Credenciales de Prueba

Después del seeding del backend:

| Rol | Email | Password |
|-----|-------|----------|
| Super Admin | superadmin@hospital.com | SuperAdmin123! |
| Admin | admin@hospitalcentral.com | Admin123! |
| Planificador | planificador@hospitalcentral.com | Plan123! |
| Aprobador | aprobador@hospitalcentral.com | Aprob123! |
| Consulta | consulta@hospitalcentral.com | Cons123! |

## 📄 Licencia

MIT
