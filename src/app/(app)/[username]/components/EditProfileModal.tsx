'use client';

import { useState, useRef } from 'react';
import { 
  XMarkIcon,
  UserIcon,
  BriefcaseIcon,
  EnvelopeIcon,
  TagIcon,
} from '@/components/icons/heroicons-shim';
import { cn } from '@/lib/utils';
import { GeneralTab, WorkEducationTab, ContactTab, InterestsTab } from './EditProfile';

type TabType = 'general' | 'work-education' | 'contact' | 'interests';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: {
    username: string;
    displayName: string;
    bio?: string;
    location?: string;
    work?: string;
    education?: string;
    relationship?: string;
    coverPhoto?: string | null;
    profilePhoto?: string | null;
    email?: string;
    phone?: string;
    website?: string;
    languages?: string[];
    interests?: string[];
  };
  onSave: (updatedProfile: any) => void;
  initialTab?: TabType;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  currentProfile,
  onSave,
  initialTab,
}: EditProfileModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab ?? 'general');
  const [formData, setFormData] = useState(currentProfile);
  const [coverPreview, setCoverPreview] = useState<string | null>(currentProfile.coverPhoto || null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentProfile.profilePhoto || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const tabs = [
    { id: 'general' as TabType, label: 'General', icon: UserIcon },
    { id: 'work-education' as TabType, label: 'Trabajo y Educación', icon: BriefcaseIcon },
    { id: 'contact' as TabType, label: 'Contacto', icon: EnvelopeIcon },
    { id: 'interests' as TabType, label: 'Intereses', icon: TagIcon },
  ];

  const handleFormChange = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Solo enviar los campos que el backend acepta
      // NO incluir coverPhoto ni profilePhoto por ahora (causan PayloadTooLargeError)
      const updateData = {
        firstName: formData.displayName?.split(' ')[0], // Extraer nombre
        lastName: formData.displayName?.split(' ').slice(1).join(' '), // Extraer apellido
        bio: formData.bio,
        city: formData.location,
        phone: formData.phone,
        website: formData.website,
        // TODO: Agregar más campos cuando el backend los soporte
      };

      // Filtrar valores undefined
      const cleanData = Object.fromEntries(
        Object.entries(updateData).filter(([_, v]) => v !== undefined && v !== '')
      );

      await onSave(cleanData);
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
              Editar perfil
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 px-4 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-all duration-200",
                    activeTab === tab.id
                      ? "text-primary-600 dark:text-primary-500 border-primary-600 dark:border-primary-500"
                      : "text-neutral-600 dark:text-neutral-400 border-transparent hover:text-neutral-900 dark:hover:text-neutral-200"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="p-6 space-y-6">
            
            {/* TAB: GENERAL */}
            {activeTab === 'general' && (
              <GeneralTab
                formData={formData}
                coverPreview={coverPreview}
                avatarPreview={avatarPreview}
                onFormChange={handleFormChange}
              />
            )}

            {/* TAB: TRABAJO Y EDUCACIÓN */}
            {activeTab === 'work-education' && (
              <WorkEducationTab
                formData={formData}
                onFormChange={handleFormChange}
              />
            )}

            {/* TAB: CONTACTO */}
            {activeTab === 'contact' && (
              <ContactTab
                formData={formData}
                onFormChange={handleFormChange}
              />
            )}

            {/* TAB: INTERESES */}
            {activeTab === 'interests' && (
              <InterestsTab
                formData={formData}
                onFormChange={handleFormChange}
              />
            )}

          </div>

          {/* Footer */}
          <div className="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl font-semibold hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "px-8 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all disabled:opacity-50",
                isSubmitting && "cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Guardando...
                </span>
              ) : (
                'Guardar cambios'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
