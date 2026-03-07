-- Hospital SaaS - PostgreSQL Database Setup
-- Ejecutar con: psql -U postgres -f setup-database.sql

-- Crear la base de datos
CREATE DATABASE hospital_saas;

-- Conectar a la base de datos
\c hospital_saas;

-- Crear extensiones útiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para búsquedas más rápidas

-- Verificar
SELECT current_database();

-- Información
SELECT 'Base de datos hospital_saas creada exitosamente' AS status;
