# 🏥 Hospital SaaS - Instrucciones de Instalación

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** 18 o superior ([Descargar](https://nodejs.org/))
- **PostgreSQL** 14 o superior ([Descargar](https://www.postgresql.org/download/))
- **npm** o **yarn**
- **Git** (opcional)

## 🚀 Instalación Paso a Paso

### 1️⃣ Configurar PostgreSQL

1. **Abrir PostgreSQL** (pgAdmin o terminal)

2. **Crear base de datos:**
```sql
CREATE DATABASE hospital_saas;
```

3. **Anotar credenciales:**
   - Host: `localhost`
   - Puerto: `5432`
   - Usuario: `postgres` (o tu usuario)
   - Contraseña: (tu contraseña)
   - Base de datos: `hospital_saas`

### 2️⃣ Configurar Backend

1. **Navegar a la carpeta backend:**
```bash
cd backend
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Crear archivo .env:**
```bash
# En Windows
copy .env.example .env

# En Mac/Linux
cp .env.example .env
```

4. **Editar .env con tus credenciales:**
```env
DATABASE_URL="postgresql://postgres:TU_CONTRASEÑA@localhost:5432/hospital_saas?schema=public"
JWT_SECRET="tu-secreto-super-seguro-cambiar-en-produccion"
JWT_REFRESH_SECRET="tu-refresh-secreto-super-seguro"
PORT=3001
```

5. **Ejecutar migraciones de Prisma:**
```bash
npm run prisma:migrate
```

6. **Seedear la base de datos con datos de prueba:**
```bash
npm run prisma:seed
```

7. **Iniciar el servidor backend:**
```bash
npm run start:dev
```

✅ **El backend debería estar corriendo en:** `http://localhost:3001`  
✅ **Documentación Swagger en:** `http://localhost:3001/api/docs`

### 3️⃣ Configurar Frontend

**Abrir una NUEVA terminal** (dejar el backend corriendo)

1. **Navegar a la carpeta frontend:**
```bash
cd frontend
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Crear archivo .env.local:**
```bash
# En Windows
copy .env.local.example .env.local

# En Mac/Linux
cp .env.local.example .env.local
```

4. **El archivo .env.local debe contener:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

5. **Iniciar el servidor frontend:**
```bash
npm run dev
```

✅ **El frontend debería estar corriendo en:** `http://localhost:3000`

### 4️⃣ Probar la Aplicación

1. **Abrir navegador en:** `http://localhost:3000`

2. **Iniciar sesión con credenciales de prueba:**

#### Super Admin (Acceso Total)
```
Email: superadmin@hospital.com
Password: SuperAdmin123!
```

#### Admin Institucional
```
Email: admin@hospitalcentral.com
Password: Admin123!
```

#### Planificador
```
Email: planificador@hospitalcentral.com
Password: Plan123!
```

#### Aprobador
```
Email: aprobador@hospitalcentral.com
Password: Aprob123!
```

#### Consulta (Solo Lectura)
```
Email: consulta@hospitalcentral.com
Password: Cons123!
```

## 🔧 Comandos Útiles

### Backend

```bash
# Ver base de datos en interfaz gráfica
npm run prisma:studio

# Regenerar cliente Prisma
npm run prisma:generate

# Ver logs en desarrollo
npm run start:dev

# Build para producción
npm run build
npm run start:prod
```

### Frontend

```bash
# Desarrollo con hot-reload
npm run dev

# Build de producción
npm run build

# Iniciar producción
npm run start

# Linter
npm run lint
```

## ❌ Solución de Problemas Comunes

### Error: "Cannot connect to database"
- ✅ Verificar que PostgreSQL esté corriendo
- ✅ Verificar credenciales en `.env`
- ✅ Verificar que la base de datos `hospital_saas` exista

### Error: "Port 3001 already in use"
- ✅ Cambiar `PORT` en `.env` del backend
- ✅ O cerrar la aplicación que usa el puerto 3001

### Error: "Module not found"
- ✅ Ejecutar `npm install` nuevamente
- ✅ Borrar `node_modules` y `package-lock.json`, luego `npm install`

### Error en migraciones de Prisma
```bash
# Resetear base de datos (CUIDADO: Borra todos los datos)
npm run prisma:migrate reset

# Luego volver a seedear
npm run prisma:seed
```

### Frontend no conecta con backend
- ✅ Verificar que backend esté corriendo
- ✅ Verificar `NEXT_PUBLIC_API_URL` en `.env.local`
- ✅ Abrir consola del navegador para ver errores

## 🎉 ¡Listo!

Si todo salió bien, deberías tener:

✅ Backend corriendo en `http://localhost:3001`  
✅ Frontend corriendo en `http://localhost:3000`  
✅ Swagger docs en `http://localhost:3001/api/docs`  
✅ Base de datos con usuarios de prueba  
✅ Sistema completamente funcional  

## 📚 Próximos Pasos

1. Explorar los diferentes dashboards según el rol
2. Revisar la documentación Swagger
3. Explorar el código fuente
4. Personalizar según tus necesidades

## 🆘 ¿Necesitas Ayuda?

- Revisa los README específicos en `/backend` y `/frontend`
- Verifica los logs de consola
- Revisa la documentación de:
  - [NestJS](https://docs.nestjs.com/)
  - [Prisma](https://www.prisma.io/docs)
  - [Next.js](https://nextjs.org/docs)

---

**¡Disfruta tu Sistema SaaS Hospitalario!** 🏥
