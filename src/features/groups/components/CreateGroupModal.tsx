'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { XMarkIcon, PhotoIcon } from '@/components/icons/heroicons-shim';
import { useCreateGroup } from '../hooks/useGroups';
import { toast } from 'sonner';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  'Tecnología',
  'Arte y Fotografía',
  'Viajes',
  'Comida',
  'Negocios',
  'Salud',
  'Deportes',
  'Música',
  'Cine',
  'Libros',
  'Gaming',
  'Educación',
  'Otro',
];

export function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
  const t = useTranslations('grupos');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Tecnología');
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const createGroupMutation = useCreateGroup();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !description.trim()) {
      toast.error(t('create.errors.missingFields'));
      return;
    }

    try {
      await createGroupMutation.mutateAsync({
        name: name.trim(),
        description: description.trim(),
        category,
        privacy,
        coverImage: coverImage || undefined,
      });

      toast.success(t('create.success'));
      handleClose();
    } catch (error) {
      console.error('[CreateGroupModal] Error:', error);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setCategory('Tecnología');
    setPrivacy('public');
    setCoverImage(null);
    setPreviewUrl(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            {t('create.title')}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-neutral-600 dark:text-neutral-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Cover Image */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {t('create.fields.coverLabel')}
            </label>
            <div className="relative">
              {previewUrl ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-neutral-200 dark:border-neutral-800">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCoverImage(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <PhotoIcon className="h-12 w-12 text-neutral-400 mb-2" />
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    {t('create.fields.uploadPrompt')}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                    {t('create.fields.uploadHint')}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {t('create.fields.nameLabel')}
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('create.fields.namePlaceholder')}
              maxLength={100}
              required
              className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {t('create.fields.nameCounter', { count: name.length })}
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {t('create.fields.descriptionLabel')}
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('create.fields.descriptionPlaceholder')}
              rows={4}
              maxLength={500}
              required
              className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {t('create.fields.descriptionCounter', { count: description.length })}
            </p>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {t('create.fields.categoryLabel')}
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Privacy */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
              {t('create.fields.privacyLabel')}
            </label>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                <input
                  type="radio"
                  name="privacy"
                  value="public"
                  checked={privacy === 'public'}
                  onChange={(e) => setPrivacy(e.target.value as 'public' | 'private')}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">{t('create.fields.publicOption')}</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {t('create.fields.publicHint')}
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-4 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                <input
                  type="radio"
                  name="privacy"
                  value="private"
                  checked={privacy === 'private'}
                  onChange={(e) => setPrivacy(e.target.value as 'public' | 'private')}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">{t('create.fields.privateOption')}</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {t('create.fields.privateHint')}
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              {t('create.cancel')}
            </button>
            <button
              type="submit"
              disabled={createGroupMutation.isPending}
              className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 text-white rounded-lg font-medium transition-colors"
            >
              {createGroupMutation.isPending ? t('create.submitting') : t('create.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
