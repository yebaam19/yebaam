'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/context/auth-context';
import { useStoryStore } from '../store';
import { useStorySocket } from '../hooks/useStorySocket';
import { STORY_BACKGROUNDS } from '../utils/colors';
import { StoryType, FONT_STYLES, FONT_SIZES } from '../interfaces/stories.interfaces';
import {
  XMarkIcon,
  PhotoIcon,
  VideoCameraIcon,
  PaintBrushIcon,
  ArrowLeftIcon,
  SparklesIcon,
} from '@/components/icons/heroicons-shim';
import Avatar from '@/ui/Avatar';
import { cn } from '@/lib/utils';

export default function CreateStoryPage() {
  const router = useRouter();
  const { user } = useAuth();
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
  const [fontStyle, setFontStyle] = useState(FONT_STYLES[0]);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  
  // Estados UI
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
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
      toast.error('Tipo de archivo no válido');
      return;
    }

    const maxSize = isVideo ? MAX_VIDEO_SIZE_MB : MAX_IMAGE_SIZE_MB;
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`El archivo excede ${maxSize}MB`);
      return;
    }

    if (isVideo) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > MAX_VIDEO_DURATION) {
          toast.error(`El video no puede durar más de ${MAX_VIDEO_DURATION} segundos`);
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
      toast.error('Escribe algo para tu historia');
      return;
    }

    if ((storyType === 'image' || storyType === 'video') && !selectedFile) {
      toast.error('Selecciona un archivo');
      return;
    }

    try {
      const formData = new FormData();
      
      // Para historias de imagen/video, solo necesitamos el archivo y tipo
      if (storyType === 'image' || storyType === 'video') {
        if (!selectedFile) {
          toast.error('Selecciona un archivo');
          return;
        }
        
        formData.append('file', selectedFile);
        formData.append('type', storyType);
        
        // Caption opcional (puedes agregar un campo de texto si quieres)
        // formData.append('caption', 'Mi historia');
      }
      
      // Para historias de texto (no implementado en el backend aún)
      if (storyType === 'text') {
        toast.error('Las historias de texto aún no están disponibles');
        return;
      }

      await createStory(formData);
      
      toast.success('¡Historia publicada exitosamente! ');
      
      // Limpiar estados
      setStoryType(null);
      setSelectedFile(null);
      setPreviewUrl(null);
      setTextContent('');
      
      // Redirigir al feed o cerrar
      router.push('/feed');
    } catch (error) {
      console.error('Error creating story:', error);
      toast.error('Error al publicar la historia');
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
      <aside className="relative flex h-full w-full max-w-sm flex-col border-r border-neutral-800 bg-neutral-900 shadow-2xl">
        {/* Header del sidebar */}
        <div className="flex items-center gap-3 border-b border-neutral-800 px-5 py-4">
          <button
            onClick={handleBack}
            aria-label="Volver"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-800 text-white transition hover:bg-neutral-700"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold">Tu historia</h1>
        </div>

        {/* Tarjeta de usuario */}
        <div className="flex items-center gap-3 px-5 py-4">
          <Avatar
            initials={user.username.substring(0, 2).toUpperCase()}
            src={user.avatar}
            className="h-11 w-11 ring-2 ring-primary-500/40"
          />
          <div className="min-w-0">
            <p className="truncate font-semibold">{user.username}</p>
            <p className="text-xs text-neutral-400">Visible por 24 horas</p>
          </div>
        </div>

        {/* Contenido scrollable del sidebar */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {!storyType ? (
            <div className="space-y-3">
              <p className="mb-1 text-sm font-semibold text-neutral-300">Añadir a tu historia</p>

              <button
                onClick={() => handleTypeSelect('image')}
                className="group flex w-full items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-800/60 p-4 text-left transition hover:border-primary-500/60 hover:bg-neutral-800"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-600/20 text-primary-400 ring-1 ring-primary-500/40 transition group-hover:bg-primary-600 group-hover:text-white">
                  <PhotoIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">Crear historia con foto</p>
                  <p className="text-xs text-neutral-400">Comparte una imagen</p>
                </div>
              </button>

              <button
                onClick={() => handleTypeSelect('video')}
                className="group flex w-full items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-800/60 p-4 text-left transition hover:border-primary-500/60 hover:bg-neutral-800"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-600/20 text-primary-400 ring-1 ring-primary-500/40 transition group-hover:bg-primary-600 group-hover:text-white">
                  <VideoCameraIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">Crear historia con video</p>
                  <p className="text-xs text-neutral-400">Hasta {MAX_VIDEO_DURATION}s</p>
                </div>
              </button>

              <button
                onClick={() => handleTypeSelect('text')}
                className="group flex w-full items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-800/60 p-4 text-left transition hover:border-primary-500/60 hover:bg-neutral-800"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-600/20 text-primary-400 ring-1 ring-primary-500/40 transition group-hover:bg-primary-600 group-hover:text-white">
                  <PaintBrushIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">Crear historia de texto</p>
                  <p className="text-xs text-neutral-400">Fondo y tipografía personalizados</p>
                </div>
              </button>
            </div>
          ) : storyType === 'text' ? (
            <div className="space-y-5">
              {/* Fondo */}
              <div>
                <p className="mb-3 text-sm font-semibold text-neutral-300">Fondo</p>
                <div className="grid grid-cols-5 gap-2">
                  {STORY_BACKGROUNDS.map((bg, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedBackground(bg)}
                      aria-label={`Fondo ${index + 1}`}
                      className={cn(
                        'h-12 w-full rounded-lg transition',
                        selectedBackground === bg
                          ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-neutral-900'
                          : 'hover:scale-105'
                      )}
                      style={{ background: bg.value }}
                    />
                  ))}
                </div>
              </div>

              {/* Tamaño */}
              <div>
                <p className="mb-3 text-sm font-semibold text-neutral-300">Tamaño</p>
                <div className="flex gap-2">
                  {['S', 'M', 'L'].map((size, index) => (
                    <button
                      key={index}
                      onClick={() => setFontSize(index)}
                      className={cn(
                        'h-10 flex-1 rounded-lg font-bold transition',
                        fontSize === index
                          ? 'bg-primary-600 text-white'
                          : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Alineación */}
              <div>
                <p className="mb-3 text-sm font-semibold text-neutral-300">Alinear</p>
                <div className="flex gap-2">
                  {(['left', 'center', 'right'] as const).map((align) => (
                    <button
                      key={align}
                      onClick={() => setTextAlign(align)}
                      className={cn(
                        'h-10 flex-1 rounded-lg transition',
                        textAlign === align
                          ? 'bg-primary-600 text-white'
                          : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                      )}
                    >
                      {align === 'left' ? '⬅' : align === 'center' ? '⬌' : '➡'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-neutral-300">Archivo seleccionado</p>
              <div className="rounded-xl border border-neutral-800 bg-neutral-800/60 p-4">
                <p className="truncate text-sm font-medium">{selectedFile?.name}</p>
                <p className="mt-1 text-xs text-neutral-400">
                  {selectedFile && (selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-800 py-2.5 text-sm font-semibold text-neutral-200 transition hover:bg-neutral-700"
              >
                Cambiar archivo
              </button>
            </div>
          )}
        </div>

        {/* Footer acciones */}
        <div className="border-t border-neutral-800 p-4">
          {storyType ? (
            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="flex-1 rounded-xl bg-neutral-800 py-3 font-semibold text-white transition hover:bg-neutral-700"
              >
                Descartar
              </button>
              <button
                onClick={handlePublish}
                disabled={isCreating}
                className="flex-1 rounded-xl bg-primary-600 py-3 font-semibold text-white shadow-lg transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-neutral-700"
              >
                {isCreating ? 'Publicando…' : 'Compartir'}
              </button>
            </div>
          ) : (
            <p className="text-center text-xs text-neutral-500">
              Tu historia será visible durante 24 horas
            </p>
          )}
        </div>
      </aside>

      {/* ============ PANEL DE PREVIEW ============ */}
      <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-linear-to-br from-neutral-950 via-neutral-900 to-primary-950/40 p-8">
        {/* Glow decorativo */}
        <div className="pointer-events-none absolute -left-20 top-1/4 h-96 w-96 rounded-full bg-primary-600/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-1/4 h-96 w-96 rounded-full bg-primary-500/10 blur-3xl" />

        {!storyType ? (
          <div className="relative z-10 flex flex-col items-center gap-5 text-center">
            <div className="aspect-9/16 w-40 rounded-2xl border border-dashed border-neutral-700" />
            <h2 className="text-2xl font-semibold tracking-tight">Vista previa</h2>
            <p className="max-w-xs text-sm text-neutral-500">
              Elige una opción para comenzar.
            </p>
          </div>
        ) : (
          <div className="relative z-10 aspect-9/16 w-full max-w-[360px] overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/10">
            {storyType === 'text' && (
              <div
                className="flex h-full w-full items-center justify-center p-8"
                style={{ background: selectedBackground.value }}
              >
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Escribe tu historia..."
                  maxLength={250}
                  style={{
                    color: selectedBackground.textColor,
                    fontSize: FONT_SIZES[fontSize],
                    textAlign: textAlign,
                  }}
                  className={cn(
                    'h-full w-full resize-none border-none bg-transparent text-center outline-none placeholder:opacity-60',
                    fontStyle.className
                  )}
                />
              </div>
            )}

            {storyType === 'image' && previewUrl && (
              <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
            )}

            {storyType === 'video' && previewUrl && (
              <video
                ref={videoRef}
                src={previewUrl}
                controls
                className="h-full w-full object-cover"
              />
            )}

            {storyType === 'text' && (
              <div className="absolute bottom-4 right-4 rounded-full bg-black/50 px-3 py-1 backdrop-blur-sm">
                <span className="text-sm font-medium text-white">{textContent.length}/250</span>
              </div>
            )}
          </div>
        )}
      </main>

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
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-neutral-800">
            {/* Header del modal */}
            <div className="p-6 border-b border-neutral-800">
              <h3 className="text-xl font-bold text-white">¿Descartar historia?</h3>
              <p className="text-neutral-400 mt-2">
                Si sales ahora, perderás todos los cambios que hayas hecho.
              </p>
            </div>

            {/* Botones de acción */}
            <div className="p-6 flex gap-3">
              <button
                onClick={() => setShowDiscardModal(false)}
                className="flex-1 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-xl transition-colors"
              >
                Continuar editando
              </button>
              <button
                onClick={confirmDiscard}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors"
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
