@echo off
echo ========================================
echo Hospital SaaS - Setup PostgreSQL
echo ========================================
echo.

REM Buscar instalación de PostgreSQL
set "PGBIN="
if exist "C:\Program Files\PostgreSQL\9.6\bin\psql.exe" set "PGBIN=C:\Program Files\PostgreSQL\9.6\bin"
if exist "C:\Program Files\PostgreSQL\10\bin\psql.exe" set "PGBIN=C:\Program Files\PostgreSQL\10\bin"
if exist "C:\Program Files\PostgreSQL\11\bin\psql.exe" set "PGBIN=C:\Program Files\PostgreSQL\11\bin"
if exist "C:\Program Files\PostgreSQL\12\bin\psql.exe" set "PGBIN=C:\Program Files\PostgreSQL\12\bin"
if exist "C:\Program Files\PostgreSQL\13\bin\psql.exe" set "PGBIN=C:\Program Files\PostgreSQL\13\bin"
if exist "C:\Program Files\PostgreSQL\14\bin\psql.exe" set "PGBIN=C:\Program Files\PostgreSQL\14\bin"
if exist "C:\Program Files\PostgreSQL\15\bin\psql.exe" set "PGBIN=C:\Program Files\PostgreSQL\15\bin"
if exist "C:\Program Files\PostgreSQL\16\bin\psql.exe" set "PGBIN=C:\Program Files\PostgreSQL\16\bin"
if exist "C:\Program Files\PostgreSQL\17\bin\psql.exe" set "PGBIN=C:\Program Files\PostgreSQL\17\bin"

if "%PGBIN%"=="" (
    echo ERROR: PostgreSQL no encontrado en C:\Program Files\PostgreSQL\
    echo Por favor, verifica la instalacion o instala PostgreSQL
    echo Descarga desde: https://www.postgresql.org/download/windows/
    pause
    exit /b 1
)

echo PostgreSQL encontrado en: %PGBIN%
echo.

REM Configurar PATH
set "PATH=%PGBIN%;%PATH%"

echo Verificando PostgreSQL...
"%PGBIN%\psql.exe" --version

echo.
echo Creando base de datos hospital_saas...
echo Ingresa la contraseña de postgres cuando se solicite
echo.

"%PGBIN%\psql.exe" -U postgres -c "CREATE DATABASE hospital_saas;"
if errorlevel 1 (
    echo ADVERTENCIA: La base de datos ya existe o hubo un error
)

echo.
echo ========================================
echo Ejecutando migraciones de Prisma...
echo ========================================
call npx prisma generate
call npx prisma migrate dev --name init

echo.
echo ========================================
echo Insertando datos de prueba...
echo ========================================
call npm run prisma:seed

echo.
echo ========================================
echo COMPLETADO!
echo ========================================
echo.
echo Credenciales de prueba:
echo   Super Admin: superadmin@hospital.com / SuperAdmin123!
echo   Admin: admin@hospitalcentral.com / Admin123!
echo.
echo Ahora puedes ejecutar: npm run start:dev
echo.
pause
