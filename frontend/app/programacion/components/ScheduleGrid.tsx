'use client';

import { useMemo } from 'react';
import type {
  ShiftAssignment,
  WorkSchedule,
  ShiftType,
} from '../../../types/schedule.types';
import { SHIFT_LABELS, SHIFT_COLORS } from '../../../types/schedule.types';

interface Props {
  schedule: WorkSchedule;
  onCellClick?: (userId: string, date: string, current?: ShiftAssignment) => void;
  readOnly?: boolean;
}

export function ScheduleGrid({ schedule, onCellClick, readOnly = false }: Props) {
  const { dates, workers, assignmentMap } = useMemo(() => {
    const assignments = schedule.assignments ?? [];

    // Obtener fechas únicas en el rango
    const start = new Date(schedule.startDate);
    const end = new Date(schedule.endDate);
    const datesArr: Date[] = [];
    const cur = new Date(start);
    cur.setUTCHours(0, 0, 0, 0);
    const endCopy = new Date(end);
    endCopy.setUTCHours(0, 0, 0, 0);
    while (cur <= endCopy) {
      datesArr.push(new Date(cur));
      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    // Obtener trabajadores únicos
    const workerMap = new Map<string, { id: string; name: string }>();
    for (const a of assignments) {
      if (a.user && !workerMap.has(a.userId)) {
        workerMap.set(a.userId, {
          id: a.userId,
          name: `${a.user.firstName} ${a.user.lastName}`,
        });
      }
    }

    // Mapa de asignaciones: userId-dateStr → ShiftAssignment
    const map = new Map<string, ShiftAssignment>();
    for (const a of assignments) {
      const key = `${a.userId}-${new Date(a.assignmentDate).toISOString().split('T')[0]}`;
      map.set(key, a);
    }

    return {
      dates: datesArr,
      workers: Array.from(workerMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
      assignmentMap: map,
    };
  }, [schedule]);

  if (workers.length === 0 || dates.length === 0) {
    return (
      <div className="text-center text-gray-400 py-16">
        <p className="text-lg">Sin asignaciones. Agrega trabajadores y turnos.</p>
      </div>
    );
  }

  const formatDayHeader = (d: Date) => {
    const day = d.toLocaleDateString('es-CO', { weekday: 'short', timeZone: 'UTC' });
    const num = d.getUTCDate();
    return { day: day.charAt(0).toUpperCase() + day.slice(1), num };
  };

  const isWeekend = (d: Date) => {
    const dow = d.getUTCDay();
    return dow === 0 || dow === 6;
  };

  return (
    <div className="overflow-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full text-sm border-collapse">
        {/* Encabezado */}
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-gray-50 border-b border-r border-gray-200 px-3 py-2 text-left font-semibold text-gray-600 min-w-[160px]">
              Trabajador
            </th>
            {dates.map((d) => {
              const { day, num } = formatDayHeader(d);
              const weekend = isWeekend(d);
              return (
                <th
                  key={d.toISOString()}
                  className={`border-b border-r border-gray-200 px-1 py-2 text-center font-medium min-w-[72px] ${
                    weekend ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600'
                  }`}
                >
                  <div className="text-xs">{day}</div>
                  <div className="text-sm font-bold">{num}</div>
                </th>
              );
            })}
            <th className="border-b border-gray-200 px-3 py-2 text-center font-semibold text-gray-600 min-w-[80px] bg-gray-50">
              Total h
            </th>
          </tr>
        </thead>

        {/* Cuerpo */}
        <tbody>
          {workers.map((w, wi) => {
            let totalHours = 0;
            return (
              <tr key={w.id} className={wi % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                <td className="sticky left-0 z-10 bg-inherit border-b border-r border-gray-200 px-3 py-1.5 font-medium text-gray-800">
                  {w.name}
                </td>
                {dates.map((d) => {
                  const dateStr = d.toISOString().split('T')[0];
                  const key = `${w.id}-${dateStr}`;
                  const assignment = assignmentMap.get(key);
                  if (assignment) totalHours += assignment.hoursWorked;
                  const shiftType = assignment?.shiftType as ShiftType | undefined;

                  return (
                    <td
                      key={dateStr}
                      className={`border-b border-r border-gray-200 px-1 py-1 text-center ${
                        !readOnly ? 'cursor-pointer hover:ring-2 hover:ring-indigo-400 hover:ring-inset' : ''
                      } ${isWeekend(d) ? 'bg-blue-50/30' : ''}`}
                      onClick={() =>
                        !readOnly && onCellClick?.(w.id, dateStr, assignment)
                      }
                    >
                      {shiftType && shiftType !== 'DAY_OFF' ? (
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium border ${SHIFT_COLORS[shiftType]}`}
                        >
                          {SHIFT_LABELS[shiftType]}
                        </span>
                      ) : shiftType === 'DAY_OFF' ? (
                        <span className="text-gray-300 text-xs">—</span>
                      ) : (
                        <span className="text-gray-200 text-xs">·</span>
                      )}
                    </td>
                  );
                })}
                <td className="border-b border-gray-200 px-3 py-1.5 text-center font-bold text-gray-700">
                  {totalHours}h
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
