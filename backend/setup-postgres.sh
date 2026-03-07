#!/bin/bash

# Hospital SaaS - PostgreSQL Setup Script
# Ejecutar: bash setup-postgres.sh

echo "🏥 Hospital SaaS - Configuración de PostgreSQL"
echo "=============================================="
echo ""

# Verificar si PostgreSQL está instalado
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL no está instalado"
    echo "   Descarga desde: https://www.postgresql.org/download/"
    exit 1
fi

echo "✅ PostgreSQL encontrado: $(psql --version)"
echo ""

# Verificar si PostgreSQL está corriendo
if ! pg_isready &> /dev/null; then
    echo "❌ PostgreSQL no está corriendo"
    echo "   Inicia el servicio PostgreSQL"
    exit 1
fi

echo "✅ PostgreSQL está corriendo"
echo ""

# Crear la base de datos
echo "📦 Creando base de datos 'hospital_saas'..."
psql -U postgres -c "CREATE DATABASE hospital_saas;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Base de datos creada"
else
    echo "⚠️  La base de datos ya existe o hubo un error"
fi

echo ""

# Ejecutar migraciones de Prisma
echo "🔄 Ejecutando migraciones de Prisma..."
npx prisma migrate dev --name init

if [ $? -ne 0 ]; then
    echo "❌ Error en las migraciones"
    exit 1
fi

echo ""

# Ejecutar seed
echo "🌱 Insertando datos de prueba..."
npm run prisma:seed

if [ $? -ne 0 ]; then
    echo "❌ Error al insertar datos"
    exit 1
fi

echo ""
echo "=============================================="
echo "✅ ¡Configuración completada exitosamente!"
echo ""
echo "Credenciales de prueba:"
echo "  Super Admin: superadmin@hospital.com / SuperAdmin123!"
echo "  Admin: admin@hospitalcentral.com / Admin123!"
echo ""
echo "Comandos útiles:"
echo "  npm run start:dev     - Iniciar servidor"
echo "  npm run prisma:studio - Abrir Prisma Studio"
echo "  npm run db:reset      - Resetear base de datos"
echo "=============================================="
