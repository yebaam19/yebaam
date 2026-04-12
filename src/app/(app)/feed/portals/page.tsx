/**
 * Portals Index Page
 *
 * Página principal de portales que redirige al portal de la salsa
 */

import { redirect } from 'next/navigation'

export default function PortalsPage() {
  // Por ahora redirige al único portal disponible
  redirect('/feed/portals/salsa')
}
