import { redirect } from 'next/navigation'
import type { Route } from 'next'

export const dynamic = 'force-dynamic'

export default function ChatPublicoIndexPage() {
  redirect('/feed/chat-publico/general' as Route)
}
