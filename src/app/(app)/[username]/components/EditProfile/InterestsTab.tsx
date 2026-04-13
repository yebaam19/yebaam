import { useState } from 'react';
import { GlobeAltIcon, TagIcon, PlusIcon, XMarkIcon } from '@/components/icons/heroicons-shim';

interface InterestsTabProps {
  formData: {
    languages?: string[];
    interests?: string[];
  };
  onFormChange: (updates: Partial<InterestsTabProps['formData']>) => void;
}

export function InterestsTab({
  formData,
  onFormChange,
}: InterestsTabProps) {
  const [newLanguage, setNewLanguage] = useState('');
  const [newInterest, setNewInterest] = useState('');

  const addLanguage = () => {
    if (newLanguage.trim() && !formData.languages?.includes(newLanguage.trim())) {
      onFormChange({
        languages: [...(formData.languages || []), newLanguage.trim()],
      });
      setNewLanguage('');
    }
  };

  const removeLanguage = (language: string) => {
    onFormChange({
      languages: formData.languages?.filter(l => l !== language),
    });
  };

  const addInterest = () => {
    if (newInterest.trim() && !formData.interests?.includes(newInterest.trim())) {
      onFormChange({
        interests: [...(formData.interests || []), newInterest.trim()],
      });
      setNewInterest('');
    }
  };

  const removeInterest = (interest: string) => {
    onFormChange({
      interests: formData.interests?.filter(i => i !== interest),
    });
  };

  return (
    <div className="space-y-6">
      {/* Languages */}
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
          <GlobeAltIcon className="w-5 h-5 text-green-600" />
          Idiomas
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
              className="flex-1 px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 dark:text-white"
              placeholder="Agregar idioma..."
            />
            <button
              type="button"
              onClick={addLanguage}
              className="p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>
          {formData.languages && formData.languages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.languages.map((language) => (
                <div
                  key={language}
                  className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-xl text-sm font-medium"
                >
                  {language}
                  <button
                    type="button"
                    onClick={() => removeLanguage(language)}
                    className="hover:text-green-900 dark:hover:text-green-100"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Interests */}
      <div className="border-t border-neutral-200 dark:border-neutral-800 pt-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
          <TagIcon className="w-5 h-5 text-purple-600" />
          Intereses y hobbies
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
              className="flex-1 px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 dark:text-white"
              placeholder="Agregar interés..."
            />
            <button
              type="button"
              onClick={addInterest}
              className="p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>
          {formData.interests && formData.interests.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.interests.map((interest) => (
                <div
                  key={interest}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-xl text-sm font-medium"
                >
                  {interest}
                  <button
                    type="button"
                    onClick={() => removeInterest(interest)}
                    className="hover:text-purple-900 dark:hover:text-purple-100"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
