import { useTranslations } from 'next-intl';
import { FC, useState } from 'react';
import { EnvelopeIcon, PhoneIcon, GlobeAltIcon, MapPinIcon } from '@/components/icons/heroicons-shim';
import type { CreatePageDto, PageContact } from '../../types/page.types';
import { validateEmail, validatePhone, validateUrl } from '../../utils/pageHelpers';

interface CreatePageStep4Props {
  data: Partial<CreatePageDto>;
  onUpdate: (data: Partial<CreatePageDto>) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export const CreatePageStep4: FC<CreatePageStep4Props> = ({
  data,
  onUpdate,
  onSubmit,
  onBack,
  isSubmitting,
}) => {
  const t = useTranslations('pages.create.step4');
  const [contact, setContact] = useState<PageContact>(data.contact || {});
  const [errors, setErrors] = useState<{
    email?: string;
    phone?: string;
    website?: string;
  }>({});

  // Privacidad por Defecto (Macro Reglamento Art. 2): nace 'restricted'; abrir al
  // público es una elección explícita y consciente del titular aquí.
  const privacy = data.privacy ?? 'restricted';

  const handleSimpleChange = (field: 'email' | 'phone' | 'website', value: string) => {
    const newContact = { ...contact, [field]: value };
    setContact(newContact);

    // Validación en tiempo real
    const newErrors = { ...errors };
    if (value.trim()) {
      if (field === 'email') {
        if (!validateEmail(value)) {
          newErrors.email = t('emailError');
        } else {
          delete newErrors.email;
        }
      } else if (field === 'phone') {
        if (!validatePhone(value)) {
          newErrors.phone = t('phoneError');
        } else {
          delete newErrors.phone;
        }
      } else if (field === 'website') {
        if (!validateUrl(value)) {
          newErrors.website = t('websiteError');
        } else {
          delete newErrors.website;
        }
      }
    } else {
      delete newErrors[field];
    }
    setErrors(newErrors);
  };

  const handleAddressChange = (field: keyof NonNullable<PageContact['address']>, value: string) => {
    setContact(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  const handleSubmit = () => {
    // Validación final
    const hasErrors = Object.keys(errors).length > 0;
    if (hasErrors) {
      return;
    }

    // Filtrar campos vacíos
    const filteredContact: PageContact = {};

    // Campos simples
    if (contact.email?.trim()) filteredContact.email = contact.email.trim();
    if (contact.phone?.trim()) filteredContact.phone = contact.phone.trim();
    if (contact.website?.trim()) filteredContact.website = contact.website.trim();

    // Address - solo incluir si tiene al menos un campo
    if (contact.address) {
      const address: NonNullable<PageContact['address']> = {};
      if (contact.address.street?.trim()) address.street = contact.address.street.trim();
      if (contact.address.city?.trim()) address.city = contact.address.city.trim();
      if (contact.address.state?.trim()) address.state = contact.address.state.trim();
      if (contact.address.country?.trim()) address.country = contact.address.country.trim();
      if (contact.address.zipCode?.trim()) address.zipCode = contact.address.zipCode.trim();

      if (Object.keys(address).length > 0) {
        filteredContact.address = address;
      }
    }

    onUpdate({
      ...(Object.keys(filteredContact).length > 0 && { contact: filteredContact }),
    });
    onSubmit();
  };

  const hasValidationErrors = Object.keys(errors).length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {t('heading')}
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('subtitle')}
        </p>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <EnvelopeIcon className="w-4 h-4 inline mr-1" />
          {t('emailLabel')}
        </label>
        <input
          id="contact-email"
          type="email"
          value={contact.email || ''}
          onChange={(e) => handleSimpleChange('email', e.target.value)}
          placeholder={t('emailPlaceholder')}
          className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email}</p>
        )}
      </div>

      {/* Teléfono */}
      <div>
        <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <PhoneIcon className="w-4 h-4 inline mr-1" />
          {t('phoneLabel')}
        </label>
        <input
          id="contact-phone"
          type="tel"
          value={contact.phone || ''}
          onChange={(e) => handleSimpleChange('phone', e.target.value)}
          placeholder={t('phonePlaceholder')}
          className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {errors.phone && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.phone}</p>
        )}
      </div>

      {/* Sitio web */}
      <div>
        <label htmlFor="contact-website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <GlobeAltIcon className="w-4 h-4 inline mr-1" />
          {t('websiteLabel')}
        </label>
        <input
          id="contact-website"
          type="url"
          value={contact.website || ''}
          onChange={(e) => handleSimpleChange('website', e.target.value)}
          placeholder={t('websitePlaceholder')}
          className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {errors.website && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.website}</p>
        )}
      </div>

      {/* Dirección */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <MapPinIcon className="w-4 h-4 inline mr-1" />
          {t('addressLabel')}
        </label>
        <div className="space-y-3">
          <input
            type="text"
            value={contact.address?.street || ''}
            onChange={(e) => handleAddressChange('street', e.target.value)}
            placeholder={t('streetPlaceholder')}
            className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={contact.address?.city || ''}
              onChange={(e) => handleAddressChange('city', e.target.value)}
              placeholder={t('cityPlaceholder')}
              className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              value={contact.address?.state || ''}
              onChange={(e) => handleAddressChange('state', e.target.value)}
              placeholder={t('statePlaceholder')}
              className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={contact.address?.country || ''}
              onChange={(e) => handleAddressChange('country', e.target.value)}
              placeholder={t('countryPlaceholder')}
              className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              value={contact.address?.zipCode || ''}
              onChange={(e) => handleAddressChange('zipCode', e.target.value)}
              placeholder={t('zipCodePlaceholder')}
              className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Privacidad (Macro Reglamento Art. 2): la página nace restringida; hacerla
          pública es una decisión explícita del titular. */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          ¿Quién puede ver esta página?
        </label>
        <div className="space-y-2">
          {(
            [
              {
                value: 'restricted' as const,
                title: 'Restringida (recomendada)',
                desc: 'Solo tú y tu equipo pueden verla mientras la preparas.',
              },
              {
                value: 'public' as const,
                title: 'Pública',
                desc: 'Cualquiera puede encontrarla y ver su contenido y datos de contacto.',
              },
            ]
          ).map((opt) => {
            const selected = privacy === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onUpdate({ privacy: opt.value })}
                className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                  selected
                    ? 'border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                    selected ? 'border-blue-600' : 'border-gray-400'
                  }`}
                >
                  {selected && <span className="h-2 w-2 rounded-full bg-blue-600" />}
                </span>
                <span>
                  <span className="block text-sm font-medium text-gray-900 dark:text-white">
                    {opt.title}
                  </span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">{opt.desc}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <p className="text-sm font-medium text-green-900 dark:text-green-200 mb-2">
          {t('summaryHeading')}
        </p>
        <div className="space-y-1 text-sm text-green-700 dark:text-green-300">
          <p>{t('summaryBasic')}</p>
          <p>{t('summaryCategory')}</p>
          {data.profileImageUrl && <p>✓ {t('summaryProfile')}</p>}
          {data.coverImageUrl && <p>✓ {t('summaryCover')}</p>}
          {(contact.email || contact.phone || contact.website || contact.address) && (
            <p>{t('summaryContact')}</p>
          )}
          <p>{privacy === 'public' ? '🌐 Pública' : '🔒 Restringida'}</p>
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('back')}
        </button>
        <button
          onClick={handleSubmit}
          disabled={hasValidationErrors || isSubmitting}
          className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? t('submitting') : t('submit')}
        </button>
      </div>
    </div>
  );
};
