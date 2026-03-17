'use client';

import { AvailabilitySlot, SlotStatus } from '@/types';

interface SlotsTabProps {
  slots: AvailabilitySlot[];
  isLoading: boolean;
  selectedDate: string;
  onDateChange: (date: string) => void;
}

const SLOT_COLORS: Record<SlotStatus, string> = {
  FREE: 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200 cursor-pointer',
  BOOKED: 'bg-blue-100 border-blue-300 text-blue-800 cursor-not-allowed opacity-80',
  BLOCKED: 'bg-gray-300 border-gray-400 text-gray-600 cursor-not-allowed opacity-80',
};

const SLOT_STATUS_LABELS: Record<SlotStatus, string> = {
  FREE: 'Disponible',
  BOOKED: 'Ocupado',
  BLOCKED: 'Bloqueado',
};

export function SlotsTab({ slots, isLoading, selectedDate, onDateChange }: SlotsTabProps) {
  if (isLoading) {
    return <div className="p-4 text-center">Cargando horarios...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm font-medium">Fecha:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="p-2 border rounded"
          />
        </div>

        {slots.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay horarios disponibles para esta fecha</p>
        ) : (
          <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-2">
            {slots.map((slot) => (
              <div
                key={slot.startTime}
                className={`p-2 text-center text-sm rounded border ${SLOT_COLORS[slot.status]}`}
                title={`${slot.startTime} - ${SLOT_STATUS_LABELS[slot.status]}`}
              >
                <div className="font-medium">{slot.startTime}</div>
                <div className="text-xs">{SLOT_STATUS_LABELS[slot.status]}</div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
            <span>Ocupado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-300 border border-gray-400 rounded"></div>
            <span>Bloqueado</span>
          </div>
        </div>
      </div>
    </div>
  );
}
