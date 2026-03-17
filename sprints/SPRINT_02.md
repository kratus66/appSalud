# Sprint 02

## Fecha

- 12 de marzo de 2026

## Objetivo

Tener la configuracion basica institucional mediante catalogos operativos y parametros iniciales para servicios, turnos, contratos y festivos.

## Alcance

- Incorporacion de catalogos base de operacion institucional.
- Definicion de turnos y contratos como piezas configurables.
- Integracion de festivos Colombia para soporte de planificacion.

## Cambios en backend

- Creacion de los modulos services, shifts, contracts y holidays.
- Implementacion de CRUD de servicios.
- Implementacion de CRUD de turnos como manana, tarde y noche.
- Implementacion de CRUD de contratos como 36h y 44h.
- Carga automatica de festivos Colombia.
- Incorporacion de validaciones basicas sobre datos de configuracion.

## Cambios en frontend

- Creacion de pantallas para gestion de servicios, gestion de turnos y gestion de contratos.
- Incorporacion de vista calendario para festivos.
- Implementacion de tablas limpias con filtros por estado.
- Construccion de formularios modales claros para altas y ediciones.
- Incorporacion de indicador visual de festivos con rojo suave.

## Cambios en base de datos

- Modelado y persistencia de catalogos de servicios, turnos, contratos y festivos.
- Preparacion de estructuras para parametrizacion institucional reutilizable.

## Archivos o modulos impactados

- backend/src/services
- backend/src/shifts
- backend/src/contracts
- backend/src/holidays
- frontend/app/servicios
- frontend/app/turnos
- frontend/app/contratos
- frontend/app/festivos

## Pruebas realizadas

- Verificacion de operaciones CRUD para servicios.
- Verificacion de operaciones CRUD para turnos.
- Verificacion de operaciones CRUD para contratos.
- Verificacion de carga y visualizacion de festivos.
- Validacion de reglas basicas sobre formularios y estados.

## Incidencias corregidas

- Se redujo el riesgo de configuraciones inconsistentes al centralizar catalogos base.
- Se incorporo validacion inicial para turnos y contratos institucionales.
- Se introdujo la referencia de festivos como insumo para futuras validaciones de cobertura.

## Rol del agente AI

- Validar consistencia logica de turnos.
- Detectar solapamientos horarios.
- Sugerir parametros estandar hospitalarios.
- Generar reportes de configuracion.
- Simular escenarios de cobertura.

## Pendientes

- Profundizar validaciones de solapamiento horario y configuraciones incompatibles.
- Enriquecer reglas institucionales con parametros de cobertura.
- Preparar los catalogos para ser consumidos por la gestion de personal y la programacion.

## Riesgos o notas

- La calidad de la programacion futura dependera de la consistencia real de servicios, turnos y contratos.
- Los festivos deben mantenerse sincronizados y auditables por institucion si se parametrizan localmente.