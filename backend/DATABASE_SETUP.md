# 🗄️ Configuración de Base de Datos PostgreSQL

Este proyecto utiliza **PostgreSQL** como base de datos principal.

## 📋 Requisitos

- PostgreSQL 14+ instalado
- Node.js 18+ instalado
- NPM o Yarn

## 🚀 Setup Rápido

### Opción 1: Script Automático (Recomendado)

**Windows (PowerShell):**
```powershell
cd backend
.\setup-postgres.ps1
```

**Linux/Mac (Bash):**
```bash
cd backend
chmod +x setup-postgres.sh
./setup-postgres.sh
```

### Opción 2: Manual

#### 1. Instalar PostgreSQL

**Windows:**
```powershell
# Con Chocolatey
choco install postgresql

# O descargar desde
# https://www.postgresql.org/download/windows/
```

**Mac:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### 2. Crear Base de Datos

```bash
# Conectar a PostgreSQL
psql -U postgres

# Ejecutar en psql
CREATE DATABASE hospital_saas;
\q
```

O usar el script SQL:
```bash
psql -U postgres -f setup-database.sql
```

#### 3. Configurar Variables de Entorno

Editar `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:TU_CONTRASEÑA@localhost:5432/hospital_saas"
```

#### 4. Ejecutar Migraciones

```bash
cd backend

# Generar cliente de Prisma
npx prisma generate

# Crear tablas
npx prisma migrate dev --name init

# Insertar datos de prueba
npm run prisma:seed
```

#### 5. Iniciar Servidor

```bash
npm run start:dev
```

## 🔧 Comandos Útiles

```bash
# Ver base de datos en interfaz gráfica
npm run prisma:studio

# Resetear base de datos y datos
npm run db:reset

# Crear nueva migración
npx prisma migrate dev --name nombre_migracion

# Aplicar migraciones en producción
npm run prisma:migrate:deploy

# Solo regenerar cliente de Prisma
npm run prisma:generate
```

## 🔐 Credenciales de Prueba

Después del seed, tendrás estas cuentas:

**Super Administrador:**
- Email: `superadmin@hospital.com`
- Password: `SuperAdmin123!`

**Administrador (Hospital Central):**
- Email: `admin@hospitalcentral.com`
- Password: `Admin123!`

**Doctor (Hospital Central):**
- Email: `doctor@hospitalcentral.com`
- Password: `Doctor123!`

## ⚙️ Configuración Avanzada

### Cambiar Puerto de PostgreSQL

Por defecto PostgreSQL usa el puerto 5432. Para cambiarlo:

```env
DATABASE_URL="postgresql://postgres:password@localhost:NUEVO_PUERTO/hospital_saas"
```

### Usar PostgreSQL Remoto

```env
DATABASE_URL="postgresql://usuario:password@servidor.com:5432/hospital_saas"
```

### Habilitar SSL

```env
DATABASE_URL="postgresql://usuario:password@servidor.com:5432/hospital_saas?sslmode=require"
```

### Pool de Conexiones

Editar `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  
  // Configuración de pool
  connection_limit = 10
}
```

## 🐛 Solución de Problemas

### Error: "psql: command not found"

PostgreSQL no está en el PATH. Agregar a PATH o usar ruta completa:

**Windows:**
```
C:\Program Files\PostgreSQL\14\bin\psql
```

### Error: "password authentication failed"

Verificar contraseña en `.env` y configuración de `pg_hba.conf`.

**Windows:** `C:\Program Files\PostgreSQL\14\data\pg_hba.conf`
**Linux:** `/etc/postgresql/14/main/pg_hba.conf`

Cambiar línea a:
```
host    all             all             127.0.0.1/32            md5
```

Reiniciar PostgreSQL:
```bash
# Linux
sudo systemctl restart postgresql

# Mac
brew services restart postgresql@14

# Windows (PowerShell como Admin)
Restart-Service postgresql-x64-14
```

### Error: "database does not exist"

Crear la base de datos:
```bash
psql -U postgres -c "CREATE DATABASE hospital_saas;"
```

### Error: "relation does not exist"

Ejecutar migraciones:
```bash
npx prisma migrate dev
```

### Migración desde SQLite

Si vienes de SQLite, los datos NO se migrarán automáticamente. Debes:

1. Exportar datos importantes de SQLite (si los necesitas)
2. Ejecutar el setup de PostgreSQL
3. El seed creará nuevos datos de prueba
4. Importar datos exportados si es necesario

## 📊 Monitoreo

### Ver Logs de PostgreSQL

**Linux:**
```bash
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

**Mac:**
```bash
tail -f /usr/local/var/log/postgres.log
```

**Windows:**
```
C:\Program Files\PostgreSQL\14\data\log\
```

### Verificar Conexiones Activas

```sql
SELECT * FROM pg_stat_activity WHERE datname = 'hospital_saas';
```

### Tamaño de Base de Datos

```sql
SELECT pg_size_pretty(pg_database_size('hospital_saas'));
```

## 🔄 Backup y Restore

### Crear Backup

```bash
pg_dump -U postgres -d hospital_saas -f backup.sql
```

### Restaurar Backup

```bash
psql -U postgres -d hospital_saas -f backup.sql
```

## 🎯 Próximos Pasos

Una vez configurado PostgreSQL:

1. ✅ Iniciar backend: `npm run start:dev`
2. ✅ Verificar: http://localhost:3001
3. ✅ API Docs: http://localhost:3001/api/docs
4. ✅ Prisma Studio: `npm run prisma:studio`
5. ✅ Iniciar frontend: `cd ../frontend && npm run dev`

---

**Nota:** Este proyecto ya no usa SQLite. Todos los cambios están configurados para PostgreSQL.
