import { GlobeAltIcon, HeartIcon } from '@/components/icons/heroicons-shim';
import Avatar from '@/ui/Avatar';

interface GeneralTabProps {
  formData: {
    displayName: string;
    bio?: string;
    location?: string;
    relationship?: string;
    coverPhoto?: string | null;
    profilePhoto?: string | null;
  };
  coverPreview: string | null;
  avatarPreview: string | null;
  onFormChange: (updates: Partial<GeneralTabProps['formData']>) => void;
}

export function GeneralTab({
  formData,
  coverPreview,
  avatarPreview,
  onFormChange,
}: GeneralTabProps) {
  return (
    <>
      {/* Cover Photo Section - DISABLED TEMPORARILY */}
      <div className="opacity-50 pointer-events-none">
        <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-3">
          Foto de portada
          <span className="ml-2 text-xs text-amber-600 dark:text-amber-500 font-normal">
            (Próximamente disponible)
          </span>
        </label>
        <div className="relative group">
          <div className="relative h-48 rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800">
            {coverPreview ? (
              <img
                src={coverPreview}
                alt="Cover preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500" />
            )}
          </div>
        </div>
      </div>

      {/* Avatar Section - DISABLED TEMPORARILY */}
      <div className="opacity-50 pointer-events-none">
        <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-3">
          Foto de perfil
          <span className="ml-2 text-xs text-amber-600 dark:text-amber-500 font-normal">
            (Próximamente disponible)
          </span>
        </label>
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-neutral-900 shadow-lg">
              <Avatar
                className="w-full h-full"
                src={avatarPreview}
                initials={formData.displayName?.slice(0, 2).toUpperCase()}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-neutral-200 dark:border-neutral-800 pt-6">
        {/* Display Name */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
            Nombre completo
          </label>
          <input
            type="text"
            value={formData.displayName}
            onChange={(e) => onFormChange({ displayName: e.target.value })}
            className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 dark:text-white"
            placeholder="Tu nombre completo"
          />
        </div>

        {/* Bio */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
            Biografía
          </label>
          <textarea
            value={formData.bio || ''}
            onChange={(e) => onFormChange({ bio: e.target.value })}
            rows={3}
            maxLength={150}
            className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 dark:text-white resize-none"
            placeholder="Cuéntanos un poco sobre ti..."
          />
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 text-right">
            {formData.bio?.length || 0}/150
          </p>
        </div>

        {/* Location */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
            <GlobeAltIcon className="w-4 h-4 inline-block mr-1" />
            Ubicación
          </label>
          <input
            type="text"
            value={formData.location || ''}
            onChange={(e) => onFormChange({ location: e.target.value })}
            className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 dark:text-white"
            placeholder="Ciudad, País"
          />
        </div>

        {/* Relationship */}
        <div>
          <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
            <HeartIcon className="w-4 h-4 inline-block mr-1" />
            Estado civil
          </label>
          <select
            value={formData.relationship || ''}
            onChange={(e) => onFormChange({ relationship: e.target.value })}
            className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 dark:text-white"
          >
            <option value="">Seleccionar...</option>
            <option value="Soltero/a">Soltero/a</option>
            <option value="En una relación">En una relación</option>
            <option value="Comprometido/a">Comprometido/a</option>
            <option value="Casado/a">Casado/a</option>
            <option value="Es complicado">Es complicado</option>
          </select>
        </div>
      </div>
    </>
  );
}
