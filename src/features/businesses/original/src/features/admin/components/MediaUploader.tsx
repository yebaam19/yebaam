import { useState, type ChangeEvent } from 'react'
import Button from '../../../components/ui/Button'
import Card, {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card'

interface MediaUploaderProps {
  onUpload?: (files: FileList | null) => void
}

export default function MediaUploader({ onUpload }: MediaUploaderProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files
    const nextFiles = files ? Array.from(files) : []
    setSelectedFiles(nextFiles)
    onUpload?.(files)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subir fotos o videos</CardTitle>
        <CardDescription>
          Agrega contenido visual que ayude a entender mejor tu carta, ambiente y propuesta.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-orange-400 hover:bg-orange-50">
          <span className="text-base font-semibold text-slate-900">
            Arrastra archivos aquí o haz clic para seleccionarlos
          </span>
          <span className="mt-2 text-sm text-slate-500">
            Usa imágenes o videos ligeros para mantener la carga rápida.
          </span>

          <input
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={handleChange}
          />
        </label>

        {selectedFiles.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-900">
              Archivos listos para subir
            </p>

            <div className="space-y-2">
              {selectedFiles.map((file) => (
                <div
                  key={`${file.name}-${file.size}`}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600"
                >
                  {file.name}
                </div>
              ))}
            </div>

            <Button onClick={() => console.log('subir archivos')}>
              Confirmar subida
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
