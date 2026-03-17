# Sprint 05

## Fecha

- 12 de marzo de 2026

## Objetivo

Crear cronogramas en estado borrador con asignacion manual y validacion operativa sobre el periodo planificado.

## Alcance

- Implementacion del flujo de programacion inicial en modo borrador.
- Registro de asignaciones manuales por empleado y dia.
- Ejecucion de validaciones y listado de violaciones.

## Cambios en backend

- Creacion de los modulos schedules y assignments.
- Implementacion de creacion de periodo.
- Implementacion de asignacion manual de turnos.
- Implementacion de guardado de version borrador.
- Ejecucion del motor de validacion sobre el borrador.
- Generacion de lista de violaciones detectadas.

## Cambios en frontend

- Construccion de pantalla tipo Excel hospitalario.
- Representacion de filas por empleados y columnas por dias del mes.
- Visualizacion de celdas con turno asignado.
- Incorporacion de drag and drop para asignacion.
- Uso de color por tipo de turno.
- Marcado visual de festivos.
- Tooltip con informacion detallada.
- Panel lateral con violaciones en tiempo real.
- UX enfocada en rapidez, baja saturacion de color y ausencia de animaciones innecesarias.

## Cambios en base de datos

- Persistencia de periodos de programacion.
- Persistencia de asignaciones por empleado, fecha y turno.
- Persistencia de versiones en estado borrador y sus violaciones asociadas.

## Archivos o modulos impactados

- backend/src/schedules
- backend/src/assignments
- frontend/app/programacion
- frontend/components relacionados con grilla, drag and drop y panel de validaciones

## Pruebas realizadas

- Verificacion de creacion de periodos.
- Verificacion de asignacion manual de turnos.
- Verificacion de guardado de borradores.
- Verificacion de ejecucion de validaciones.
- Verificacion de visualizacion de violaciones en tiempo real.

## Incidencias corregidas

- Se abordo la necesidad de visibilidad inmediata sobre errores de planificacion.
- Se incorporo una grilla operativa adecuada para alta densidad de informacion.
- Se hizo trazable la validacion sobre borradores antes de cualquier aprobacion.

## Rol del agente AI

- Validacion inteligente en tiempo real.
- Explicar cada error.
- Sugerir reemplazos posibles.
- Detectar cobertura insuficiente automaticamente.
- Sugerir distribucion mas equitativa.

## Pendientes

- Automatizar recomendaciones de asignacion mas alla de la validacion.
- Integrar comparativas entre versiones de cronograma.
- Mejorar soporte de performance para periodos y plantillas mas grandes.

## Riesgos o notas

- La experiencia tipo hoja de calculo exige especial cuidado en rendimiento y claridad visual.
- El valor real del borrador depende de la calidad de las explicaciones de violaciones y recomendaciones.