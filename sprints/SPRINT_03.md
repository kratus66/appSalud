# Sprint 03

## Fecha

- 12 de marzo de 2026

## Objetivo

Tener empleados configurados con sus relaciones operativas y restricciones para soportar la planificacion posterior.

## Alcance

- Implementacion de gestion de personal.
- Asociacion de empleados con servicio base, contrato y restricciones.
- Manejo de estado activo e inactivo.

## Cambios en backend

- Creacion del modulo employees.
- Implementacion de CRUD de empleados.
- Asociacion de cada empleado con servicio base.
- Asociacion de cada empleado con contrato.
- Incorporacion de restricciones mediante estructura JSONB.
- Implementacion de estado activo e inactivo para control operativo.

## Cambios en frontend

- Creacion de pantalla de lista de empleados.
- Creacion de perfil detallado de empleado.
- Visualizacion de restricciones mediante tags.
- Diseno de ficha tipo expediente clinico.
- Organizacion de informacion por bloques con indicadores visibles de contrato.

## Cambios en base de datos

- Definicion de la entidad o estructura de empleados.
- Persistencia de servicio base, contrato, restricciones y estado.
- Uso de JSONB para representar restricciones de forma flexible.

## Archivos o modulos impactados

- backend/src/employees
- frontend/app/empleados
- frontend/components relacionados con perfiles y listados de personal

## Pruebas realizadas

- Verificacion de alta, consulta, edicion y cambio de estado de empleados.
- Verificacion de asociacion correcta con servicio base y contrato.
- Validacion de almacenamiento y lectura de restricciones.
- Validacion de visualizacion de restricciones y datos contractuales en frontend.

## Incidencias corregidas

- Se abordo la necesidad de modelar restricciones heterogeneas usando JSONB.
- Se redujo el riesgo de configuraciones incompletas al vincular contrato y servicio base desde el inicio.
- Se hizo visible el estado operativo del empleado para excluir personal inactivo de procesos posteriores.

## Rol del agente AI

- Analizar incoherencias como asignaciones a servicios incompatibles.
- Sugerir mejoras en distribucion de personal.
- Detectar riesgo de sobrecarga futura.
- Validar consistencia de contratos.

## Pendientes

- Conectar restricciones con el motor de validacion de reglas futuras.
- Profundizar validaciones de compatibilidad entre perfil, servicio y contrato.
- Incorporar analitica sobre carga potencial por empleado.

## Riesgos o notas

- Las restricciones flexibles en JSONB exigen validadores claros para evitar datos ambiguos.
- La coherencia entre empleado, contrato y servicio impactara directamente la calidad de los cronogramas.