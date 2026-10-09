import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import NotificationContent from '@/features/notification/components/NotificationContent'
import { NotificationType } from '@/features/notification/interfaces/notification.interfaces'

vi.mock('next-intl', () => ({
  useLocale: () => 'es',
  useTranslations: () => Object.assign(() => 'Notificación del sistema', { has: () => true }),
}))

describe('community chat decision notice', () => {
  it('shows the stored decision text without an empty actor name', () => {
    render(<NotificationContent notification={{
      id: 'notice', userId: 'member', type: NotificationType.SYSTEM,
      actor: { id: '', username: '', displayName: '' },
      message: 'Se limitó tu participación en el chat de una comunidad.',
      metadata: {}, isRead: false, createdAt: '2026-10-09T01:00:00Z',
      targetUrl: '/feed/comunidades/prueba/chat',
    }} />)
    expect(screen.getByText('Se limitó tu participación en el chat de una comunidad.')).toBeInTheDocument()
    expect(screen.queryByText('Notificación del sistema')).not.toBeInTheDocument()
  })
})
