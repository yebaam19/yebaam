'use client';

import { useState } from 'react';
import { LockClosedIcon, LockOpenIcon } from '@heroicons/react/24/outline';
import EncryptionModal from './EncryptionModal';

interface EncryptionButtonProps {
  conversationId: string;
  isEncrypted?: boolean;
  onRefresh?: () => void; // Callback para refrescar la conversación
}

export default function EncryptionButton({
  conversationId,
  isEncrypted = false,
  onRefresh,
}: EncryptionButtonProps) {
  const [showModal, setShowModal] = useState(false);

  const handleClose = () => {
    setShowModal(false);
  };

  const handleSuccess = () => {
    onRefresh?.(); // Refrescar la conversación
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`p-2 rounded-lg transition-colors ${
          isEncrypted
            ? 'text-primary-600 dark:text-primary-500 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30'
            : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
        }`}
        title={isEncrypted ? 'Conversación encriptada' : 'Encriptar conversación'}
      >
        {isEncrypted ? (
          <LockClosedIcon className="w-5 h-5" />
        ) : (
          <LockOpenIcon className="w-5 h-5" />
        )}
      </button>

      {showModal && (
        <EncryptionModal
          conversationId={conversationId}
          isEncrypted={isEncrypted}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
