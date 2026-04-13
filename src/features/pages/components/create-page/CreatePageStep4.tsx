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
  const [contact, setContact] = useState<PageContact>(data.contact || {});
  const [errors, setErrors] = useState<{
    email?: string;
    phone?: string;
    website?: string;
  }>({});

  const handleSimpleChange = (field: 'email' | 'phone' | 'website', value: string) => {
    const newContact = { ...contact, [field]: value };
    setContact(newContact);

    // Validación en tiempo real
    const newErrors = { ...errors };
    if (value.trim()) {
      if (field === 'email') {
        if (!validateEmail(value)) {
          newErrors.email = 'Email inválido';
        } else {
          delete newErrors.email;
        }
      } else if (field === 'phone') {
        if (!validatePhone(value)) {
          newErrors.phone = 'Teléfono inválido (ej: +1 234 567 8900)';
        } else {
          delete newErrors.phone;
        }
      } else if (field === 'website') {
        if (!validateUrl(value)) {
          newErrors.website = 'URL inválida (debe empezar con http:// o https://)';
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
          Información de contacto
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Ayuda a las personas a conectar contigo (todos los campos son opcionales)
        </p>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <EnvelopeIcon className="w-4 h-4 inline mr-1" />
          Correo electrónico
        </label>
        <input
          id="contact-email"
          type="email"
          value={contact.email || ''}
          onChange={(e) => handleSimpleChange('email', e.target.value)}
          placeholder="contacto@ejemplo.com"
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
          Teléfono
        </label>
        <input
          id="contact-phone"
          type="tel"
          value={contact.phone || ''}
          onChange={(e) => handleSimpleChange('phone', e.target.value)}
          placeholder="+1 234 567 8900"
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
          Sitio web
        </label>
        <input
          id="contact-website"
          type="url"
          value={contact.website || ''}
          onChange={(e) => handleSimpleChange('website', e.target.value)}
          placeholder="https://www.ejemplo.com"
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
          Dirección
        </label>
        <div className="space-y-3">
          <input
            type="text"
            value={contact.address?.street || ''}
            onChange={(e) => handleAddressChange('street', e.target.value)}
            placeholder="Calle Principal #123"
            className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={contact.address?.city || ''}
              onChange={(e) => handleAddressChange('city', e.target.value)}
              placeholder="Ciudad"
              className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              value={contact.address?.state || ''}
              onChange={(e) => handleAddressChange('state', e.target.value)}
              placeholder="Estado/Provincia"
              className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={contact.address?.country || ''}
              onChange={(e) => handleAddressChange('country', e.target.value)}
              placeholder="País"
              className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              value={contact.address?.zipCode || ''}
              onChange={(e) => handleAddressChange('zipCode', e.target.value)}
              placeholder="Código postal"
              className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <p className="text-sm font-medium text-green-900 dark:text-green-200 mb-2">
          ¡Todo listo!
        </p>
        <div className="space-y-1 text-sm text-green-700 dark:text-green-300">
          <p>Información básica completa</p>
          <p>Categoría seleccionada</p>
          {data.profileImageUrl && <p>✓ Foto de perfil agregada</p>}
          {data.coverImageUrl && <p>✓ Imagen de portada agregada</p>}
          {(contact.email || contact.phone || contact.website || contact.address) && (
            <p>Información de contacto agregada</p>
          )}
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Atrás
        </button>
        <button
          onClick={handleSubmit}
          disabled={hasValidationErrors || isSubmitting}
          className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creando...' : 'Crear página'}
        </button>
      </div>
    </div>
  );
};
