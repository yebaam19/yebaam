'use client';

import { useState, useEffect } from 'react';
import { FamilyMember } from './types';
import { XMarkIcon, ArrowUpTrayIcon, UserIcon } from '@/components/icons/heroicons-shim';
import Image from 'next/image';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Omit<FamilyMember, 'id'>) => void;
  existingMember?: FamilyMember | null;
  relativeToId?: string | null;
}

export function AddMemberModal({
  isOpen,
  onClose,
  onSave,
  existingMember,
  relativeToId,
}: AddMemberModalProps) {
  const [formData, setFormData] = useState<Omit<FamilyMember, 'id'>>({
    name: '',
    photo: '',
    birthYear: undefined,
    deathYear: undefined,
    gender: 'male',
    relationship: 'parent',
    generation: -1,
    parents: [],
  });

  const [photoPreview, setPhotoPreview] = useState<string>('');

  useEffect(() => {
    if (existingMember) {
      setFormData(existingMember);
      setPhotoPreview(existingMember.photo || '');
    }
  }, [existingMember]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      name: '',
      photo: '',
      birthYear: undefined,
      deathYear: undefined,
      gender: 'male',
      relationship: 'parent',
      generation: -1,
      parents: [],
    });
    setPhotoPreview('');
    onClose();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPhotoPreview(result);
        setFormData((prev) => ({ ...prev, photo: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {existingMember ? 'Editar Familiar' : 'Agregar Familiar'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Photo Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 dark:border-gray-700">
              {photoPreview ? (
                <Image
                  src={photoPreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                  <UserIcon className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>
            <label className="cursor-pointer">
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                <ArrowUpTrayIcon className="w-5 h-5" />
                <span>Subir Foto</span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre Completo *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: María García López"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Género *
            </label>
            <div className="flex gap-4">
              {['male', 'female', 'other'].map((gender) => (
                <label key={gender} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value={gender}
                    checked={formData.gender === gender}
                    onChange={(e) => setFormData((prev) => ({ ...prev, gender: e.target.value as any }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    {gender === 'male' ? 'Masculino' : gender === 'female' ? 'Femenino' : 'Otro'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Relationship */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Relación *
            </label>
            <select
              required
              value={formData.relationship}
              onChange={(e) => {
                const relationship = e.target.value as any;
                let generation = 0;
                if (relationship === 'parent') generation = -1;
                if (relationship === 'grandparent') generation = -2;
                if (relationship === 'child') generation = 1;
                if (relationship === 'grandchild') generation = 2;
                setFormData((prev) => ({ ...prev, relationship, generation }));
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="parent">Padre/Madre</option>
              <option value="grandparent">Abuelo/a</option>
              <option value="sibling">Hermano/a</option>
              <option value="spouse">Cónyuge</option>
              <option value="child">Hijo/a</option>
              <option value="grandchild">Nieto/a</option>
            </select>
          </div>

          {/* Birth Year */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Año de Nacimiento
              </label>
              <input
                type="number"
                min="1800"
                max={new Date().getFullYear()}
                value={formData.birthYear || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    birthYear: e.target.value ? parseInt(e.target.value) : undefined,
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="1990"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Año de Fallecimiento
              </label>
              <input
                type="number"
                min="1800"
                max={new Date().getFullYear()}
                value={formData.deathYear || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    deathYear: e.target.value ? parseInt(e.target.value) : undefined,
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Opcional"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              {existingMember ? 'Guardar Cambios' : 'Agregar Familiar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
