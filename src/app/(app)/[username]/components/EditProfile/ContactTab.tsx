import { EnvelopeIcon, PhoneIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

interface ContactTabProps {
  formData: {
    email?: string;
    phone?: string;
    website?: string;
  };
  onFormChange: (updates: Partial<ContactTabProps['formData']>) => void;
}

export function ContactTab({
  formData,
  onFormChange,
}: ContactTabProps) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
          <EnvelopeIcon className="w-4 h-4 inline-block mr-1" />
          Email
        </label>
        <input
          type="email"
          value={formData.email || ''}
          onChange={(e) => onFormChange({ email: e.target.value })}
          className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 dark:text-white"
          placeholder="tu@email.com"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
          <PhoneIcon className="w-4 h-4 inline-block mr-1" />
          Teléfono
        </label>
        <input
          type="tel"
          value={formData.phone || ''}
          onChange={(e) => onFormChange({ phone: e.target.value })}
          className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 dark:text-white"
          placeholder="+57 300 123 4567"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
          <GlobeAltIcon className="w-4 h-4 inline-block mr-1" />
          Sitio web
        </label>
        <input
          type="url"
          value={formData.website || ''}
          onChange={(e) => onFormChange({ website: e.target.value })}
          className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 dark:text-white"
          placeholder="https://tusitio.com"
        />
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          💡 <strong>Privacidad:</strong> Puedes controlar quién ve tu información de contacto desde la configuración de privacidad.
        </p>
      </div>
    </div>
  );
}
