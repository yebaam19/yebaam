import { cn } from '@/lib/utils'
import React, {useState } from 'react'
import { FONT_SIZES} from '../interfaces/stories.interfaces'
import { STORY_BACKGROUNDS } from '../utils/colors'


const ToolbarStorie = () => {

  const [selectedBackground, setSelectedBackground] = useState(STORY_BACKGROUNDS[0]);
  const [fontSize, setFontSize] = useState(2); // índice en FONT_SIZES

  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  
  // Estados UI
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
 


  return (
   <div className="absolute bottom-0 left-0 right-0 z-10 bg-linear-to-t from-black/80 to-transparent p-4">
          <div className="mx-auto max-w-md space-y-4">
            {/* Color de fondo */}
            <div className="rounded-xl bg-black/60 p-4 backdrop-blur-sm">
              <button
                onClick={() => setShowBackgroundPicker(!showBackgroundPicker)}
                className="mb-3 flex w-full items-center justify-between text-white"
              >
                <span className="font-semibold">Fondo</span>
                <div 
                  className="h-8 w-8 rounded-full border-2 border-white"
                  style={{ background: selectedBackground.value }}
                />
              </button>

              {showBackgroundPicker && (
                <div className="grid grid-cols-5 gap-2">
                  {STORY_BACKGROUNDS.map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => setSelectedBackground(bg)}
                      className={cn(
                        "h-12 w-12 rounded-lg border-2 transition-transform hover:scale-110",
                        selectedBackground.id === bg.id
                          ? "border-white ring-2 ring-white/50"
                          : "border-white/30"
                      )}
                      style={{ background: bg.value }}
                      title={bg.name}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Tamaño de fuente */}
            <div className="rounded-xl bg-black/60 p-4 backdrop-blur-sm">
              <p className="mb-3 font-semibold text-white">Tamaño de texto</p>
              <input
                type="range"
                min="0"
                max={FONT_SIZES.length - 1}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Alineación de texto */}
            <div className="rounded-xl bg-black/60 p-4 backdrop-blur-sm">
              <p className="mb-3 font-semibold text-white">Alineación</p>
              <div className="flex gap-2">
                {(['left', 'center', 'right'] as const).map((align) => (
                  <button
                    key={align}
                    onClick={() => setTextAlign(align)}
                    className={cn(
                      "flex-1 rounded-lg py-2 font-medium transition-colors",
                      textAlign === align
                        ? "bg-primary-600 text-white"
                        : "bg-white/20 text-white hover:bg-white/30"
                    )}
                  >
                    {align === 'left' && 'Izq'}
                    {align === 'center' && 'Centro'}
                    {align === 'right' && 'Der'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
  )
}

export default ToolbarStorie