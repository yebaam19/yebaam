import { FC, useState } from 'react';
import { XMarkIcon } from '@/components/icons/heroicons-shim';
import type { CreateClubDto } from '../../types/club.types';

interface CreateClubStep4Props {
  data: Partial<CreateClubDto>;
  onUpdate: (data: Partial<CreateClubDto>) => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export const CreateClubStep4: FC<CreateClubStep4Props> = ({
  data,
  onUpdate,
  onBack,
  onSubmit,
  isSubmitting,
}) => {
  const [tags, setTags] = useState<string[]>(data.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [rules, setRules] = useState<string[]>(data.rules || []);
  const [ruleInput, setRuleInput] = useState('');

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
      const newTags = [...tags, trimmedTag];
      setTags(newTags);
      setTagInput('');
      onUpdate({ tags: newTags });
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(newTags);
    onUpdate({ tags: newTags });
  };

  const handleAddRule = () => {
    const trimmedRule = ruleInput.trim();
    if (trimmedRule && !rules.includes(trimmedRule) && rules.length < 20) {
      const newRules = [...rules, trimmedRule];
      setRules(newRules);
      setRuleInput('');
      onUpdate({ rules: newRules });
    }
  };

  const handleRemoveRule = (ruleToRemove: string) => {
    const newRules = rules.filter((rule) => rule !== ruleToRemove);
    setRules(newRules);
    onUpdate({ rules: newRules });
  };

  const handleSubmit = () => {
    onUpdate({
      tags: tags.length > 0 ? tags : undefined,
      rules: rules.length > 0 ? rules : undefined,
    });
    onSubmit();
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Información adicional
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Añade etiquetas y reglas para tu club (opcional)
        </p>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Etiquetas <span className="text-gray-400 text-xs">(opcional, máx. 10)</span>
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
            placeholder="Añadir etiqueta..."
            maxLength={30}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleAddTag}
            disabled={!tagInput.trim() || tags.length >= 10}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Añadir
          </button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-blue-900 dark:hover:text-blue-100"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Rules */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Reglas del club <span className="text-gray-400 text-xs">(opcional, máx. 20)</span>
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={ruleInput}
            onChange={(e) => setRuleInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddRule();
              }
            }}
            placeholder="Añadir regla..."
            maxLength={200}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleAddRule}
            disabled={!ruleInput.trim() || rules.length >= 20}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Añadir
          </button>
        </div>
        {rules.length > 0 && (
          <ul className="space-y-2">
            {rules.map((rule, index) => (
              <li
                key={index}
                className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <span className="shrink-0 w-6 h-6 flex items-center justify-center bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">
                  {index + 1}
                </span>
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{rule}</span>
                <button
                  onClick={() => handleRemoveRule(rule)}
                  className="shrink-0 text-gray-400 hover:text-red-500"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Summary */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h5 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
          Resumen del club
        </h5>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-blue-700 dark:text-blue-400">Nombre:</dt>
            <dd className="text-blue-900 dark:text-blue-200 font-medium">{data.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-blue-700 dark:text-blue-400">Categoría:</dt>
            <dd className="text-blue-900 dark:text-blue-200">{data.category}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-blue-700 dark:text-blue-400">Privacidad:</dt>
            <dd className="text-blue-900 dark:text-blue-200">{data.privacy || 'PUBLIC'}</dd>
          </div>
          {tags.length > 0 && (
            <div className="flex justify-between">
              <dt className="text-blue-700 dark:text-blue-400">Etiquetas:</dt>
              <dd className="text-blue-900 dark:text-blue-200">{tags.length}</dd>
            </div>
          )}
          {rules.length > 0 && (
            <div className="flex justify-between">
              <dt className="text-blue-700 dark:text-blue-400">Reglas:</dt>
              <dd className="text-blue-900 dark:text-blue-200">{rules.length}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Atrás
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Creando club...' : 'Crear club'}
        </button>
      </div>
    </div>
  );
};
