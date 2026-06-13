'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/features/auth/context/auth-context';
import { useStoryStore } from '../store';
import { useStorySocket } from '../hooks/useStorySocket';
import { STORY_BACKGROUNDS } from '../utils/colors';
import { StoryType, FONT_STYLES } from '../interfaces/stories.interfaces';
import { StoryToolbar } from './_components/StoryToolbar';
import { StoryPreview } from './_components/StoryPreview';
import { DiscardModal } from './_components/DiscardModal';

export default function CreateStoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const t = useTranslations('stories.create');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Zustand store
  const {
    isCreating,
    createStory,
    clearDraft,
  } = useStoryStore();

  // WebSocket para eventos en tiempo real
  useStorySocket();

  // Estados principales
  const [storyType, setStoryType] = useState<StoryType | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Estados para story de texto
  const [textContent, setTextContent] = useState('');
  const [selectedBackground, setSelectedBackground] = useState(STORY_BACKGROUNDS[0]);
  const [fontSize, setFontSize] = useState(2);
  const [fontStyle] = useState(FONT_STYLES[0]);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');

  // Estados UI
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  // Validación de archivos
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
  const MAX_IMAGE_SIZE_MB = 10;
  const MAX_VIDEO_SIZE_MB = 2048;
  const MAX_VIDEO_DURATION = 60;

  const handleTypeSelect = (type: StoryType) => {
    setStoryType(type);
    if (type === 'image' || type === 'video') {
      fileInputRef.current?.click();
    }
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      toast.error(t('errors.invalidFileType'));
      return;
    }

    const maxSize = isVideo ? MAX_VIDEO_SIZE_MB : MAX_IMAGE_SIZE_MB;
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(t('errors.fileExceedsSize', { size: maxSize }));
      return;
    }

    if (isVideo) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > MAX_VIDEO_DURATION) {
          toast.error(t('errors.videoTooLong', { seconds: MAX_VIDEO_DURATION }));
          return;
        }
      };
      video.src = URL.createObjectURL(file);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setStoryType(isVideo ? 'video' : 'image');
  };

  const handlePublish = async () => {
    if (isCreating) return;

    // Validaciones
    if (storyType === 'text' && !textContent.trim()) {
      toast.error(t('errors.writeSomething'));
      return;
    }

    if ((storyType === 'image' || storyType === 'video') && !selectedFile) {
      toast.error(t('errors.selectFile'));
      return;
    }

    try {
      const formData = new FormData();

      // Para historias de imagen/video, solo necesitamos el archivo y tipo
      if (storyType === 'image' || storyType === 'video') {
        if (!selectedFile) {
          toast.error(t('errors.selectFile'));
          return;
        }

        formData.append('file', selectedFile);
        formData.append('type', storyType);

        // Caption opcional (puedes agregar un campo de texto si quieres)
        // formData.append('caption', 'Mi historia');
      }

      // Para historias de texto (no implementado en el backend aún)
      if (storyType === 'text') {
        toast.error(t('errors.textNotAvailable'));
        return;
      }

      await createStory(formData);

      toast.success(t('success.published'));

      // Limpiar estados
      setStoryType(null);
      setSelectedFile(null);
      setPreviewUrl(null);
      setTextContent('');

      // Redirigir al feed o cerrar
      router.push('/feed');
    } catch (error) {
      console.error('Error creating story:', error);
      toast.error(t('errors.publishError'));
    }
  };

  const handleBack = () => {
    if (storyType && (textContent || selectedFile)) {
      setShowDiscardModal(true);
    } else {
      router.back();
    }
  };

  const confirmDiscard = () => {
    // Limpiar estados locales
    setStoryType(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setTextContent('');

    clearDraft();
    router.back();
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex bg-neutral-950 text-white">
      {/* ============ SIDEBAR IZQUIERDO (estilo Facebook) ============ */}
      <StoryToolbar
        username={user.username}
        avatar={user.avatar}
        storyType={storyType}
        selectedFile={selectedFile}
        isCreating={isCreating}
        maxVideoDuration={MAX_VIDEO_DURATION}
        selectedBackground={selectedBackground}
        fontSize={fontSize}
        textAlign={textAlign}
        onBack={handleBack}
        onSelectType={handleTypeSelect}
        onChangeFile={() => fileInputRef.current?.click()}
        onPublish={handlePublish}
        onSelectBackground={setSelectedBackground}
        onSelectFontSize={setFontSize}
        onSelectTextAlign={setTextAlign}
      />

      {/* ============ PANEL DE PREVIEW ============ */}
      <StoryPreview
        storyType={storyType}
        previewUrl={previewUrl}
        textContent={textContent}
        selectedBackground={selectedBackground}
        fontSize={fontSize}
        fontStyle={fontStyle}
        textAlign={textAlign}
        videoRef={videoRef}
        onTextChange={setTextContent}
      />

      {/* Input oculto para archivos */}
      <input
        ref={fileInputRef}
        type="file"
        accept={[...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Modal de confirmación personalizado */}
      {showDiscardModal && (
        <DiscardModal
          onContinue={() => setShowDiscardModal(false)}
          onConfirm={confirmDiscard}
        />
      )}
    </div>
  );
}
