# 🏥 Hospital SaaS - Sistema Multi-Tenant

Sistema completo de gestión hospitalaria multi-tenant construido con las mejores prácticas y tecnologías modernas.

## 🎯 Sprint 1 - Completado

✅ **Backend completo** (NestJS + PostgreSQL + Prisma)  
✅ **Frontend completo** (Next.js + TailwindCSS + TanStack Query)  
✅ **Multi-tenancy real** con aislamiento por institución  
✅ **Autenticación JWT** con refresh tokens  
✅ **5 roles RBAC** con permisos diferenciados  
✅ **Auditoría inmutable** de todas las operaciones  
✅ **Dashboards diferenciados** por rol  
✅ **Rutas protegidas** en frontend  
✅ **Documentación Swagger** completa  

## 🏗️ Arquitectura

```
appSalud/
├── backend/          # NestJS + PostgreSQL + Prisma
│   ├── src/
│   │   ├── auth/            # Autenticación JWT
│   │   ├── institutions/    # Gestión instituciones
│   │   ├── users/           # Gestión usuarios
│   │   ├── audit/           # Sistema auditoría
│   │   └── prisma/          # Servicio Prisma
│   └── prisma/
│       ├── schema.prisma    # Esquema DB
│       └── seed.ts          # Datos iniciales
│
└── frontend/         # Next.js 14 + TypeScript
    ├── app/
    │   ├── dashboard/       # Dashboard principal
    │   ├── instituciones/   # CRUD instituciones
    │   ├── usuarios/        # CRUD usuarios
    │   └── auditoria/       # Eventos auditoría
    ├── components/
    │   ├── auth/            # HOC protección rutas
    │   ├── dashboard/       # Dashboards x rol
    │   └── layout/          # Sidebar + Header
    └── services/            # API services
```

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend

# Instalar dependencias
npm install

# Configurar .env
cp .env.example .env
# Editar DATABASE_URL y otras variables

# Ejecutar migraciones
npm run prisma:migrate

# Seedear base de datos
npm run prisma:seed

# Iniciar servidor
npm run start:dev
```

El backend estará en `http://localhost:3001`  
Swagger docs en `http://localhost:3001/api/docs`

### 2. Frontend Setup

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar .env.local
cp .env.local.example .env.local

# Iniciar aplicación
npm run dev
```

El frontend estará en `http://localhost:3000`

## 🔑 Credenciales de Prueba

| Rol | Email | Password | Permisos |
|-----|-------|----------|----------|
| **SUPER_ADMIN** | superadmin@hospital.com | SuperAdmin123! | Acceso total global |
| **ADMIN** | admin@hospitalcentral.com | Admin123! | Gestión institucional |
| **PLANIFICADOR** | planificador@hospitalcentral.com | Plan123! | Vista operativa |
| **APROBADOR** | aprobador@hospitalcentral.com | Aprob123! | Aprobaciones |
| **CONSULTA** | consulta@hospitalcentral.com | Cons123! | Solo lectura |

## 📊 Base de Datos

### Modelos Principales

**Institution** (Multi-tenant)
- ID, nombre, código único
- Estado: ACTIVE, SUSPENDED, INACTIVE
- Metadata JSON

**User**
- ID, email único, password hasheado
- Rol: SUPER_ADMIN, ADMIN, PLANIFICADOR, APROBADOR, CONSULTA
- institutionId (null para SUPER_ADMIN)
- Control de intentos fallidos y bloqueo
- Soft delete

**AuditEvent** (Inmutable)
- Tipo de evento
- Usuario, institución
- Detalles JSON
- IP, User-Agent
- Solo INSERT, nunca UPDATE/DELETE

**RefreshToken**
- Token único
- Usuario asociado
- Fecha expiración

## 🔒 Seguridad Implementada

### Backend
✅ JWT Access Token (15 minutos)  
✅ Refresh Token en httpOnly cookie (7 días)  
✅ Rate limiting (10 req/min en login)  
✅ Bloqueo tras 5 intentos fallidos (30 min)  
✅ Bcrypt para passwords  
✅ Guards de autenticación (JWT)  
✅ Guards de roles (RBAC)  
✅ Middleware multi-tenant  
✅ Validación con class-validator  

### Frontend
✅ Rutas protegidas con HOC  
✅ Refresh automático de tokens  
✅ Interceptor Axios  
✅ Estado persistente (Zustand)  
✅ Validación de formularios (React Hook Form)  

## 🎨 Diseño Hospitalario

### Paleta de Colores

- **Primary (Azul institucional)**: `#3b82f6`
- **Medical (Verde médico)**: `#22c55e`
- **Danger (Rojo)**: `#ef4444`
- **Warning (Amarillo)**: `#eab308`

### Características UI

- Sidebar fijo con navegación por rol
- Header con búsqueda y notificaciones
- Cards con hover effects
- Badges de estado
- Gradientes médicos
- Alto contraste y legibilidad

## 📱 Dashboards por Rol

### SUPER_ADMIN
- Total instituciones globales
- Total usuarios globales
- Últimas instituciones creadas
- Distribución por estado
- Usuarios por rol

### ADMIN
- Total usuarios institución
- Usuarios activos
- Distribución por rol
- Últimos usuarios creados

### PLANIFICADOR
- Vista operativa simple
- Tareas pendientes
- Acciones rápidas

### APROBADOR
- Aprobaciones pendientes
- Aprobadas/rechazadas hoy
- Actividad reciente

### CONSULTA
- Perfil personal
- Información institución
- Acceso solo lectura

## 🔄 Multi-Tenancy

### Implementación

1. **Campo institutionId** en todas las entidades relevantes
2. **Aislamiento automático** en queries (middleware)
3. **SUPER_ADMIN sin restricciones** (institutionId = null)
4. **Otros roles limitados** a su institución
5. **JWT incluye institutionId** para validación

### Ejemplo Query Multi-tenant

```typescript
// El middleware automáticamente filtra por institutionId
const users = await this.prisma.user.findMany({
  where: {
    institutionId: user.institutionId, // Auto-aplicado
  },
});
```

## 📝 Auditoría Inmutable

### Eventos Registrados

- ✅ Login exitoso/fallido
- ✅ Creación de institución
- ✅ Suspensión de institución
- ✅ Creación de usuario
- ✅ Actualización de usuario
- ✅ Eliminación de usuario (soft)
- ✅ Logout

### Estructura

```typescript
{
  eventType: 'USER_CREATED',
  userId: 'uuid',
  institutionId: 'uuid',
  entityType: 'User',
  entityId: 'uuid',
  details: { ... },
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  createdAt: '2026-03-04T...'
}
```

## 🛠️ Stack Tecnológico

### Backend
- **Framework**: NestJS 10
- **Database**: PostgreSQL 14+
- **ORM**: Prisma 5
- **Auth**: Passport JWT
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI
- **Security**: bcrypt, throttler

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5
- **Styling**: TailwindCSS 3
- **State (Server)**: TanStack Query 5
- **State (Client)**: Zustand 4
- **Forms**: React Hook Form 7
- **HTTP**: Axios 1
- **Icons**: Lucide React
- **Notifications**: Sonner

## 📚 Documentación

### API Documentation
Una vez iniciado el backend, accede a:
```
http://localhost:3001/api/docs
```

Swagger UI interactivo con:
- Todos los endpoints documentados
- Schemas de request/response
- Autenticación Bearer JWT
- Try it out para probar en vivo

### Endpoints Principales

**Auth**
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Renovar token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/me` - Usuario actual

**Institutions** (SUPER_ADMIN)
- `GET /api/institutions` - Listar
- `POST /api/institutions` - Crear
- `GET /api/institutions/stats` - Estadísticas
- `PATCH /api/institutions/:id/suspend` - Suspender

**Users**
- `GET /api/users` - Listar
- `POST /api/users` - Crear
- `PUT /api/users/:id` - Actualizar
- `DELETE /api/users/:id` - Soft delete
- `GET /api/users/stats` - Estadísticas

**Audit**
- `GET /api/audit/events` - Eventos
- `GET /api/audit/stats` - Estadísticas

## 🧪 Testing

### Backend
```bash
cd backend

# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

### Frontend
```bash
cd frontend

# Lint
npm run lint

# Build test
npm run build
```

## 🚀 Despliegue

### Backend (Producción)

1. Configurar variables de entorno `.env`
2. Build: `npm run build`
3. Ejecutar migraciones: `npm run prisma:migrate`
4. Iniciar: `npm run start:prod`

### Frontend (Vercel recomendado)

1. Push a GitHub
2. Conectar con Vercel
3. Configurar `NEXT_PUBLIC_API_URL`
4. Deploy automático

## 📈 Próximos Pasos (Sprint 2+)

- [ ] Módulo de pacientes
- [ ] Sistema de citas
- [ ] Gestión de inventario médico
- [ ] Reportes y analytics avanzados
- [ ] Notificaciones en tiempo real (WebSockets)
- [ ] Módulo de facturación
- [ ] Exportación de datos (PDF, Excel)
- [ ] Logs avanzados
- [ ] Tests E2E completos
- [ ] CI/CD pipeline

## 🤝 Contribución

Este es un proyecto base profesional y escalable. Para contribuir:

1. Fork el proyecto
2. Crear feature branch
3. Commit cambios
4. Push a branch
5. Crear Pull Request

## 📄 Licencia

MIT

## 👥 Autor

Hospital SaaS Team - 2026

---

**¿Listo para producción?** ✅  
**Escalable?** ✅  
**Seguro?** ✅  
**Multi-tenant real?** ✅  
**Arquitectura limpia?** ✅
