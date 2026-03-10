'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { withAuth } from '@/components/auth/withAuth';
import { availabilityService } from '@/services/availability.service';
import { useAuthStore } from '@/store/auth';
import { UserRole, DoctorSchedule, TimeBlock, SlotStatus, AvailabilitySlot } from '@/types';
import { Clock, Calendar, Ban } from 'lucide-react';

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const SLOT_COLORS: Record<SlotStatus, string> = {
  FREE: 'bg-green-100 border-green-300 text-green-800',
  BOOKED: 'bg-blue-100 border-blue-300 text-blue-800',
  BLOCKED: 'bg-gray-200 border-gray-400 text-gray-500',
};

function MyScheduleView() {
  const { user } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const doctorId = user?.id ?? '';

  // Doctor's weekly schedule
  const { data: schedules = [] } = useQuery<DoctorSchedule[]>({
    queryKey: ['my-schedule', doctorId],
    queryFn: () => availabilityService.getScheduleByDoctor(doctorId),
    enabled: !!doctorId,
  });

  // Blocks (from today)
  const { data: blocks = [] } = useQuery<TimeBlock[]>({
    queryKey: ['my-blocks', doctorId],
    queryFn: () => availabilityService.getBlocksByDoctor(doctorId, new Date().toISOString().split('T')[0]),
    enabled: !!doctorId,
  });

  // Availability slots for selected date
  const { data: slotsData, isLoading: loadingSlots } = useQuery({
    queryKey: ['my-slots', doctorId, selectedDate],
    queryFn: () => availabilityService.getSlots(doctorId, selectedDate),
    enabled: !!doctorId && !!selectedDate,
  });

  // Build weekly overview — current week Mon → Sun
  const getWeekDays = () => {
    const today = new Date();
    const day = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };

  const weekDays = getWeekDays();
  const scheduledDays = new Set(schedules.map((s) => s.dayOfWeek));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi Horario</h1>
          <p className="text-gray-500 mt-1">Tu agenda y disponibilidad configurada por el sistema</p>
        </div>

        {/* Weekly schedule overview */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock size={18} className="text-blue-600" />
            Horario semanal
          </h2>
          {schedules.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <p className="text-yellow-800 font-medium">No tienes horario configurado</p>
              <p className="text-yellow-600 text-sm mt-1">Contacta al administrador para configurar tu horario laboral</p>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {DAY_NAMES.map((dayName, idx) => {
                const schedule = schedules.find((s) => s.dayOfWeek === idx);
                return (
                  <div key={idx}
                    className={`p-3 rounded-lg border text-center ${schedule ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                    <p className="text-xs font-medium text-gray-600">{DAY_SHORT[idx]}</p>
                    {schedule ? (
                      <>
                        <p className="text-xs font-bold text-blue-800 mt-1">{schedule.startTime}</p>
                        <p className="text-xs text-blue-600">{schedule.endTime}</p>
                        <p className="text-xs text-blue-400 mt-0.5">{schedule.slotDuration}min</p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-400 mt-1">Libre</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* This week view + slot picker */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Week days */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-purple-600" />
              Esta semana
            </h2>
            <div className="space-y-2">
              {weekDays.map((d) => {
                const dateStr = d.toISOString().split('T')[0];
                const dow = d.getDay();
                const hasSchedule = scheduledDays.has(dow);
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === new Date().toISOString().split('T')[0];

                return (
                  <button key={dateStr} onClick={() => setSelectedDate(dateStr)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all
                      ${isSelected ? 'bg-blue-600 text-white border-blue-600' : hasSchedule ? 'hover:bg-blue-50 border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                        {DAY_SHORT[dow]}
                      </span>
                      <span className={`text-sm ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                        {d.getDate()}/{d.getMonth() + 1}
                      </span>
                      {isToday && <span className="text-xs bg-green-100 text-green-700 px-1.5 rounded">hoy</span>}
                    </div>
                    {hasSchedule ? (
                      <span className={`text-xs ${isSelected ? 'text-blue-100' : 'text-blue-600'}`}>✓</span>
                    ) : (
                      <span className={`text-xs ${isSelected ? 'text-blue-200' : 'text-gray-400'}`}>libre</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slots for selected date */}
          <div className="lg:col-span-2 bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-CO', {
                  weekday: 'long', day: 'numeric', month: 'long',
                })}
              </h2>
              {slotsData?.summary && (
                <div className="flex gap-3 text-xs">
                  <span className="text-green-700 font-medium">{slotsData.summary.free} libre</span>
                  <span className="text-blue-700 font-medium">{slotsData.summary.booked} cita</span>
                  <span className="text-gray-600 font-medium">{slotsData.summary.blocked} bloqueo</span>
                </div>
              )}
            </div>

            {loadingSlots ? (
              <div className="text-center py-8 text-gray-400">Cargando...</div>
            ) : !slotsData?.hasSchedule ? (
              <div className="text-center py-8 text-gray-400">
                <Ban size={32} className="mx-auto mb-2 opacity-40" />
                <p className="font-medium">Sin horario</p>
                <p className="text-sm">No trabajas este día</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {slotsData.slots.map((slot: AvailabilitySlot) => (
                  <div key={slot.time}
                    title={
                      slot.status === SlotStatus.BOOKED
                        ? `${slot.patientName}${slot.reason ? ' — ' + slot.reason : ''}`
                        : slot.status === SlotStatus.BLOCKED
                        ? `Bloqueado${slot.blockReason ? ': ' + slot.blockReason : ''}`
                        : 'Disponible'
                    }
                    className={`p-2 rounded border text-center text-xs font-medium ${SLOT_COLORS[slot.status]}`}>
                    <div>{slot.time}</div>
                    {slot.status === SlotStatus.BOOKED && (
                      <div className="mt-0.5 truncate text-blue-700 font-normal">{slot.patientName?.split(' ')[0]}</div>
                    )}
                    {slot.status === SlotStatus.BLOCKED && <div>🔒</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming blocks */}
        {blocks.length > 0 && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Ban size={18} className="text-red-600" />
              Bloqueos próximos
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {blocks.map((b) => (
                <div key={b.id} className="p-3 bg-red-50 border border-red-100 rounded-lg">
                  <p className="font-medium text-gray-900">
                    {new Date(b.date + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                  <p className="text-sm text-gray-600">{b.startTime} — {b.endTime}</p>
                  {b.reason && <p className="text-xs text-gray-500 mt-0.5">📌 {b.reason}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default withAuth(MyScheduleView, [UserRole.DOCTOR]);
