'use client';

import { DoctorSchedule } from '@/types';

interface ScheduleTabProps {
  scheduleForm: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    slotDuration: number;
  };
  setScheduleForm: (form: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  schedules: DoctorSchedule[];
}

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function ScheduleTab({ scheduleForm, setScheduleForm, onSubmit, isPending, schedules }: ScheduleTabProps) {
  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="font-semibold mb-4">Crear/Actualizar Horario</h3>
        <form onSubmit={onSubmit} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Día</label>
            <select
              value={scheduleForm.dayOfWeek}
              onChange={(e) => setScheduleForm({ ...scheduleForm, dayOfWeek: Number(e.target.value) })}
              className="w-full p-2 border rounded"
              required
            >
              {DAY_NAMES.map((day, idx) => (
                <option key={idx} value={idx}>{day}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hora Inicio</label>
            <input
              type="time"
              value={scheduleForm.startTime}
              onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hora Fin</label>
            <input
              type="time"
              value={scheduleForm.endTime}
              onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Duración (min)</label>
            <input
              type="number"
              value={scheduleForm.slotDuration}
              onChange={(e) => setScheduleForm({ ...scheduleForm, slotDuration: Number(e.target.value) })}
              className="w-full p-2 border rounded"
              min={15}
              max={120}
              required
            />
          </div>
          <div className="col-span-2 md:col-span-4">
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? 'Guardando...' : 'Guardar Horario'}
            </button>
          </div>
        </form>
      </div>

      {schedules.length > 0 && (
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold mb-4">Horarios Existentes</h3>
          <div className="space-y-2">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">{DAY_NAMES[schedule.dayOfWeek]}</span>
                <span className="text-gray-600">
                  {schedule.startTime} - {schedule.endTime} ({schedule.slotDuration} min)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
