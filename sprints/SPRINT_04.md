# Sprint 04

## Fecha

- 12 de marzo de 2026

## Objetivo

Implementar el rulebook y el motor de validacion central con reglas reales, aun sin una UI compleja, para establecer el core tecnico de la planificacion.

## Alcance

- Incorporacion de reglas operativas parametrizables.
- Construccion de un motor de validacion extensible.
- Soporte de versionamiento de reglas.

## Cambios en backend

- Creacion de los modulos rulebook y validation-engine.
- Implementacion de las reglas REST_AFTER_NIGHT, MAX_WEEKLY_HOURS, MAX_CONSECUTIVE_NIGHTS, MIN_COVERAGE y SUNDAY_FREE_44H.
- Construccion del motor usando Strategy Pattern.
- Implementacion de RuleHandler por tipo de regla.
- Soporte de scope multiple para las reglas.
- Incorporacion de versionamiento mediante RulebookVersion y RuleInstance.

## Cambios en frontend

- Creacion de pantalla de lista de reglas.
- Creacion de pantalla o flujo para crear instancias de regla.
- Incorporacion de activacion de version de rulebook.
- Visualizacion tipo checklist.
- Indicadores HARD en rojo y SOFT en amarillo.
- Visualizacion del scope mediante etiquetas.

## Cambios en base de datos

- Persistencia del rulebook y sus versiones.
- Persistencia de instancias parametrizadas por regla.
- Estructura de datos preparada para trazabilidad y activacion de versiones.

## Archivos o modulos impactados

- backend/src/rulebook
- backend/src/validation-engine
- frontend/app/reglas
- frontend/components relacionados con versionamiento y visualizacion de reglas

## Pruebas realizadas

- Simulacion de validaciones antes de activar una version de rulebook.
- Verificacion de ejecucion por tipo de regla.
- Validacion de deteccion de violaciones HARD y SOFT.
- Verificacion de activacion de versiones.

## Incidencias corregidas

- Se estructuro el motor para evitar acoplamiento entre reglas heterogeneas.
- Se redujo el riesgo de cambios opacos con versionamiento explicito del rulebook.
- Se habilito trazabilidad sobre parametros y ambitos de aplicacion.

## Rol del agente AI

- Simular validaciones antes de activar el rulebook.
- Detectar conflictos entre reglas.
- Sugerir mejoras de parametros.
- Generar analisis de impacto.
- Explicar violaciones en lenguaje natural.

## Pendientes

- Integrar el motor de validacion con cronogramas reales y asignaciones.
- Profundizar la UI para analisis avanzado de reglas.
- Ajustar parametrizacion fina por institucion y contexto operativo.

## Riesgos o notas

- Conflictos entre reglas pueden generar falsos positivos o restricciones incompatibles si no se gobiernan bien.
- El versionamiento debe mantenerse alineado con auditoria y publicacion de cronogramas.