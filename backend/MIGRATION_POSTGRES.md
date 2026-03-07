# Migración de SQLite a PostgreSQL

## Pasos completados automáticamente

✅ Schema Prisma actualizado a PostgreSQL
✅ Variables de entorno (.env) actualizadas
✅ Búsquedas optimizadas con `mode: 'insensitive'` restauradas

## Pasos manuales requeridos

### 1. Instalar PostgreSQL

**Windows:**
- Descargar desde: https://www.postgresql.org/download/windows/
- O instalar con Chocolatey: `choco install postgresql`

**Verificar instalación:**
```bash
psql --version
```

### 2. Crear la base de datos

Abrir **SQL Shell (psql)** o terminal y ejecutar:

```sql
-- Conectar como superusuario (postgres)
psql -U postgres

-- Crear la base de datos
CREATE DATABASE hospital_saas;

-- Verificar
\l

-- Salir
\q
```

### 3. Configurar credenciales

Editar `backend/.env` si tus credenciales son diferentes:

```env
# Formato: postgresql://USUARIO:CONTRASEÑA@HOST:PUERTO/BASE_DE_DATOS
DATABASE_URL="postgresql://postgres:TU_CONTRASEÑA@localhost:5432/hospital_saas"
```

### 4. Instalar dependencias y migrar

```bash
cd backend

# Regenerar cliente de Prisma
npx prisma generate

# Crear migración inicial
npx prisma migrate dev --name init

# Ejecutar seed (datos iniciales)
npm run seed
```

### 5. Reiniciar servidor

```bash
npm run start:dev
```

## Verificación

El servidor debería iniciar sin errores y conectarse a PostgreSQL.

## Ventajas de PostgreSQL

✅ Búsquedas case-insensitive con `mode: 'insensitive'`
✅ Mejor rendimiento con grandes volúmenes de datos
✅ Soporte de transacciones avanzadas
✅ Tipos de datos más robustos
✅ Ideal para producción

## Notas

- Todos los datos de SQLite se perderán
- El seed creará datos de prueba nuevos
- Si hay errores, verificar que PostgreSQL esté corriendo: `pg_isready`
