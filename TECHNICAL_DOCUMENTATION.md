# 🏥 Hospital SaaS - Documentación Técnica Completa

## 📋 Índice

1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Backend - Detalles Técnicos](#backend---detalles-técnicos)
4. [Frontend - Detalles Técnicos](#frontend---detalles-técnicos)
5. [Seguridad](#seguridad)
6. [Multi-Tenancy](#multi-tenancy)
7. [Sistema de Roles](#sistema-de-roles)
8. [Auditoría](#auditoría)
9. [API Reference](#api-reference)
10. [Flujos Principales](#flujos-principales)

---

## Visión General

**Hospital SaaS** es un sistema multi-tenant completo para gestión hospitalaria que implementa las mejores prácticas de desarrollo, seguridad y escalabilidad.

### Características Principales

✅ **Multi-tenancy real** - Aislamiento completo de datos por institución  
✅ **RBAC** - 5 roles con permisos granulares  
✅ **Autenticación robusta** - JWT + Refresh Tokens  
✅ **Auditoría inmutable** - Registro de todas las operaciones  
✅ **Dashboards diferenciados** - UI adaptada por rol  
✅ **Escalable** - Arquitectura modular y limpia  
✅ **Documentado** - Swagger + READMEs completos  

---

## Arquitectura del Sistema

### Stack Tecnológico

#### Backend
```
NestJS 10 (Framework)
├── TypeScript 5 (Lenguaje)
├── PostgreSQL 14+ (Base de datos)
├── Prisma 5 (ORM)
├── Passport JWT (Autenticación)
├── bcrypt (Hash passwords)
├── class-validator (Validación)
├── Throttler (Rate limiting)
└── Swagger (Documentación)
```

#### Frontend
```
Next.js 14 App Router (Framework)
├── TypeScript 5 (Lenguaje)
├── TailwindCSS 3 (Estilos)
├── TanStack Query 5 (Estado servidor)
├── Zustand 4 (Estado cliente)
├── React Hook Form 7 (Formularios)
├── Axios (HTTP client)
├── Lucide React (Iconos)
└── Sonner (Notificaciones)
```

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│  Next.js 14 + TypeScript + TailwindCSS                      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Dashboard   │  │   Users      │  │  Institutions │     │
│  │  (5 roles)   │  │  Management  │  │  Management   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌────────────────────────────────────────────────┐        │
│  │  TanStack Query (Cache + Estado Servidor)     │        │
│  └────────────────────────────────────────────────┘        │
│  ┌────────────────────────────────────────────────┐        │
│  │  Zustand (Estado Cliente + Auth)              │        │
│  └────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST + JWT
                            │
┌─────────────────────────────────────────────────────────────┐
│                         BACKEND                              │
│  NestJS 10 + TypeScript + Prisma                            │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │  Users   │  │   Inst.  │  │  Audit   │   │
│  │  Module  │  │  Module  │  │  Module  │  │  Module  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│  ┌────────────────────────────────────────────────┐        │
│  │  Guards: JWT + Roles + Multi-tenant            │        │
│  └────────────────────────────────────────────────┘        │
│  ┌────────────────────────────────────────────────┐        │
│  │  Prisma ORM                                    │        │
│  └────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ SQL
                            │
┌─────────────────────────────────────────────────────────────┐
│                      POSTGRESQL 14+                          │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Users   │  │   Inst.  │  │  Refresh │  │  Audit   │   │
│  │  Table   │  │  Table   │  │  Tokens  │  │  Events  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Backend - Detalles Técnicos

### Estructura de Módulos

```
src/
├── auth/                    # Módulo de autenticación
│   ├── guards/              # JWT Guard + Roles Guard
│   ├── strategies/          # Passport JWT Strategy
│   ├── decorators/          # @GetUser, @Roles
│   ├── dto/                 # LoginDto, RefreshTokenDto
│   ├── auth.controller.ts   # Endpoints de auth
│   ├── auth.service.ts      # Lógica de autenticación
│   └── auth.module.ts
│
├── institutions/            # Módulo de instituciones
│   ├── dto/                 # CreateInstitutionDto, etc.
│   ├── institutions.controller.ts
│   ├── institutions.service.ts
│   └── institutions.module.ts
│
├── users/                   # Módulo de usuarios
│   ├── dto/                 # CreateUserDto, UpdateUserDto
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.module.ts
│
├── audit/                   # Módulo de auditoría
│   ├── audit.controller.ts
│   ├── audit.service.ts
│   └── audit.module.ts
│
├── prisma/                  # Módulo Prisma
│   ├── prisma.service.ts
│   └── prisma.module.ts
│
├── common/                  # Utilidades comunes
│   └── middleware/
│       └── tenant.middleware.ts
│
├── app.module.ts           # Módulo principal
└── main.ts                 # Entry point
```

### Modelo de Datos (Prisma Schema)

#### Institution
```prisma
model Institution {
  id        String   @id @default(uuid())
  name      String
  code      String   @unique
  status    InstitutionStatus @default(ACTIVE)
  metadata  Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  users     User[]
  auditEvents AuditEvent[]
}
```

#### User
```prisma
model User {
  id          String   @id @default(uuid())
  email       String   @unique
  password    String
  firstName   String
  lastName    String
  role        UserRole
  
  // Multi-tenant
  institutionId String?
  institution   Institution?
  
  // Seguridad
  isActive    Boolean  @default(true)
  failedLoginAttempts Int @default(0)
  lockedUntil DateTime?
  lastLogin   DateTime?
  
  // Soft delete
  deletedAt   DateTime?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  refreshTokens RefreshToken[]
  auditEvents   AuditEvent[]
}
```

#### AuditEvent (Inmutable)
```prisma
model AuditEvent {
  id            String   @id @default(uuid())
  eventType     AuditEventType
  userId        String?
  institutionId String?
  entityType    String?
  entityId      String?
  details       Json?
  ipAddress     String?
  userAgent     String?
  createdAt     DateTime @default(now())
  
  user        User?
  institution Institution?
}
```

### Guards y Middleware

#### JWT Auth Guard
```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Verifica JWT válido
    // Adjunta user al request
    return super.canActivate(context);
  }
}
```

#### Roles Guard
```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Lee roles permitidos del decorador @Roles
    // Verifica que user.role esté en la lista
    // Lanza ForbiddenException si no tiene permiso
  }
}
```

#### Tenant Middleware
```typescript
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Si no es SUPER_ADMIN, verifica institutionId
    // Agrega tenantId al request
  }
}
```

### Servicios Principales

#### AuthService
- `login()` - Validar credenciales + generar tokens
- `refresh()` - Renovar access token
- `logout()` - Invalidar refresh token
- `validateUser()` - Validar usuario activo
- `generateTokens()` - Crear JWT access + refresh

#### UsersService
- `create()` - Crear usuario con validaciones
- `findAll()` - Listar con filtro multi-tenant
- `findOne()` - Obtener por ID con filtro
- `update()` - Actualizar con permisos
- `softDelete()` - Marcar como eliminado
- `getStats()` - Estadísticas de usuarios

#### InstitutionsService (Solo SUPER_ADMIN)
- `create()` - Crear institución
- `findAll()` - Listar todas
- `suspend()` - Suspender institución
- `getStats()` - Estadísticas globales

#### AuditService
- `log()` - Registrar evento (solo INSERT)
- `findAll()` - Consultar eventos
- `getStats()` - Estadísticas de auditoría

---

## Frontend - Detalles Técnicos

### Estructura de Componentes

```
app/
├── layout.tsx              # Layout raíz con providers
├── page.tsx                # Redirect a /login
├── login/
│   └── page.tsx            # Página de login
├── dashboard/
│   └── page.tsx            # Dashboard principal (switch por rol)
├── instituciones/
│   └── page.tsx            # CRUD instituciones (SUPER_ADMIN)
├── usuarios/
│   └── page.tsx            # CRUD usuarios (SUPER_ADMIN, ADMIN)
└── auditoria/
    └── page.tsx            # Vista de auditoría

components/
├── auth/
│   └── withAuth.tsx        # HOC para proteger rutas
├── dashboard/
│   ├── StatCard.tsx        # Tarjeta de estadística
│   ├── SuperAdminDashboard.tsx
│   ├── AdminDashboard.tsx
│   ├── PlanificadorDashboard.tsx
│   ├── AprobadorDashboard.tsx
│   └── ConsultaDashboard.tsx
├── layout/
│   ├── Sidebar.tsx         # Navegación lateral
│   ├── Header.tsx          # Barra superior
│   └── DashboardLayout.tsx # Layout con Sidebar + Header
└── providers/
    └── Providers.tsx       # QueryClientProvider + Toaster

services/
├── auth.service.ts         # API calls de auth
├── users.service.ts        # API calls de users
├── institutions.service.ts # API calls de institutions
└── audit.service.ts        # API calls de audit

store/
└── auth.ts                 # Zustand store de autenticación

lib/
└── api.ts                  # Axios instance + interceptors
```

### Sistema de Autenticación Frontend

#### Flujo Completo

1. **Login:**
```typescript
const response = await authService.login({ email, password });
setAuth(response.user, response.accessToken);
router.push('/dashboard');
```

2. **Request con Token:**
```typescript
// Interceptor agrega automáticamente
config.headers.Authorization = `Bearer ${accessToken}`;
```

3. **Refresh Automático:**
```typescript
// Si 401, intenta refresh
const { accessToken } = await axios.post('/auth/refresh');
localStorage.setItem('accessToken', accessToken);
// Reintenta request original
```

4. **Logout:**
```typescript
await authService.logout();
clearAuth();
router.push('/login');
```

#### withAuth HOC

```typescript
export function withAuth(Component, allowedRoles?) {
  return function AuthenticatedComponent(props) {
    // Verifica autenticación
    if (!isAuthenticated) router.push('/login');
    
    // Verifica roles
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <Forbidden />;
    }
    
    return <Component {...props} />;
  };
}

// Uso:
export default withAuth(MyPage, [UserRole.SUPER_ADMIN]);
```

### Gestión de Estado

#### TanStack Query (Server State)

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['users', filters],
  queryFn: () => usersService.getAll(filters),
  staleTime: 60000,
});
```

#### Zustand (Client State)

```typescript
const useAuthStore = create()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setAuth: (user, token) => set({ user, accessToken: token }),
      clearAuth: () => set({ user: null, accessToken: null }),
    }),
    { name: 'auth-storage' }
  )
);
```

### Diseño y Estilos

#### TailwindCSS Config

```javascript
colors: {
  primary: { /* Azul institucional */ },
  medical: { /* Verde médico */ },
  danger: { /* Rojo */ },
}
```

#### Componentes Custom

```css
.btn-primary { @apply px-4 py-2 bg-primary-600 ... }
.card { @apply bg-white rounded-xl shadow-sm ... }
.badge-primary { @apply px-3 py-1 bg-primary-100 ... }
```

---

## Seguridad

### Backend

#### Autenticación
- JWT Access Token: **15 minutos**
- Refresh Token: **7 días** (httpOnly cookie)
- Bcrypt rounds: **10**
- Secret keys desde environment

#### Rate Limiting
```typescript
@Throttle({ default: { limit: 5, ttl: 60000 } })
// 5 requests por minuto en login
```

#### Bloqueo de Cuenta
- Máximo: **5 intentos fallidos**
- Bloqueo: **30 minutos**
- Registro en auditoría

#### Validación
```typescript
@IsEmail()
@MinLength(8)
@IsEnum(UserRole)
// class-validator en todos los DTOs
```

#### CORS
```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
});
```

### Frontend

#### Storage
- Access token: **localStorage** (para requests)
- User data: **Zustand persist**
- Refresh token: **httpOnly cookie** (backend maneja)

#### Protección de Rutas
```typescript
// HOC withAuth verifica:
- Usuario autenticado
- Rol permitido
- Redirige si no cumple
```

#### HTTPS en Producción
```typescript
cookie: {
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
}
```

---

## Multi-Tenancy

### Implementación

#### Campo Institucional
```typescript
institutionId: String? // null para SUPER_ADMIN
```

#### Filtrado Automático

**En Servicios:**
```typescript
async findAll(userRole, institutionId) {
  const where: any = {};
  
  if (userRole !== UserRole.SUPER_ADMIN) {
    where.institutionId = institutionId;
  }
  
  return this.prisma.user.findMany({ where });
}
```

#### JWT Payload
```typescript
{
  sub: userId,
  email: user.email,
  role: user.role,
  institutionId: user.institutionId, // Para filtrado
}
```

### Casos de Uso

#### SUPER_ADMIN
```typescript
// institutionId = null
// Ve TODAS las instituciones
const institutions = await this.prisma.institution.findMany();
```

#### ADMIN
```typescript
// institutionId = "uuid-institution"
// Solo ve usuarios de su institución
const users = await this.prisma.user.findMany({
  where: { institutionId: user.institutionId }
});
```

---

## Sistema de Roles

### Definición

```typescript
enum UserRole {
  SUPER_ADMIN,   // Acceso global total
  ADMIN,         // Gestión institucional
  PLANIFICADOR,  // Operaciones de planificación
  APROBADOR,     // Aprobación de solicitudes
  CONSULTA,      // Solo lectura
}
```

### Matriz de Permisos

| Acción | SUPER_ADMIN | ADMIN | PLAN | APRO | CONS |
|--------|-------------|-------|------|------|------|
| Ver instituciones | ✅ | ❌ | ❌ | ❌ | ❌ |
| Crear institución | ✅ | ❌ | ❌ | ❌ | ❌ |
| Ver usuarios globales | ✅ | ❌ | ❌ | ❌ | ❌ |
| Ver usuarios institución | ✅ | ✅ | ❌ | ❌ | ❌ |
| Crear usuario | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ver auditoría | ✅ | ✅ | ❌ | ❌ | ❌ |
| Planificación | ❌ | ❌ | ✅ | ❌ | ❌ |
| Aprobaciones | ❌ | ❌ | ❌ | ✅ | ❌ |
| Ver perfil | ✅ | ✅ | ✅ | ✅ | ✅ |

### Implementación

**Backend - Decorador:**
```typescript
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
async findAll() { ... }
```

**Frontend - HOC:**
```typescript
export default withAuth(UsersPage, [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN
]);
```

---

## Auditoría

### Eventos Registrados

```typescript
enum AuditEventType {
  INSTITUTION_CREATED,
  INSTITUTION_UPDATED,
  INSTITUTION_SUSPENDED,
  USER_CREATED,
  USER_UPDATED,
  USER_DELETED,
  LOGIN_SUCCESS,
  LOGIN_FAILED,
  LOGOUT,
}
```

### Registro de Evento

```typescript
await this.auditService.log({
  eventType: 'USER_CREATED',
  userId: creatorId,
  institutionId: user.institutionId,
  entityType: 'User',
  entityId: newUser.id,
  details: { email: newUser.email, role: newUser.role },
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
});
```

### Consulta

```typescript
const events = await this.auditService.findAll({
  institutionId: user.institutionId, // Filtro multi-tenant
  eventType: 'LOGIN_SUCCESS',
  startDate: new Date('2026-01-01'),
  limit: 50,
});
```

### Características

✅ **Inmutable** - Solo INSERT, nunca UPDATE/DELETE  
✅ **Completo** - Incluye IP, User-Agent  
✅ **Filtrado** - Por institución, tipo, fecha  
✅ **Detallado** - JSON con info completa  

---

## API Reference

### Authentication

#### POST /api/auth/login
Autenticar usuario y obtener tokens.

**Request:**
```json
{
  "email": "admin@hospital.com",
  "password": "Admin123!"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "admin@hospital.com",
    "firstName": "Juan",
    "lastName": "Admin",
    "role": "ADMIN",
    "institutionId": "uuid",
    "institution": {
      "id": "uuid",
      "name": "Hospital Central",
      "code": "HOSP001"
    }
  },
  "accessToken": "eyJhbGc..."
}
```

#### POST /api/auth/refresh
Renovar access token usando refresh token de cookie.

**Response:**
```json
{
  "accessToken": "eyJhbGc..."
}
```

#### POST /api/auth/logout
Cerrar sesión e invalidar refresh token.

**Headers:** `Authorization: Bearer <token>`

### Institutions (SUPER_ADMIN only)

#### GET /api/institutions
Listar todas las instituciones.

**Query params:**
- `status`: ACTIVE | SUSPENDED | INACTIVE
- `search`: texto de búsqueda

#### POST /api/institutions
Crear nueva institución.

**Request:**
```json
{
  "name": "Hospital Norte",
  "code": "HOSP002",
  "metadata": {
    "address": "Av. Principal 456"
  }
}
```

#### GET /api/institutions/stats
Estadísticas globales de instituciones.

#### PATCH /api/institutions/:id/suspend
Suspender institución.

### Users

#### GET /api/users
Listar usuarios (filtrado por institución si no es SUPER_ADMIN).

**Query params:**
- `role`: UserRole
- `search`: texto de búsqueda

#### POST /api/users
Crear nuevo usuario.

**Request:**
```json
{
  "email": "nuevo@hospital.com",
  "password": "Password123!",
  "firstName": "Nuevo",
  "lastName": "Usuario",
  "role": "PLANIFICADOR",
  "institutionId": "uuid"
}
```

#### PUT /api/users/:id
Actualizar usuario.

#### DELETE /api/users/:id
Soft delete de usuario.

#### GET /api/users/stats
Estadísticas de usuarios.

### Audit

#### GET /api/audit/events
Consultar eventos de auditoría.

**Query params:**
- `eventType`: AuditEventType
- `limit`: number
- `offset`: number

#### GET /api/audit/stats
Estadísticas de auditoría.

---

## Flujos Principales

### Flujo de Login

```
1. Usuario ingresa email + password
   │
2. Frontend → POST /api/auth/login
   │
3. Backend valida credenciales
   │
4. Backend verifica:
   ├─ Usuario existe
   ├─ Password correcto
   ├─ No está bloqueado
   ├─ Usuario activo
   └─ Institución activa
   │
5. Backend genera tokens:
   ├─ Access Token (15min)
   └─ Refresh Token (7 días)
   │
6. Backend registra evento en auditoría
   │
7. Backend retorna user + accessToken
   │
8. Frontend guarda en store + localStorage
   │
9. Refresh token guardado en httpOnly cookie
   │
10. Redirect a /dashboard
```

### Flujo de Request Autenticado

```
1. Componente hace request
   │
2. Axios interceptor agrega:
   Authorization: Bearer <accessToken>
   │
3. Backend JwtAuthGuard valida token
   │
4. Backend extrae payload:
   ├─ userId
   ├─ role
   └─ institutionId
   │
5. Backend RolesGuard verifica permisos
   │
6. Backend TenantMiddleware aplica filtro
   │
7. Controller ejecuta lógica
   │
8. Response retorna al frontend
```

### Flujo de Refresh Token

```
1. Request falla con 401
   │
2. Axios interceptor detecta error
   │
3. Frontend → POST /api/auth/refresh
   │
4. Backend lee refresh token de cookie
   │
5. Backend valida refresh token
   │
6. Backend genera nuevo access token
   │
7. Backend guarda nuevo refresh token
   │
8. Frontend guarda nuevo access token
   │
9. Reintenta request original con nuevo token
```

### Flujo Multi-Tenant

```
1. Usuario ADMIN hace login
   │
2. JWT incluye institutionId = "uuid-hosp-001"
   │
3. ADMIN → GET /api/users
   │
4. Backend extrae institutionId del JWT
   │
5. Service aplica filtro automático:
   where: { institutionId: "uuid-hosp-001" }
   │
6. Query solo retorna usuarios de su institución
   │
7. ADMIN ve solo usuarios de Hospital 001
```

```
1. Usuario SUPER_ADMIN hace login
   │
2. JWT incluye institutionId = null
   │
3. SUPER_ADMIN → GET /api/users
   │
4. Backend detecta role = SUPER_ADMIN
   │
5. Service NO aplica filtro de institución
   │
6. Query retorna TODOS los usuarios
   │
7. SUPER_ADMIN ve usuarios de todas las instituciones
```

---

**Documentación completa del SaaS Hospitalario Multi-Tenant** 🏥

Versión 1.0 - Sprint 1 Completado ✅
