# 🏥 Hospital SaaS - Backend

Sistema backend multi-tenant para gestión hospitalaria construido con NestJS, PostgreSQL y Prisma.

## 🚀 Características

- ✅ Multi-tenancy real con aislamiento por institución
- ✅ Autenticación JWT con refresh tokens httpOnly
- ✅ RBAC (5 roles: SUPER_ADMIN, ADMIN, PLANIFICADOR, APROBADOR, CONSULTA)
- ✅ Auditoría inmutable de todas las operaciones
- ✅ Rate limiting y protección contra fuerza bruta
- ✅ Soft delete de usuarios
- ✅ Documentación Swagger automática
- ✅ Arquitectura modular escalable

## 📋 Requisitos

- Node.js 18+
- PostgreSQL 14+
- npm o yarn

## 🔧 Instalación

1. **Clonar e instalar dependencias:**
```bash
cd backend
npm install
```

2. **Configurar variables de entorno:**
```bash
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL
```

3. **Ejecutar migraciones:**
```bash
npm run prisma:migrate
```

4. **Seedear la base de datos:**
```bash
npm run prisma:seed
```

## 🏃 Ejecución

### Desarrollo
```bash
npm run start:dev
```

### Producción
```bash
npm run build
npm run start:prod
```

El servidor estará disponible en `http://localhost:3001`

## 📚 API Documentation

Una vez iniciado el servidor, la documentación Swagger estará disponible en:
```
http://localhost:3001/api/docs
```

## 🔐 Usuarios de Prueba

Después del seeding, puedes usar estas credenciales:

| Rol | Email | Password |
|-----|-------|----------|
| Super Admin | superadmin@hospital.com | SuperAdmin123! |
| Admin | admin@hospitalcentral.com | Admin123! |
| Planificador | planificador@hospitalcentral.com | Plan123! |
| Aprobador | aprobador@hospitalcentral.com | Aprob123! |
| Consulta | consulta@hospitalcentral.com | Cons123! |

## 🗄️ Estructura de Base de Datos

### Entidades Principales

- **Institution**: Instituciones hospitalarias
- **User**: Usuarios del sistema con roles
- **RefreshToken**: Tokens de renovación
- **AuditEvent**: Eventos de auditoría (inmutable)

## 🔒 Seguridad

- Access token: 15 minutos
- Refresh token: 7 días (httpOnly cookie)
- Bloqueo tras 5 intentos fallidos
- Rate limiting: 10 requests/minuto en login
- Bcrypt para hashing de passwords

## 📁 Estructura del Proyecto

```
src/
├── auth/               # Autenticación y autorización
│   ├── guards/         # JWT y Roles guards
│   ├── strategies/     # Passport JWT strategy
│   └── decorators/     # Decoradores personalizados
├── institutions/       # Gestión de instituciones
├── users/              # Gestión de usuarios
├── audit/              # Sistema de auditoría
├── prisma/             # Servicio Prisma
└── common/             # Middlewares y utilidades
```

## 🔄 Multi-Tenancy

El sistema implementa multi-tenancy a nivel de fila:

- Cada usuario (excepto SUPER_ADMIN) pertenece a una institución
- Las queries automáticamente filtran por `institutionId`
- SUPER_ADMIN puede ver/gestionar todas las instituciones
- Los demás roles solo ven datos de su institución

## 📊 Auditoría

Todos los eventos importantes quedan registrados:

- Login exitoso/fallido
- Creación de instituciones
- Creación/edición/eliminación de usuarios
- Cambios en instituciones

Los registros de auditoría son **inmutables** (solo INSERT).

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## 📝 Scripts Disponibles

- `npm run start:dev` - Desarrollo con hot-reload
- `npm run build` - Compilar para producción
- `npm run prisma:migrate` - Ejecutar migraciones
- `npm run prisma:studio` - Abrir Prisma Studio
- `npm run prisma:seed` - Seedear base de datos
- `npm run lint` - Ejecutar linter

## 🔑 Endpoints Principales

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Renovar token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/me` - Usuario actual

### Institutions (SUPER_ADMIN)
- `POST /api/institutions` - Crear institución
- `GET /api/institutions` - Listar instituciones
- `GET /api/institutions/stats` - Estadísticas
- `PATCH /api/institutions/:id/suspend` - Suspender

### Users
- `POST /api/users` - Crear usuario
- `GET /api/users` - Listar usuarios
- `GET /api/users/stats` - Estadísticas
- `PUT /api/users/:id` - Actualizar
- `DELETE /api/users/:id` - Soft delete

### Audit
- `GET /api/audit/events` - Eventos de auditoría
- `GET /api/audit/stats` - Estadísticas

## 🛠️ Tecnologías

- **Framework**: NestJS 10
- **ORM**: Prisma 5
- **Database**: PostgreSQL
- **Auth**: Passport JWT
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI
- **Security**: bcrypt, throttler

## 📄 Licencia

MIT
