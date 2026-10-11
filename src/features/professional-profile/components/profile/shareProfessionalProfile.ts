import { toast } from 'sonner'

export async function shareProfessionalProfile(username: string) {
  const profileUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/professional-profile/${username}` : ''

    try {
      // Copiar URL al clipboard
      await navigator.clipboard.writeText(profileUrl)
      toast.success('¡URL copiada al portapapeles!', {
        description: profileUrl,
        duration: 4000,
      })
    } catch (error) {
      console.error('Error copying to clipboard:', error)

      // Fallback manual si clipboard API falla
      const textArea = document.createElement('textarea')
      textArea.value = profileUrl
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.select()

      try {
        document.execCommand('copy')
        toast.success('¡URL copiada al portapapeles!')
      } catch (err) {
        toast.error('No se pudo copiar la URL. Por favor, cópiala manualmente.')
        console.error('Fallback copy failed:', err)
      }

      document.body.removeChild(textArea)
    }
}
