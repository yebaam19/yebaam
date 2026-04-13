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
  const MAX_VIDEO_SIZE_MB = 50;
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
    <div className="fixed inset-0 z-50 bg-neutral-950">
      {/* Header profesional */}
      <header className="absolute top-0 left-0 right-0 z-20 bg-linear-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between px-6 py-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-white hover:text-neutral-300 transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6" />
            <span className="font-medium">Cancelar</span>
          </button>
          
          <div className="flex items-center gap-3">
            <Avatar
              initials={user.username.substring(0, 2).toUpperCase()}
              src={user.avatar}
              className="h-10 w-10"
            />
            <span className="text-white font-semibold">{user.username}</span>
          </div>

          {storyType && (
            <button
              onClick={handlePublish}
              disabled={isCreating}
              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-600 text-white font-semibold rounded-full transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            >
              {isCreating ? 'Publicando...' : 'Publicar'}
            </button>
          )}
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="h-full flex items-center justify-center">
        {!storyType ? (
          /* Selector de tipo de historia */
          <div className="flex flex-col items-center gap-8 px-4">
            <div className="text-center space-y-2 mb-4">
              <h1 className="text-4xl font-bold text-white flex items-center justify-center gap-3">
                <SparklesIcon className="w-10 h-10 text-primary-500" />
                Crea tu historia
              </h1>
              <p className="text-neutral-400 text-lg">Comparte tu momento con el mundo</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
              {/* Opción: Texto */}
              <button
                onClick={() => handleTypeSelect('text')}
                className="group relative overflow-hidden rounded-3xl p-8 bg-linear-to-br from-purple-600 to-pink-600 hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-purple-500/50"
              >
                <div className="flex flex-col items-center gap-4 relative z-10">
                  <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                    <PaintBrushIcon className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-white mb-1">Texto</h3>
                    <p className="text-white/80 text-sm">Crea con palabras</p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
              </button>

              {/* Opción: Foto */}
              <button
                onClick={() => handleTypeSelect('image')}
                className="group relative overflow-hidden rounded-3xl p-8 bg-linear-to-br from-blue-600 to-cyan-600 hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-blue-500/50"
              >
                <div className="flex flex-col items-center gap-4 relative z-10">
                  <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                    <PhotoIcon className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-white mb-1">Foto</h3>
                    <p className="text-white/80 text-sm">Comparte imágenes</p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
              </button>

              {/* Opción: Video */}
              <button
                onClick={() => handleTypeSelect('video')}
                className="group relative overflow-hidden rounded-3xl p-8 bg-linear-to-br from-orange-600 to-red-600 hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-orange-500/50"
              >
                <div className="flex flex-col items-center gap-4 relative z-10">
                  <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                    <VideoCameraIcon className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-white mb-1">Video</h3>
                    <p className="text-white/80 text-sm">Graba momentos</p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
              </button>
            </div>
          </div>
        ) : (
          /* Vista de edición/preview */
          <div className="w-full h-full flex items-center justify-center p-8">
            {/* Preview Container - Aspecto ratio de stories (9:16) */}
            <div className="relative w-full max-w-md aspect-9/16 rounded-3xl overflow-hidden shadow-2xl">
              {storyType === 'text' && (
                <div
                  className="w-full h-full flex items-center justify-center p-8"
                  style={{
                    background: selectedBackground.value,
                  }}
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
                      'w-full h-full bg-transparent border-none outline-none resize-none text-center',
                      fontStyle.className
                    )}
                  />
                </div>
              )}

              {storyType === 'image' && previewUrl && (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              )}

              {storyType === 'video' && previewUrl && (
                <video
                  ref={videoRef}
                  src={previewUrl}
                  controls
                  className="w-full h-full object-cover"
                />
              )}

              {/* Contador de caracteres para texto */}
              {storyType === 'text' && (
                <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
                  <span className="text-white text-sm font-medium">
                    {textContent.length}/250
                  </span>
                </div>
              )}
            </div>

            {/* Panel de herramientas para texto */}
            {storyType === 'text' && (
              <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-4">
                {/* Selector de fondo */}
                <div className="bg-neutral-900/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl">
                  <p className="text-white text-sm font-semibold mb-3">Fondo</p>
                  <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                    {STORY_BACKGROUNDS.map((bg, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedBackground(bg)}
                        className={cn(
                          'w-12 h-12 rounded-xl transition-all',
                          selectedBackground === bg
                            ? 'ring-4 ring-white scale-110'
                            : 'hover:scale-105'
                        )}
                        style={{ background: bg.value }}
                      />
                    ))}
                  </div>
                </div>

                {/* Tamaño de fuente */}
                <div className="bg-neutral-900/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl">
                  <p className="text-white text-sm font-semibold mb-3">Tamaño</p>
                  <div className="flex gap-2">
                    {['S', 'M', 'L'].map((size, index) => (
                      <button
                        key={index}
                        onClick={() => setFontSize(index)}
                        className={cn(
                          'w-10 h-10 rounded-lg font-bold transition-all',
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
                <div className="bg-neutral-900/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl">
                  <p className="text-white text-sm font-semibold mb-3">Alinear</p>
                  <div className="flex gap-2">
                    {(['left', 'center', 'right'] as const).map((align) => (
                      <button
                        key={align}
                        onClick={() => setTextAlign(align)}
                        className={cn(
                          'w-10 h-10 rounded-lg transition-all',
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
            )}
          </div>
        )}
      </div>

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
