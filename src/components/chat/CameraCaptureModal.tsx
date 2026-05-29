'use client';

import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { XMarkIcon } from '@/components/icons/heroicons-shim';

interface CameraCaptureModalProps {
  open: boolean;
  onClose: () => void;
  /** Receives the captured JPEG. The parent uploads/sends and then closes. */
  onCapture: (file: File) => void | Promise<void>;
  /** Parent is busy uploading the captured photo. */
  sending?: boolean;
}

/**
 * Reusable in-app camera: live getUserMedia preview → snapshot to a JPEG File.
 * Self-contained — starts the stream when `open` flips true and always stops all
 * tracks on close/unmount. Used by the regular chat bubble and the anonymous
 * chat so capture behavior can't drift.
 */
export default function CameraCaptureModal({ open, onClose, onCapture, sending }: CameraCaptureModalProps) {
  const t = useTranslations('chat.camera');
  const [busy, setBusy] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        toast.error(t('unsupported'));
        onClose();
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        streamRef.current = stream;
        requestAnimationFrame(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            void videoRef.current.play().catch(() => {});
          }
        });
      } catch {
        toast.error(t('denied'));
        onClose();
      }
    })();
    return () => {
      cancelled = true;
      stop();
    };
  }, [open, onClose, stop, t]);

  const capture = useCallback(async () => {
    const video = videoRef.current;
    if (!video || busy || sending) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    setBusy(true);
    try {
      const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.9));
      if (!blob) throw new Error('no blob');
      await onCapture(new File([blob], `photo-${w}x${h}.jpg`, { type: 'image/jpeg' }));
    } catch {
      toast.error(t('captureFailed'));
    } finally {
      setBusy(false);
    }
  }, [busy, sending, onCapture, t]);

  const working = busy || Boolean(sending);

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[210]" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70" />
        </TransitionChild>
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-sm overflow-hidden rounded-xl bg-neutral-900 shadow-2xl">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm font-medium text-white">{t('title')}</span>
              <button
                type="button"
                onClick={onClose}
                aria-label={t('close')}
                className="rounded-full p-1.5 transition-colors hover:bg-white/10"
              >
                <XMarkIcon className="h-5 w-5 text-white" />
              </button>
            </div>
            <video ref={videoRef} playsInline muted className="aspect-[3/4] w-full bg-black object-cover" />
            <div className="flex justify-center p-4">
              <button
                type="button"
                onClick={() => void capture()}
                disabled={working}
                className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-neutral-900 transition-opacity disabled:opacity-50"
              >
                {working ? t('sending') : t('capture')}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </Transition>
  );
}
