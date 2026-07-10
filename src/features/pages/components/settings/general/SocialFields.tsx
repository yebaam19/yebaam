import { FC } from 'react';
import { TextField } from './TextField';
import { SOCIAL_NETWORKS, type SocialKey } from './social-networks';
import type { GeneralFormData } from './form';

interface SocialFieldsProps {
  form: GeneralFormData;
  setSocial: (key: SocialKey, value: string) => void;
}

/** §3 Redes sociales — one input per network, including WhatsApp for §7 Contacto. */
export const SocialFields: FC<SocialFieldsProps> = ({ form, setSocial }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-4">
    <div>
      <h3 className="text-base font-medium text-gray-900 dark:text-white">
        Redes sociales
      </h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Pega la URL o el usuario de cada red. Se mostrarán en la sección
        &quot;Acerca de&quot; de tu página.
      </p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {SOCIAL_NETWORKS.map((network) => (
        <TextField
          key={network.key}
          id={`social-${network.key}`}
          label={network.label}
          value={form.social[network.key]}
          onChange={(v) => setSocial(network.key, v)}
          placeholder={network.placeholder}
          maxLength={200}
        />
      ))}
    </div>
  </div>
);
