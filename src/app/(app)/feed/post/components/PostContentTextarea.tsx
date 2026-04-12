import { cn } from '@/lib/utils'
import { FieldErrors, UseFormRegister } from 'react-hook-form'
import { BACKGROUND_COLORS } from '../constants/post.constants'
import type { CreatePostInput } from '../validators/create-post.validator'

interface PostContentTextareaProps {
  register: UseFormRegister<CreatePostInput>
  errors: FieldErrors<CreatePostInput>
  userName: string
  backgroundColor?: string
  hasFiles: boolean
  isDisabled?: boolean
}

export default function PostContentTextarea({
  register,
  errors,
  userName,
  backgroundColor,
  hasFiles,
  isDisabled,
}: PostContentTextareaProps) {
  // Encontrar el color seleccionado para obtener el textColor correcto
  const selectedColor = BACKGROUND_COLORS.find((c) => c.value === backgroundColor)
  const textColor = backgroundColor ? selectedColor?.textColor || '#ffffff' : undefined

  return (
    <div className="relative">
      <textarea
        {...register('content')}
        placeholder={`¿Qué estás pensando, ${userName}?`}
        disabled={isDisabled}
        style={
          backgroundColor
            ? {
                backgroundColor: backgroundColor,
                color: textColor,
              }
            : undefined
        }
        className={cn(
          'w-full resize-none border-0 focus:ring-0 focus:outline-none',
          backgroundColor
            ? 'rounded-lg p-6 text-center text-xl font-semibold placeholder:opacity-50'
            : 'bg-transparent text-neutral-900 placeholder-neutral-500 dark:text-white dark:placeholder-neutral-400'
        )}
        rows={backgroundColor ? 4 : hasFiles ? 3 : 6}
      />
      {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>}
    </div>
  )
}
