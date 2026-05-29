'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CameraIcon } from '@/components/icons/heroicons-shim';
import CameraCaptureModal from '@/components/chat/CameraCaptureModal';
import type { AnonMediaPayload } from '../types';
import { uploadEphemeralImage } from '../lib/uploadEphemeralImage';

interface EphemeralCameraProps {
  onSendMedia: (media: AnonMediaPayload) => void;
  disabled?: boolean;
}

/**
 * Camera trigger for the anonymous chat: opens the shared capture modal and
 * routes the snapshot through the private/5-min ephemeral image path. Photo
 * only — Stream has no signed playback, so ephemeral video is out of scope.
 */
export default function EphemeralCamera({ onSendMedia, disabled }: EphemeralCameraProps) {
  const t = useTranslations('chat.camera');
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const handleCapture = async (file: File) => {
    setSending(true);
    try {
      onSendMedia(await uploadEphemeralImage(file));
      setOpen(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        title={t('open')}
        className="rounded-full p-2 transition-colors hover:bg-neutral-100 disabled:opacity-50 dark:hover:bg-neutral-800"
      >
        <CameraIcon className="h-5 w-5 text-primary-600" />
      </button>
      <CameraCaptureModal open={open} onClose={() => setOpen(false)} onCapture={handleCapture} sending={sending} />
    </>
  );
}
