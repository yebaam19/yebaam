'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { XMarkIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '@/components/icons/heroicons-shim';
import { useEnableEncryption, useDisableEncryption } from '@/features/chat/hooks/useEncryption';
import { useEncryptionStore } from '@/features/chat/store/encryption.store';

interface EncryptionModalProps {
  conversationId: string;
  isEncrypted: boolean;
  onClose: () => void;
  onSuccess?: () => void; // Callback para refrescar la conversación
}

export default function EncryptionModal({
  conversationId,
  isEncrypted,
  onClose,
  onSuccess,
}: EncryptionModalProps) {
  const t = useTranslations('chat.encryptionModal');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [encryptExisting, setEncryptExisting] = useState(false);

  const enableMutation = useEnableEncryption();
  const disableMutation = useDisableEncryption();
  const { setPassword: savePassword, removePassword, getPassword } = useEncryptionStore();

  const isLoading = enableMutation.isPending || disableMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || password.length < 8) {
      return;
    }

    if (isEncrypted) {
      // Deshabilitar encriptación
      await disableMutation.mutateAsync({
        conversationId,
        data: { password },
      });
      // Eliminar contraseña guardada
      removePassword(conversationId);
      onSuccess?.(); // Refrescar conversación
      onClose();
    } else {

      await enableMutation.mutateAsync({
        conversationId,
        data: {
          password,
          encryptExistingMessages: encryptExisting,
        },
      });

      // Verificar que se guardó correctamente
      const savedPassword = getPassword(conversationId);
      console.log('( Verificación:', {
        passwordGuardada: !!savedPassword,
        sonIguales: savedPassword === password,
      });

      onSuccess?.(); // Refrescar conversación
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <LockClosedIcon className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              {isEncrypted ? t('disableTitle') : t('enableTitle')}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label={t('closeAria')}
            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Description */}
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            {isEncrypted ? (
              <>
                <p className="mb-2">{t('disableDescription')}</p>
                <p className="font-medium text-amber-600 dark:text-amber-500">
                  {t('disableConfirm')}
                </p>
              </>
            ) : (
              <>
                <p className="mb-2">{t('enableDescription')}</p>
                <p className="font-medium text-primary-600 dark:text-primary-500">
                  {t('enableHint')}
                </p>
              </>
            )}
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {isEncrypted ? t('passwordLabelCurrent') : t('passwordLabelEncryption')}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('passwordPlaceholder')}
                minLength={8}
                required
                className="w-full px-3 py-2 pr-10 border border-neutral-300 dark:border-neutral-600 rounded-lg
                         bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white
                         focus:ring-2 focus:ring-primary-500 focus:border-transparent
                         placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? t('hidePasswordAria') : t('showPasswordAria')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-100 dark:hover:bg-neutral-600 rounded"
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5 text-neutral-500" />
                ) : (
                  <EyeIcon className="w-5 h-5 text-neutral-500" />
                )}
              </button>
            </div>
          </div>

          {/* Checkbox for existing messages (only when enabling) */}
          {!isEncrypted && (
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="encryptExisting"
                checked={encryptExisting}
                onChange={(e) => setEncryptExisting(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-primary-600 border-neutral-300 rounded
                         focus:ring-primary-500 focus:ring-2"
              />
              <label htmlFor="encryptExisting" className="text-sm text-neutral-600 dark:text-neutral-400">
                {t('encryptExisting')}
                <span className="block text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                  {t('encryptExistingHint')}
                </span>
              </label>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg
                       text-neutral-700 dark:text-neutral-300 font-medium
                       hover:bg-neutral-50 dark:hover:bg-neutral-700
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading || password.length < 8}
              className={`flex-1 px-4 py-2 rounded-lg font-medium text-white
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors ${
                         isEncrypted
                           ? 'bg-amber-600 hover:bg-amber-700'
                           : 'bg-primary-600 hover:bg-primary-700'
                       }`}
            >
              {isLoading
                ? t('processing')
                : isEncrypted
                  ? t('disable')
                  : t('encrypt')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
