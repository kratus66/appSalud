# 🏥 Hospital SaaS - Sistema Multi-Tenant

Sistema completo de gestión hospitalaria multi-tenant construido con las mejores prácticas y tecnologías modernas.

---

## ✅ Sprint 1 — Fundación

✅ **Backend completo** (NestJS + PostgreSQL + Prisma)  
✅ **Frontend completo** (Next.js + TailwindCSS + TanStack Query)  
✅ **Multi-tenancy real** con aislamiento por institución  
✅ **Autenticación JWT** con refresh tokens  
✅ **5 roles RBAC** con permisos diferenciados  
✅ **Auditoría inmutable** de todas las operaciones  
✅ **Dashboards diferenciados** por rol  
✅ **Rutas protegidas** en frontend  
✅ **Documentación Swagger** completa  

**Módulos:** `auth` · `institutions` · `users` · `audit`  
**Tablas:** `institutions` · `users` · `refresh_tokens` · `audit_events`

---

## ✅ Sprint 2 — Configuración Operativa

✅ **Módulo de Servicios Hospitalarios** — CRUD completo  
✅ **Módulo de Turnos Clínicos** — Mañana/Tarde/Noche/Especial con colores  
✅ **Módulo de Contratos Laborales** — Configura semanas, noches, descansos  
✅ **Módulo de Festivos** — Festivos nacionales y de institución  
✅ **Filtros de auditoría** avanzados por fecha, tipo y entidad  
✅ **Frontend** para todos los módulos anteriores  

**Módulos:** `services` · `shifts` · `contracts` · `holidays`  
**Tablas:** `services` · `shifts` · `contracts` · `holidays`

---

## ✅ Sprint 3 — Pacientes, Médicos y Citas

✅ **Módulo de Pacientes** — CRUD completo con historial  
✅ **Módulo de Citas** — Creación, confirmación, cancelación y no-show  
✅ **Módulo de Médicos** — CRUD con asociación a especialidad  
✅ **Módulo de Especialidades** — CRUD con selector de color  
✅ **Búsqueda de pacientes** por número de documento  
✅ **Validación de doble reserva** (doble booking)  
✅ **Vista Mi Agenda** para doctores  
✅ **Vista Calendario** semanal/mensual para admins  
✅ **Roles extendidos**: DOCTOR, RECEPCIONISTA  

**Módulos:** `patients` · `appointments` · `doctors` · `specialties`  
**Tablas:** `patients` · `appointments` · `doctor_profiles` · `specialties`

---

## ✅ Sprint 4 — Disponibilidad y Horarios

✅ **Módulo de Disponibilidad** — Motor completo de disponibilidad médica  
✅ **Tabla `doctor_schedules`** — Define horario laboral por día de semana  
✅ **Tabla `time_blocks`** — Bloqueos de agenda (vacaciones, reuniones, etc.)  
✅ **Tabla `recurring_appointments`** — Citas recurrentes (semanal/quincenal/mensual)  
✅ **Algoritmo de slots** — Genera slots FREE/BOOKED/BLOCKED de 15-60 min  
✅ **Validaciones al crear cita:**  
  - Verifica horario laboral del médico  
  - Verifica bloqueos activos  
  - Verifica doble reserva  
✅ **Slot picker visual** en modal de citas (verde/azul/gris)  
✅ **Página `/disponibilidad`** — Panel con 4 pestañas: Horarios, Bloqueos, Recurrentes, Vista previa  
✅ **Página `/mi-horario`** — Doctor ve su propia agenda semanal con slots  
✅ **Tooltip** al pasar mouse sobre slot (paciente, motivo, estado)  

**Módulo:** `availability`  
**Tablas:** `doctor_schedules` · `time_blocks` · `recurring_appointments`  
**Nuevos Endpoints:**  
- `POST   /api/availability/schedule` — Crear/actualizar horario  
- `GET    /api/availability/schedule/:doctorId` — Ver horario  
- `DELETE /api/availability/schedule/:id` — Eliminar horario  
- `POST   /api/availability/block` — Crear bloqueo  
- `GET    /api/availability/block/:doctorId` — Ver bloqueos  
- `DELETE /api/availability/block/:id` — Eliminar bloqueo  
- `GET    /api/availability/slots/:doctorId?date=YYYY-MM-DD` — Slots disponibles  
- `POST   /api/availability/recurring` — Crear cita recurrente  
- `GET    /api/availability/recurring/:doctorId` — Ver citas recurrentes  
- `DELETE /api/availability/recurring/:id` — Cancelar cita recurrente  

---

## 🏗️ Arquitectura

```
appSalud/
├── backend/
│   ├── src/
│   │   ├── auth/             # Autenticación JWT
│   │   ├── institutions/     # Gestión instituciones
│   │   ├── users/            # Gestión usuarios
│   │   ├── audit/            # Auditoría inmutable
│   │   ├── services/         # Servicios hospitalarios
│   │   ├── shifts/           # Turnos clínicos
│   │   ├── contracts/        # Contratos laborales
│   │   ├── holidays/         # Festivos
│   │   ├── patients/         # Pacientes
│   │   ├── appointments/     # Citas médicas
│   │   ├── specialties/      # Especialidades médicas
│   │   ├── doctors/          # Perfiles de médicos
│   │   ├── availability/     # ★ Sprint 4: horarios, bloqueos, recurrentes
│   │   └── prisma/           # Servicio Prisma
│   └── prisma/
│       ├── schema.prisma     # 14 modelos
│       ├── seed.ts           # Datos iniciales
│       └── seedDoctors.ts    # 12 médicos + especialidades
│
└── frontend/
    ├── app/
    │   ├── dashboard/        # Dashboard principal
    │   ├── instituciones/    # CRUD instituciones
    │   ├── usuarios/         # CRUD usuarios
    │   ├── auditoria/        # Eventos auditoría
    │   ├── servicios/        # Servicios hospitalarios
    │   ├── turnos/           # Turnos clínicos
    │   ├── contratos/        # Contratos
    │   ├── festivos/         # Festivos
    │   ├── pacientes/        # Pacientes  
    │   ├── citas/            # Calendario de citas
    │   ├── medicos/          # Médicos CRUD
    │   ├── especialidades/   # Especialidades CRUD
    │   ├── disponibilidad/   # ★ Sprint 4: gestión horarios
    │   ├── mi-agenda/        # Agenda personal del doctor
    │   └── mi-horario/       # ★ Sprint 4: horario del doctor
    └── services/
        ├── availability.service.ts  # ★ Sprint 4
        └── ...                      # otros servicios
```

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env   # Ajustar DATABASE_URL, JWT_SECRET, etc.
npx prisma db push
npx prisma generate
npm run start:dev
```

Backend disponible en `http://localhost:3001`  
Swagger en `http://localhost:3001/api/docs`

### 2. Seed de datos iniciales

```bash
cd backend
npx ts-node prisma/seed.ts       # Usuarios e institución base
npx ts-node prisma/seedDoctors.ts # 12 médicos + 12 especialidades
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend disponible en `http://localhost:3000`

---

## 🔑 Credenciales de Prueba

| Rol | Email | Password | Permisos |
|-----|-------|----------|----------|
| **SUPER_ADMIN** | superadmin@hospital.com | SuperAdmin123! | Acceso total global |
| **ADMIN** | admin@hospitalcentral.com | Admin123! | Gestión institucional |
| **PLANIFICADOR** | planificador@hospitalcentral.com | Plan123! | Vista operativa |
| **APROBADOR** | aprobador@hospitalcentral.com | Aprob123! | Aprobaciones |
| **CONSULTA** | consulta@hospitalcentral.com | Cons123! | Solo lectura |
| **DOCTOR** | dr.vargas@hospitalcentral.com | Doctor123! | Agenda personal |
| **RECEPCIONISTA** | *(crear desde panel)* | — | Citas y pacientes |

---

## 📊 Base de Datos — Modelos (14 tablas)

| Tabla | Sprint | Descripción |
|-------|--------|-------------|
| `institutions` | 1 | Instituciones multi-tenant |
| `users` | 1 | Usuarios con RBAC |
| `refresh_tokens` | 1 | Tokens de renovación |
| `audit_events` | 1 | Auditoría inmutable |
| `services` | 2 | Servicios hospitalarios |
| `shifts` | 2 | Turnos clínicos |
| `contracts` | 2 | Contratos laborales |
| `holidays` | 2 | Festivos |
| `specialties` | 3 | Especialidades médicas |
| `doctor_profiles` | 3 | Perfiles de médicos |
| `patients` | 3 | Pacientes |
| `appointments` | 3 | Citas médicas |
| `doctor_schedules` | 4 ★ | Horario laboral semanal |
| `time_blocks` | 4 ★ | Bloqueos de agenda |
| `recurring_appointments` | 4 ★ | Citas recurrentes |

---

## 🩺 Flujo de Disponibilidad (Sprint 4)

```
1. Admin define horario:  POST /availability/schedule
   → Doctor trabaja Lunes 08:00–14:00 con slots de 30 min

2. Admin crea bloqueo:  POST /availability/block
   → Lunes 5 de mayo 10:00–12:00 por reunión médica

3. Recepcionista ve slots:  GET /availability/slots/:doctorId?date=2026-05-05
   → 08:00 FREE, 08:30 FREE, 09:00 FREE, 09:30 FREE,
      10:00 BLOCKED, 10:30 BLOCKED, 11:00 BLOCKED, 11:30 BLOCKED,
      12:00 FREE, 12:30 FREE, 13:00 FREE, 13:30 FREE

4. Recepcionista crea cita en slot FREE:  POST /appointments
   → Validación automática: horario ✓, sin bloqueo ✓, sin conflicto ✓

5. Si intenta hora bloqueada → 400 "El médico tiene su agenda bloqueada"
   Si intenta hora fuera de horario → 400 "El médico solo atiende de 08:00 a 14:00"
```

---

## 🔒 Seguridad

- JWT Access Token 15 min + Refresh Token 7 días (httpOnly cookie)
- Rate limiting 10 req/min en login
- Bloqueo tras 5 intentos fallidos (30 min)
- Bcrypt passwords
- Guards JWT + RBAC en todos los endpoints
- Aislamiento multi-tenant automático

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | NestJS 10 + TypeScript |
| ORM | Prisma 5.22 |
| Base de datos | PostgreSQL 17 |
| Auth | Passport JWT |
| Validación | class-validator |
| Docs | Swagger/OpenAPI |
| Frontend | Next.js 14 App Router |
| Estilos | TailwindCSS 3 |
| Estado servidor | TanStack Query 5 |
| Estado cliente | Zustand 4 |
| HTTP | Axios |
| Iconos | Lucide React |
| Notificaciones | Sonner |

---

## ✅ Sprint 5 — Dashboard Analítico

✅ **Módulo Analytics** — 7 endpoints de métricas agregadas  
✅ **KPIs en tiempo real** — pacientes, médicos, citas hoy/semana/mes, tasa de cancelación  
✅ **Gráfica de tendencia** — citas por período (semana/mes/año) con AreaChart  
✅ **Gráfica de estado** — PieChart donut con todos los estados de citas  
✅ **Gráfica horaria** — Distribución por hora del día (BarChart)  
✅ **Top médicos** — Ranking por volumen de citas con barra de progreso  
✅ **Citas por especialidad** — BarChart agrupado por especialidad médica  
✅ **Página `/reportes`** — Informe completo con filtro por período  
✅ **Dashboard Admin** renovado con gráficas recharts  
✅ **Multi-tenant** — todas las métricas filtradas por institución  

**Módulo:** `analytics`  
**Nuevos Endpoints:**  
- `GET /api/analytics/overview` — KPIs globales  
- `GET /api/analytics/appointments/by-status` — Conteo por estado  
- `GET /api/analytics/appointments/by-period?period=week|month|year` — Tendencia  
- `GET /api/analytics/doctors/top?limit=N` — Top médicos  
- `GET /api/analytics/patients/stats` — Estadísticas de pacientes  
- `GET /api/analytics/appointments/by-specialty` — Por especialidad  
- `GET /api/analytics/appointments/hourly` — Distribución horaria  

---

## 📈 Roadmap — Próximos Sprints

- [x] **Sprint 5**: Dashboard analytics — métricas, gráficas, KPIs médicos
- [ ] **Sprint 6**: Notificaciones en tiempo real (WebSockets / SSE)  
- [ ] **Sprint 7**: Reportes y exportación (PDF, Excel)  
- [ ] **Sprint 8**: Módulo de facturación y cobros  
- [ ] **Sprint 9**: App móvil (React Native / PWA)  
- [ ] **Sprint 10**: CI/CD pipeline + pruebas E2E Playwright  

---

## 📄 Licencia

MIT — Hospital SaaS Team 2026


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
