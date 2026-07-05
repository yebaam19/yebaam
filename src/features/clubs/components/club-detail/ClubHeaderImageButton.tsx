'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { uploadService } from '@/lib/service/upload.service';
import { updateClubImagesAction } from '@/features/clubs/server/clubs.actions';
import { CameraIcon } from '@/components/icons/heroicons-shim';

interface ClubHeaderImageButtonProps {
  clubId: string;
  target: 'cover' | 'profile';
  className?: string;
}

export function ClubHeaderImageButton({
  clubId,
  target,
  className,
}: ClubHeaderImageButtonProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [, startTransition] = useTransition();

  const handlePick = () => {
    setError(null);
    inputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Selecciona una imagen.');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      // House rule: persist the bare Cloudflare Images id, never the delivery URL.
      const { id } = await uploadService.uploadImage(file);
      const result = await updateClubImagesAction(
        clubId,
        target === 'cover' ? { coverImageUrl: id } : { profileImageUrl: id },
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error subiendo la imagen.');
    } finally {
      setUploading(false);
    }
  };

  const label = target === 'cover' ? 'Cambiar portada' : 'Cambiar foto de perfil';

  return (
    <>
      <button
        type="button"
        onClick={handlePick}
        disabled={uploading}
        aria-label={label}
        title={label}
        className={
          className ??
          'inline-flex items-center justify-center rounded-full bg-black/55 p-2 text-white shadow-md backdrop-blur-sm transition-colors hover:bg-black/70 disabled:opacity-60'
        }
      >
        <CameraIcon className="h-4 w-4" />
        {uploading && <span className="ml-1.5 text-xs font-medium">Subiendo…</span>}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      {error && (
        <p className="absolute -bottom-7 left-0 right-0 mx-auto w-fit max-w-xs rounded bg-red-50 px-2 py-1 text-xs text-red-700 dark:bg-red-900/40 dark:text-red-300">
          {error}
        </p>
      )}
    </>
  );
}
