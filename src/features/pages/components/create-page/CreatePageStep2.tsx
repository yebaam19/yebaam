import { FC, useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import type { CreatePageDto } from '../../types/page.types';

interface CreatePageStep2Props {
  data: Partial<CreatePageDto>;
  onUpdate: (data: Partial<CreatePageDto>) => void;
  onNext: () => void;
  onBack: () => void;
}

// Categorías en formato del backend
const CATEGORIES = [
  { value: 'Local Business', label: 'Negocio Local' },
  { value: 'Company & Organization', label: 'Empresa y Organización' },
  { value: 'Brand or Product', label: 'Marca o Producto' },
  { value: 'Artist, Band or Public Figure', label: 'Artista, Banda o Figura Pública' },
  { value: 'Entertainment', label: 'Entretenimiento' },
  { value: 'Cause or Community', label: 'Causa o Comunidad' },
  { value: 'Sports & Recreation', label: 'Deportes y Recreación' },
  { value: 'Education', label: 'Educación' },
  { value: 'Non-Profit Organization', label: 'Organización Sin Fines de Lucro' },
  { value: 'Religious Organization', label: 'Organización Religiosa' },
  { value: 'Health & Wellness', label: 'Salud y Bienestar' },
  { value: 'Personal Blog', label: 'Blog Personal' },
  { value: 'Shopping & Retail', label: 'Compras y Ventas' },
  { value: 'Travel & Transportation', label: 'Viajes y Transporte' },
  { value: 'Other', label: 'Otro' },
];

export const CreatePageStep2: FC<CreatePageStep2Props> = ({ data, onUpdate, onNext, onBack }) => {
  const [category, setCategory] = useState<string>(data.category || '');
  const [subcategory, setSubcategory] = useState(data.subcategory || '');

  const handleNext = () => {
    if (!category) {
      return;
    }

    onUpdate({
      category,
      ...(subcategory.trim() && { subcategory: subcategory.trim() }),
    });
    onNext();
  };

  const canProceed = category !== '';

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Selecciona una categoría
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Esto ayudará a las personas a encontrar tu página cuando busquen negocios o servicios como el tuyo
        </p>
      </div>

      {/* Categoría principal */}
      <div>
        <label
          htmlFor="page-category"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Categoría principal <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            id="page-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="block w-full px-4 py-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
          >
            <option value="">Seleccionar categoría...</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Subcategoría (opcional) */}
      {category && (
        <div>
          <label
            htmlFor="page-subcategory"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Subcategoría (opcional)
          </label>
          <input
            id="page-subcategory"
            type="text"
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            placeholder="Ej: Panadería artesanal"
            maxLength={50}
            className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Especifica el tipo de {CATEGORIES.find(c => c.value === category)?.label.toLowerCase()}
          </p>
        </div>
      )}

      {/* Categoría seleccionada - Preview */}
      {category && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
            Categoría seleccionada:
          </p>
          <p className="text-base font-semibold text-blue-700 dark:text-blue-300 mt-1">
            {CATEGORIES.find(c => c.value === category)?.label}
            {subcategory && ` - ${subcategory}`}
          </p>
        </div>
      )}

      {/* Botones */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Atrás
        </button>
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
