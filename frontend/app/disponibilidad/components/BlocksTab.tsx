'use client';

import { TimeBlock } from '@/types';

interface Block {
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}

interface BlocksTabProps {
  blockForm: Block;
  setBlockForm: (form: Block) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  blocks: TimeBlock[];
}

export function BlocksTab({ blockForm, setBlockForm, onSubmit, isPending, blocks }: BlocksTabProps) {
  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="font-semibold mb-4">Bloquear Horario</h3>
        <form onSubmit={onSubmit} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Fecha</label>
            <input
              type="date"
              value={blockForm.date}
              onChange={(e) => setBlockForm({ ...blockForm, date: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hora Inicio</label>
            <input
              type="time"
              value={blockForm.startTime}
              onChange={(e) => setBlockForm({ ...blockForm, startTime: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hora Fin</label>
            <input
              type="time"
              value={blockForm.endTime}
              onChange={(e) => setBlockForm({ ...blockForm, endTime: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Motivo</label>
            <input
              type="text"
              value={blockForm.reason}
              onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Motivo del bloqueo"
            />
          </div>
          <div className="col-span-2 md:col-span-4">
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {isPending ? 'Bloqueando...' : 'Bloquear Horario'}
            </button>
          </div>
        </form>
      </div>

      {blocks.length > 0 && (
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold mb-4">Bloqueos Activos</h3>
          <div className="space-y-2">
            {blocks.map((block) => (
              <div key={block.id} className="flex justify-between items-center p-3 bg-red-50 rounded">
                <span className="font-medium">{block.date}</span>
                <span className="text-gray-600">
                  {block.startTime} - {block.endTime}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
