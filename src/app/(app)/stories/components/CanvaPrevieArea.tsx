import { useAuth } from '@/features/auth';
import { cn } from '@/lib/utils';

import {
  PhotoIcon,
  VideoCameraIcon,
    PaintBrushIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import React, { ChangeEvent, useRef, useState } from 'react'
import { toast } from 'sonner';
import { StoryType, FONT_STYLES, FONT_SIZES } from '../interfaces/stories.interfaces';
import { STORY_BACKGROUNDS } from '../utils/colors';

const CanvaPrevieArea = () => {
      const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Estados principales
  const [storyType, setStoryType] = useState<StoryType | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Estados para story de texto
  const [textContent, setTextContent] = useState('');
  const [selectedBackground, setSelectedBackground] = useState(STORY_BACKGROUNDS[0]);
  const [fontSize, setFontSize] = useState(2); // índice en FONT_SIZES
  const [fontStyle, setFontStyle] = useState(FONT_STYLES[0]);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  
  // Estados UI
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Validación de archivos
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
  const MAX_IMAGE_SIZE_MB = 10;
  const MAX_VIDEO_SIZE_MB = 50;
  const MAX_VIDEO_DURATION = 60; // 60 segundos

  // Manejadores
  const handleBack = () => {
    if (confirm('¿Descartar esta historia?')) {
      router.back();
    }
  };

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

    // Validar tamaño
    const maxSize = isVideo ? MAX_VIDEO_SIZE_MB : MAX_IMAGE_SIZE_MB;
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`El archivo excede ${maxSize}MB`);
      return;
    }

    // Validar duración del video
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
    if (isUploading) return;

    if (storyType === 'text' && !textContent.trim()) {
      toast.error('Escribe algo para tu historia');
      return;
    }

    if ((storyType === 'image' || storyType === 'video') && !selectedFile) {
      toast.error('Selecciona un archivo');
      return;
    }

    setIsUploading(true);

    try {
      // TODO: Implementar llamada al backend
      // const formData = new FormData();
      // formData.append('type', storyType);
      // if (selectedFile) formData.append('file', selectedFile);
      // if (storyType === 'text') {
      //   formData.append('content', textContent);
      //   formData.append('background', selectedBackground.value);
      //   formData.append('fontSize', FONT_SIZES[fontSize]);
      //   formData.append('fontStyle', fontStyle.className);
      //   formData.append('textAlign', textAlign);
      // }
      // await createStory(formData);

      // Simulación
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Historia publicada exitosamente');
      router.push('/feed');
    } catch (error) {
      console.error('Error creating story:', error);
      toast.error('Error al publicar la historia');
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) return null;
  return (
  <div className="flex h-full items-center justify-center p-4">
         <div className="relative h-full max-h-[90vh] w-full max-w-md overflow-hidden rounded-2xl shadow-2xl">
           {!storyType ? (
             // Selector de tipo de historia
             <div className="flex h-full flex-col items-center justify-center gap-6 bg-neutral-900 p-8">
               <h2 className="text-2xl font-bold text-white mb-4">Crea tu historia</h2>
               
               <button
                 onClick={() => handleTypeSelect('text')}
                 className="group relative w-full overflow-hidden rounded-2xl bg-linear-to-br from-primary-600 to-primary-800 p-8 text-white transition-transform hover:scale-105"
               >
                 <div className="flex flex-col items-center gap-3">
                   <PaintBrushIcon className="h-16 w-16" />
                   <span className="text-xl font-semibold">Crear historia de texto</span>
                 </div>
               </button>
 
               <button
                 onClick={() => handleTypeSelect('image')}
                 className="group relative w-full overflow-hidden rounded-2xl bg-linear-to-br from-green-600 to-emerald-800 p-8 text-white transition-transform hover:scale-105"
               >
                 <div className="flex flex-col items-center gap-3">
                   <PhotoIcon className="h-16 w-16" />
                   <span className="text-xl font-semibold">Foto</span>
                 </div>
               </button>
 
               <button
                 onClick={() => handleTypeSelect('video')}
                 className="group relative w-full overflow-hidden rounded-2xl bg-linear-to-br from-red-600 to-pink-800 p-8 text-white transition-transform hover:scale-105"
               >
                 <div className="flex flex-col items-center gap-3">
                   <VideoCameraIcon className="h-16 w-16" />
                   <span className="text-xl font-semibold">Video</span>
                 </div>
               </button>
 
               <input
                 ref={fileInputRef}
                 type="file"
                 accept="image/*,video/*"
                 onChange={handleFileSelect}
                 className="hidden"
               />
             </div>
           ) : storyType === 'text' ? (
             // Editor de texto
             <div
               className="relative flex h-full w-full items-center justify-center p-8"
               style={{
                 background: selectedBackground.value,
               }}
             >
               <textarea
                 value={textContent}
                 onChange={(e) => setTextContent(e.target.value)}
                 placeholder="Empieza a escribir..."
                 maxLength={500}
                 className={cn(
                   "w-full resize-none bg-transparent text-center outline-none placeholder:opacity-50",
                   FONT_SIZES[fontSize],
                   fontStyle.className
                 )}
                 style={{
                   color: selectedBackground.textColor,
                   textAlign: textAlign,
                 }}
                 rows={5}
               />
 
               {/* Contador de caracteres */}
               <div className="absolute bottom-4 right-4 text-xs opacity-60"
                 style={{ color: selectedBackground.textColor }}
               >
                 {textContent.length}/500
               </div>
             </div>
           ) : (
             // Preview de imagen/video
             <div className="relative h-full w-full bg-black">
               {storyType === 'image' && previewUrl && (
                 <img
                   src={previewUrl}
                   alt="Story preview"
                   className="h-full w-full object-contain"
                 />
               )}
               {storyType === 'video' && previewUrl && (
                 <video
                   ref={videoRef}
                   src={previewUrl}
                   className="h-full w-full object-contain"
                   controls
                   playsInline
                   muted
                 />
               )}
             </div>
           )}
         </div>
       </div>
 
  )
}

export default CanvaPrevieArea