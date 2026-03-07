@echo off
echo ========================================
echo Reset PostgreSQL Password
echo ========================================
echo.
echo Este script te ayudará a resetear la contraseña de PostgreSQL
echo.
echo Opción 1: Intentar conectar con autenticación de Windows
echo Opción 2: Resetear contraseña manualmente
echo.
pause

echo.
echo Intentando conectar con autenticación de Windows...
echo Si se abre psql, ejecuta estos comandos:
echo.
echo   ALTER USER postgres WITH PASSWORD 'TuNuevaContraseña';
echo   \q
echo.
pause

psql -U postgres postgres

echo.
echo Si el comando anterior falló, necesitarás:
echo 1. Abrir "Servicios" de Windows (services.msc)
echo 2. Detener el servicio "postgresql-x64-18"
echo 3. Editar pg_hba.conf para permitir conexión sin contraseña (trust)
echo 4. Reiniciar el servicio
echo 5. Conectar y cambiar la contraseña
echo.
pause
