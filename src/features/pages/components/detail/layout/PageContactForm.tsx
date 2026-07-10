'use client';

import { FC, useState } from 'react';
import { toast } from 'sonner';
import type { Page } from '../../../types/page.types';
import { SOCIAL_NETWORKS } from '../../settings/general/social-networks';

interface PageContactFormProps {
  page: Page;
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  message: string;
}

const INPUT =
  'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none';

/**
 * Formulario de contacto (PDF §7). Sin backend dedicado todavía: si la página
 * publicó un correo, el envío abre el cliente de correo del visitante con el
 * mensaje ya redactado. WhatsApp se ofrece como atajo cuando hay número.
 */
export const PageContactForm: FC<PageContactFormProps> = ({ page }) => {
  const [form, setForm] = useState<FormState>({ name: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const pageEmail = page.contact?.email;
  const whatsappDef = SOCIAL_NETWORKS.find((n) => n.key === 'whatsapp');
  const whatsappValue = page.contact?.social?.whatsapp ?? page.contact?.phone;
  const whatsappHref =
    whatsappValue && whatsappDef ? whatsappDef.href(whatsappValue) : undefined;

  const handleChange =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageEmail) {
      toast.error('Esta página no tiene un correo de contacto publicado.');
      return;
    }

    setSubmitting(true);
    try {
      const subject = encodeURIComponent(`Contacto desde YEBAAM — ${page.name}`);
      const body = encodeURIComponent(
        [
          `Nombre: ${form.name}`,
          `Correo: ${form.email}`,
          `Teléfono: ${form.phone}`,
          '',
          form.message,
        ].join('\n')
      );
      window.location.href = `mailto:${pageEmail}?subject=${subject}&body=${body}`;
      toast.success('Se abrió tu cliente de correo con el mensaje listo para enviar.');
      setForm({ name: '', email: '', phone: '', message: '' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {pageEmail ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="page-contact-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre *
            </label>
            <input
              id="page-contact-name"
              type="text"
              required
              value={form.name}
              onChange={handleChange('name')}
              className={INPUT}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="page-contact-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Correo *
              </label>
              <input
                id="page-contact-email"
                type="email"
                required
                value={form.email}
                onChange={handleChange('email')}
                className={INPUT}
              />
            </div>
            <div>
              <label htmlFor="page-contact-phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Teléfono
              </label>
              <input
                id="page-contact-phone"
                type="tel"
                value={form.phone}
                onChange={handleChange('phone')}
                className={INPUT}
              />
            </div>
          </div>

          <div>
            <label htmlFor="page-contact-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mensaje *
            </label>
            <textarea
              id="page-contact-message"
              required
              rows={4}
              value={form.message}
              onChange={handleChange('message')}
              className={INPUT}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Abriendo correo…' : 'Enviar mensaje'}
          </button>
        </form>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Esta página no ha publicado un correo de contacto. Usa WhatsApp o las redes sociales si están disponibles.
        </p>
      )}

      {whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-green-600 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700 hover:bg-green-100 dark:border-green-500 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 transition-colors"
        >
          Escribir por WhatsApp
        </a>
      )}
    </div>
  );
};
