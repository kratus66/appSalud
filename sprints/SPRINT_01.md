# Sprint 01

## Fecha

- 12 de marzo de 2026

## Objetivo

Tener el sistema arrancando con base SaaS hospitalaria, multi-tenancy real, autenticacion, roles, UI base y una primera institucion funcional.

## Alcance

- Implementacion del arranque base SaaS para una plataforma hospitalaria.
- Habilitacion del esquema multi-tenant por institucion.
- Construccion de autenticacion y control inicial de accesos.
- Definicion de interfaz base para operacion institucional.

## Cambios en backend

- Creacion de los modulos auth, users, institutions, super-admin en alcance minimo y audit en capa base.
- Modelado de las entidades Institution, User, Role y AuditEvent.
- Implementacion de creacion de institucion.
- Implementacion de creacion de usuario administrador por institucion.
- Implementacion de login con JWT.
- Incorporacion de RBAC basico.
- Definicion de institution_id obligatorio en las entidades correspondientes.
- Incorporacion de middleware para inyectar institution_id automaticamente.
- Registro de auditoria para login, creacion de institucion y creacion de usuario.

## Cambios en frontend

- Construccion del diseno base hospitalario de la aplicacion.
- Definicion de paleta principal con azul clinico, verde quirurgico, blanco y gris claro.
- Uso de tipografia limpia orientada a legibilidad institucional.
- Diseno de login, dashboard basico, gestion de usuarios y gestion de instituciones para super admin.
- Implementacion de barra lateral fija y header con logo institucional, nombre de usuario, rol e indicadores discretos.
- Enfoque en panel limpio, alto espacio en blanco, bordes suaves e iconografia medica minimalista.

## Cambios en base de datos

- Incorporacion del modelo multi-tenant con institution_id como clave de aislamiento logico.
- Definicion de entidades base para instituciones, usuarios, roles y eventos de auditoria.
- Preparacion de datos iniciales para la primera institucion funcional.

## Archivos o modulos impactados

- backend/src/auth
- backend/src/users
- backend/src/institutions
- backend/src/audit
- backend/src/super-admin
- frontend/app/login
- frontend/app/dashboard
- frontend/app/usuarios
- frontend/app/instituciones

## Pruebas realizadas

- Verificacion de login con JWT.
- Verificacion de creacion de institucion.
- Verificacion de creacion de usuario administrador por institucion.
- Validacion inicial de aislamiento por institution_id.
- Validacion basica de roles y permisos.

## Incidencias corregidas

- Riesgo de fuga de datos entre instituciones mitigado mediante institution_id obligatorio.
- Necesidad de auditoria transversal resuelta con eventos base para acciones criticas.
- Necesidad de documentacion y datos iniciales contemplada mediante seeders y OpenAPI como apoyo del agente.

## Rol del agente AI

- Generar seeders iniciales.
- Validar consistencia multi-tenant.
- Sugerir mejoras de seguridad.
- Generar documentacion OpenAPI.
- Detectar posibles fugas de institution_id.
- Generar mocks de pruebas.

## Pendientes

- Endurecer reglas de seguridad y validaciones de acceso por tenant.
- Ampliar cobertura de auditoria a mas acciones funcionales.
- Expandir pruebas automatizadas sobre aislamiento de datos.

## Riesgos o notas

- El multi-tenancy debe revisarse en cada nuevo modulo para evitar consultas sin filtro institucional.
- La consistencia de RBAC depende de que cada endpoint respete el contexto del tenant.