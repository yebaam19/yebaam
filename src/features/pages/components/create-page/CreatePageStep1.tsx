import { FC, useState, useEffect } from 'react';
import type { CreatePageDto } from '../../types/page.types';
import { validateUsername, generateUsernameFromName } from '../../utils/pageHelpers';

interface CreatePageStep1Props {
  data: Partial<CreatePageDto>;
  onUpdate: (data: Partial<CreatePageDto>) => void;
  onNext: () => void;
}

export const CreatePageStep1: FC<CreatePageStep1Props> = ({ data, onUpdate, onNext }) => {
  const [name, setName] = useState(data.name || '');
  const [slug, setSlug] = useState(data.slug || '');
  const [description, setDescription] = useState(data.description || '');
  const [slugError, setSlugError] = useState('');
  const [isSlugManual, setIsSlugManual] = useState(false);

  // Auto-generar slug desde el nombre
  useEffect(() => {
    if (name && !isSlugManual) {
      const generated = generateUsernameFromName(name);
      setSlug(generated);
    }
  }, [name, isSlugManual]);

  // Validar slug
  useEffect(() => {
    if (slug) {
      const validation = validateUsername(slug);
      setSlugError(validation.error || '');
    } else {
      setSlugError('');
    }
  }, [slug]);

  const handleNext = () => {
    if (!name.trim()) {
      return;
    }

    if (slugError) {
      return;
    }

    onUpdate({
      name: name.trim(),
      ...(slug.trim() && { slug: slug.trim() }), // Solo enviar si hay valor
      description: description.trim(),
    });
    onNext();
  };

  const canProceed = name.trim() && !slugError;

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Comencemos con lo básico
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Dale un nombre y descripción a tu página para que las personas puedan encontrarla
        </p>
      </div>

      {/* Nombre de la página */}
      <div>
        <label
          htmlFor="page-name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Nombre de la página <span className="text-red-500">*</span>
        </label>
        <input
          id="page-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Mi Negocio"
          maxLength={100}
          className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {name.length}/100 caracteres
        </p>
      </div>

      {/* Slug (URL) */}
      <div>
        <label
          htmlFor="page-slug"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Nombre de usuario (URL) <span className="text-gray-400 text-xs">(opcional)</span>
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">yebaam.com/paginas/</span>
          <input
            id="page-slug"
            type="text"
            value={slug}
            onChange={(e) => {
              setIsSlugManual(true);
              setSlug(e.target.value);
            }}
            placeholder="mi-negocio"
            maxLength={30}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {slugError && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{slugError}</p>
        )}
        {!slugError && slug && (
          <p className="mt-1 text-xs text-green-600 dark:text-green-400">URL disponible: yebaam.com/paginas/{slug}</p>
        )}
        {!slug && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            💡 Si lo dejas vacío, se generará automáticamente del nombre de la página
          </p>
        )}
      </div>

      {/* Descripción */}
      <div>
        <label
          htmlFor="page-description"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Descripción
        </label>
        <textarea
          id="page-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe de qué trata tu página..."
          rows={4}
          maxLength={500}
          className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {description.length}/500 caracteres
        </p>
      </div>

      {/* Botón Siguiente */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};
