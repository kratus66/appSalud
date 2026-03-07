# Hospital SaaS - PostgreSQL Setup Script (Windows)
# Ejecutar en PowerShell: .\setup-postgres.ps1

Write-Host "🏥 Hospital SaaS - Configuración de PostgreSQL" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si PostgreSQL está instalado
$postgresPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $postgresPath) {
    Write-Host "❌ PostgreSQL no está instalado" -ForegroundColor Red
    Write-Host "   Descarga desde: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}

$version = & psql --version
Write-Host "✅ PostgreSQL encontrado: $version" -ForegroundColor Green
Write-Host ""

# Crear la base de datos
Write-Host "📦 Creando base de datos 'hospital_saas'..." -ForegroundColor Cyan
$env:PGPASSWORD = "postgres"
& psql -U postgres -c "CREATE DATABASE hospital_saas;" 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Base de datos creada" -ForegroundColor Green
} else {
    Write-Host "⚠️  La base de datos ya existe o hubo un error" -ForegroundColor Yellow
}

Write-Host ""

# Ejecutar migraciones de Prisma
Write-Host "🔄 Ejecutando migraciones de Prisma..." -ForegroundColor Cyan
& npx prisma migrate dev --name init

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en las migraciones" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Ejecutar seed
Write-Host "🌱 Insertando datos de prueba..." -ForegroundColor Cyan
& npm run prisma:seed

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al insertar datos" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "✅ ¡Configuración completada exitosamente!" -ForegroundColor Green
Write-Host ""
Write-Host "Credenciales de prueba:" -ForegroundColor Yellow
Write-Host "  Super Admin: superadmin@hospital.com / SuperAdmin123!" -ForegroundColor White
Write-Host "  Admin: admin@hospitalcentral.com / Admin123!" -ForegroundColor White
Write-Host ""
Write-Host "Comandos útiles:" -ForegroundColor Yellow
Write-Host "  npm run start:dev     - Iniciar servidor" -ForegroundColor White
Write-Host "  npm run prisma:studio - Abrir Prisma Studio" -ForegroundColor White
Write-Host "  npm run db:reset      - Resetear base de datos" -ForegroundColor White
Write-Host "==============================================" -ForegroundColor Cyan
