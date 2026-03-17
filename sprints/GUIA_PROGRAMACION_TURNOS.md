# Guía de Uso — Módulo de Programación de Turnos

> **Ruta:** `/programacion`  
> **Roles con acceso:** `ADMIN`, `PLANIFICADOR`, `APROBADOR`, `SUPER_ADMIN`

---

## ¿Qué es una malla de turnos?

Una **malla de turnos** es una planificación visual que asigna un tipo de turno a cada trabajador por cada día de un período definido. El sistema valida automáticamente que se cumplan las reglas laborales de **36 horas semanales** y las coberturas mínimas por turno.

---

## Flujo de estados

```
DRAFT  →  PENDING_APPROVAL  →  APPROVED
                          ↘  REJECTED  →  (corregir y reenviar)
```

| Estado | Descripción |
|--------|-------------|
| **Borrador** | En construcción. Se pueden editar turnos. |
| **Pendiente aprobación** | Enviada al aprobador. Solo lectura. |
| **Aprobada** | Aprobada definitivamente. Solo lectura. |
| **Rechazada** | Rechazada con motivo. Se debe corregir y reenviar. |
| **Archivada** | Histórico, sin acciones disponibles. |

---

## Paso a paso

### 1. Crear una malla

1. En el sidebar, haz clic en **Programación** (icono de calendario).
2. Clic en el botón **"+"** (esquina superior del panel lateral).
3. Completa el formulario:

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| **Nombre** | Identificador de la malla | `Malla Marzo 2026` |
| **Tipo de período** | Duración del ciclo | Mensual |
| **Fecha inicio** | Primer día del período | `2026-03-01` |
| **Fecha fin** | Último día del período | `2026-03-31` |
| **Notas** | Observaciones opcionales | `Semana Santa incluida` |

4. Clic en **"Crear malla"**. Aparecerá en el panel lateral con estado **Borrador**.

---

### 2. Asignar turnos en el grid

El grid muestra **trabajadores en filas** y **días en columnas**. Los fines de semana aparecen en azul claro.

**Para asignar un turno:**
1. Haz clic en la celda del trabajador y día deseado.
2. En el modal selecciona:
   - El **trabajador** (se puede cambiar en la misma celda).
   - El **tipo de turno**.
3. Clic en **"Guardar"**.

**Para modificar un turno existente:**
- Clic sobre la celda con turno asignado → cambia el tipo → **"Guardar"**.

**Para quitar un turno:**
- Clic sobre la celda con turno asignado → botón **"Quitar"**.

#### Tipos de turno disponibles

| Turno | Horas | Color | Descripción |
|-------|-------|-------|-------------|
| **Mañana** | 6h | 🟡 Amarillo | Turno diurno matutino |
| **Tarde** | 6h | 🔵 Azul | Turno diurno vespertino |
| **Noche 6h** | 6h | 🟣 Morado | Turno nocturno corto |
| **Noche 12h** | 12h | 🔷 Índigo | Turno nocturno largo |
| **Descanso** | 0h | ⚪ Gris | Día libre |
| **Especial** | 6h | 🟢 Verde | Turno personalizado |

> La columna **"Total h"** al final del grid suma las horas trabajadas por cada empleado en todo el período.

---

### 3. Validar la malla

> **Rol requerido:** `PLANIFICADOR` o `ADMIN`

1. Clic en el botón **"Validar"** en la cabecera de la malla.
2. El motor de validación revisa **5 reglas** automáticamente:

#### Reglas de validación

| Regla | Descripción | Severidad |
|-------|-------------|-----------|
| **Horas semanales** | Cada trabajador debe cumplir exactamente 36h por semana ISO | ⚠️ Advertencia |
| **Turnos consecutivos** | Máximo 3 turnos seguidos sin día de descanso | ❌ Error |
| **Descanso post-noche** | Después de Noche 12h → debe seguir Descanso. Después de Noche 6h → no puede seguir Mañana | ❌ Error |
| **Cobertura mínima** | Por día: Mañana ≥ 3 personas, Tarde ≥ 1, Noche ≥ 1 | ❌ Error |
| **Noche duplicada** | Un trabajador no puede tener Noche 6h y Noche 12h el mismo día | ❌ Error |

3. El **panel de violaciones** aparece debajo de la cabecera:
   - 🟢 **Sin violaciones** → malla válida.
   - 🔴 **Errores** → deben corregirse antes de enviar.
   - 🟡 **Advertencias** → recomendadas pero no bloquean el envío.

4. Corrige las celdas señaladas y vuelve a validar cuantas veces necesites.

---

### 4. Enviar a aprobación

> **Rol requerido:** `PLANIFICADOR` o `ADMIN`

1. Una vez satisfecho con la malla, clic en **"Enviar a aprobación"**.
2. El estado cambia a **Pendiente aprobación**.
3. El grid queda en **solo lectura** — ya no se pueden modificar turnos.

---

### 5. Aprobar la malla

> **Rol requerido:** `APROBADOR` o `ADMIN`

1. Selecciona la malla con estado **Pendiente aprobación** en el panel lateral.
2. Clic en **"Aprobar"**.
3. Estado cambia a **Aprobada** ✅. La malla queda archivada como definitiva.

---

### 6. Rechazar la malla

> **Rol requerido:** `APROBADOR` o `ADMIN`

1. Selecciona la malla con estado **Pendiente aprobación**.
2. Clic en **"Rechazar"**.
3. Escribe el **motivo del rechazo** en el modal.
4. Estado cambia a **Rechazada** ❌.

El planificador verá el motivo en la cabecera de la malla y podrá hacer los ajustes necesarios. Sin embargo, una malla rechazada no vuelve automáticamente a Borrador — se recomienda crear una nueva malla corregida.

---

## Cabecera de la malla

La cabecera muestra en todo momento:

- **Nombre** de la malla y **estado** con color
- **Período** (fechas de inicio y fin)
- **Quién la creó**
- **Motivo de rechazo** (si aplica)
- **Botones de acción** disponibles según tu rol y el estado actual

---

## Permisos por rol

| Acción | PLANIFICADOR | APROBADOR | ADMIN | SUPER_ADMIN |
|--------|:-----------:|:---------:|:-----:|:-----------:|
| Ver mallas | ✅ | ✅ | ✅ | ✅ |
| Crear malla | ✅ | ❌ | ✅ | ✅ |
| Asignar turnos | ✅ | ❌ | ✅ | ✅ |
| Validar | ✅ | ❌ | ✅ | ✅ |
| Enviar a aprobación | ✅ | ❌ | ✅ | ✅ |
| Aprobar/Rechazar | ❌ | ✅ | ✅ | ✅ |
| Eliminar malla | ✅ | ❌ | ✅ | ✅ |

---

## API REST — Endpoints disponibles

Base: `POST /api/schedules`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/schedules` | Listar todas las mallas |
| `POST` | `/schedules` | Crear nueva malla |
| `GET` | `/schedules/:id` | Detalle con asignaciones |
| `PUT` | `/schedules/:id` | Actualizar malla (solo DRAFT) |
| `DELETE` | `/schedules/:id` | Eliminar malla (solo DRAFT) |
| `POST` | `/schedules/:id/assignments/bulk` | Asignar turnos en lote |
| `PUT` | `/schedules/:id/assignments/:aId` | Modificar una asignación |
| `DELETE` | `/schedules/:id/assignments/:aId` | Eliminar una asignación |
| `POST` | `/schedules/:id/validate` | Ejecutar motor de validación |
| `POST` | `/schedules/:id/submit` | Enviar a aprobación |
| `POST` | `/schedules/:id/approve` | Aprobar malla |
| `POST` | `/schedules/:id/reject` | Rechazar malla |
| `GET` | `/schedules/:id/violations` | Listar violaciones |
| `GET` | `/schedules/:id/summary` | Resumen de horas y cobertura |

---

## Consejos de uso

- **Valida frecuentemente** mientras construyes la malla, no solo al final.
- Usa el tipo **Descanso** explícitamente en los días libres para que el motor calcule correctamente los turnos consecutivos.
- La columna **"Total h"** del grid te da una vista rápida de si algún trabajador está por encima o debajo de las 36h del período.
- Para períodos largos (mensual), es recomendable validar por semanas antes de enviar.
