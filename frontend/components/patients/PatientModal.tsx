'use client';

import { useState, useEffect } from 'react';
import { Patient, DocumentType } from '@/types';

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  patient?: Patient | null;
  institutions?: Array<{ id: string; name: string }>;
  isSuperAdmin?: boolean;
}

export default function PatientModal({
  isOpen,
  onClose,
  onSubmit,
  patient,
  institutions = [],
  isSuperAdmin = false,
}: PatientModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    documentType: DocumentType.CC,
    documentNumber: '',
    email: '',
    phone: '',
    birthDate: '',
    gender: '',
    address: '',
    institutionId: '',
  });

  useEffect(() => {
    if (patient) {
      setFormData({
        firstName: patient.firstName,
        lastName: patient.lastName,
        documentType: patient.documentType,
        documentNumber: patient.documentNumber,
        email: patient.email || '',
        phone: patient.phone || '',
        birthDate: patient.birthDate ? patient.birthDate.split('T')[0] : '',
        gender: patient.gender || '',
        address: patient.address || '',
        institutionId: patient.institutionId,
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        documentType: DocumentType.CC,
        documentNumber: '',
        email: '',
        phone: '',
        birthDate: '',
        gender: '',
        address: '',
        institutionId: '',
      });
    }
  }, [patient]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Si estamos editando, excluir campos inmutables
    const cleanedData: any = {};
    
    if (patient) {
      // Modo edición - solo campos permitidos para actualización
      cleanedData.firstName = formData.firstName;
      cleanedData.lastName = formData.lastName;
      
      if (formData.email && formData.email.trim()) {
        cleanedData.email = formData.email.trim();
      }
      
      if (formData.phone && formData.phone.trim()) {
        cleanedData.phone = formData.phone.trim();
      }
      
      if (formData.birthDate && formData.birthDate.trim()) {
        const dateValue = formData.birthDate.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
          cleanedData.birthDate = dateValue;
        } else {
          const date = new Date(dateValue);
          if (!isNaN(date.getTime())) {
            cleanedData.birthDate = date.toISOString().split('T')[0];
          }
        }
      }
      
      if (formData.gender && formData.gender.trim()) {
        cleanedData.gender = formData.gender;
      }
      
      if (formData.address && formData.address.trim()) {
        cleanedData.address = formData.address.trim();
      }
    } else {
      // Modo creación - incluir todos los campos necesarios
      cleanedData.firstName = formData.firstName;
      cleanedData.lastName = formData.lastName;
      cleanedData.documentType = formData.documentType;
      cleanedData.documentNumber = formData.documentNumber;

      if (formData.email && formData.email.trim()) {
        cleanedData.email = formData.email.trim();
      }
      
      if (formData.phone && formData.phone.trim()) {
        cleanedData.phone = formData.phone.trim();
      }
      
      if (formData.birthDate && formData.birthDate.trim()) {
        const dateValue = formData.birthDate.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
          cleanedData.birthDate = dateValue;
        } else {
          const date = new Date(dateValue);
          if (!isNaN(date.getTime())) {
            cleanedData.birthDate = date.toISOString().split('T')[0];
          }
        }
      }
      
      if (formData.gender && formData.gender.trim()) {
        cleanedData.gender = formData.gender;
      }
      
      if (formData.address && formData.address.trim()) {
        cleanedData.address = formData.address.trim();
      }
      
      if (formData.institutionId && formData.institutionId.trim()) {
        cleanedData.institutionId = formData.institutionId;
      }
    }

    console.log('Datos a enviar:', cleanedData);
    onSubmit(cleanedData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            {patient ? 'Editar Paciente' : 'Nuevo Paciente'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombres *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellidos *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Documento *
              </label>
              <select
                value={formData.documentType}
                onChange={(e) => setFormData({ ...formData, documentType: e.target.value as DocumentType })}
                required
                disabled={!!patient}
                className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
              >
                <option value={DocumentType.CC}>Cédula de Ciudadanía</option>
                <option value={DocumentType.TI}>Tarjeta de Identidad</option>
                <option value={DocumentType.CE}>Cédula de Extranjería</option>
                <option value={DocumentType.PA}>Pasaporte</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Documento *
              </label>
              <input
                type="text"
                value={formData.documentNumber}
                onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                required
                disabled={!!patient}
                className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Nacimiento
              </label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Género
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Seleccione...</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="O">Otro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {isSuperAdmin && !patient && institutions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Institución *
              </label>
              <select
                value={formData.institutionId}
                onChange={(e) => setFormData({ ...formData, institutionId: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Seleccione una institución...</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              {patient ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
