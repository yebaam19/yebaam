import { FC } from 'react';
import { useTranslations } from 'next-intl';
import { TextField } from './TextField';
import type { GeneralFormData } from './form';

interface ContactFieldsProps {
  form: GeneralFormData;
  setField: <K extends keyof GeneralFormData>(key: K, value: GeneralFormData[K]) => void;
}

/**
 * §3 Información del Perfil — correo, teléfono, sitio web, país y ciudad.
 * País/Ciudad son campos dedicados (antes se colapsaban en un textarea "address"
 * con pérdida de estructura). No se solicitan datos sensibles (Art. 10 Manual).
 */
export const ContactFields: FC<ContactFieldsProps> = ({ form, setField }) => {
  const t = useTranslations('pages.settings.general');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-4">
      <h3 className="text-base font-medium text-gray-900 dark:text-white">
        {t('contactInfo')}
      </h3>

      <TextField
        id="email"
        label={t('emailLabel')}
        value={form.email}
        onChange={(v) => setField('email', v)}
        type="email"
        placeholder={t('emailPlaceholder')}
      />

      <TextField
        id="phone"
        label={t('phoneLabel')}
        value={form.phone}
        onChange={(v) => setField('phone', v)}
        type="tel"
        placeholder={t('phonePlaceholder')}
      />

      <TextField
        id="website"
        label={t('websiteLabel')}
        value={form.website}
        onChange={(v) => setField('website', v)}
        type="url"
        placeholder={t('websitePlaceholder')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField
          id="country"
          label="País"
          value={form.country}
          onChange={(v) => setField('country', v)}
          maxLength={80}
          placeholder="Colombia"
        />
        <TextField
          id="city"
          label="Ciudad"
          value={form.city}
          onChange={(v) => setField('city', v)}
          maxLength={80}
          placeholder="Popayán"
        />
      </div>

      <TextField
        id="street"
        label="Dirección (opcional)"
        value={form.street}
        onChange={(v) => setField('street', v)}
        maxLength={160}
        placeholder="Calle 5 # 4-33"
      />
    </div>
  );
};
