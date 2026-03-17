# Sprint 06

## Fecha

- 12 de marzo de 2026

## Objetivo

Completar el flujo de estados borrador, validado, aprobado y publicado, con versionamiento y auditoria avanzada sobre los cambios realizados.

## Alcance

- Cierre del flujo completo de vida del cronograma.
- Bloqueo de edicion en estado publicado.
- Gestion de nuevas versiones a partir de cambios.
- Comparacion detallada y auditoria integral.

## Cambios en backend

- Implementacion del flujo Borrador, Validado, Aprobado y Publicado.
- Bloqueo de edicion en estado Publicado.
- Creacion de nueva version ante cambios posteriores.
- Implementacion de comparador detallado tipo diff real.
- Incorporacion de auditoria completa del flujo.
- Registro de rulebook_version_id en el proceso de programacion.

## Cambios en frontend

- Creacion de pantallas de historial de versiones.
- Creacion de comparacion visual antes vs despues.
- Incorporacion de indicadores de cambios.
- Resaltado visual de cambios en verde y rojo.
- Implementacion de panel lateral comparativo.
- Confirmaciones claras para publicar.

## Cambios en base de datos

- Persistencia de estados del flujo de publicacion.
- Persistencia de versiones sucesivas del cronograma.
- Registro de auditoria avanzada y referencia a rulebook_version_id.
- Soporte para comparacion historica entre versiones.

## Archivos o modulos impactados

- backend/src/schedules
- backend/src/assignments
- backend/src/audit
- backend/src/rulebook
- frontend/app/historial-versiones
- frontend/components relacionados con comparacion y publicacion

## Pruebas realizadas

- Verificacion de transiciones de estado del flujo completo.
- Verificacion de bloqueo de edicion en cronogramas publicados.
- Verificacion de creacion de nuevas versiones tras cambios.
- Verificacion de comparacion entre versiones.
- Verificacion de auditoria y trazabilidad con rulebook_version_id.

## Incidencias corregidas

- Se resolvio la falta de trazabilidad detallada entre versiones.
- Se incorporo control para evitar modificaciones sobre informacion publicada.
- Se cerro el ciclo de auditoria sobre cambios y decisiones de publicacion.

## Rol del agente AI

- Generar resumen ejecutivo de cambios.
- Detectar impacto en carga laboral.
- Alertar si los cambios afectan cobertura critica.
- Generar informe en PDF automatico.

## Pendientes

- Integrar generacion formal de informes exportables.
- Profundizar alertas predictivas sobre cobertura critica y sobrecarga.
- Consolidar analitica ejecutiva para aprobacion institucional.

## Riesgos o notas

- El valor del versionamiento depende de que el diff sea claro y confiable para usuarios operativos y auditores.
- La referencia a la version del rulebook es clave para explicar por que una programacion fue validada o rechazada.