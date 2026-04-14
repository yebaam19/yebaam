import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s · Yebaam Admin',
    default: 'Yebaam Admin',
  },
  robots: { index: false, follow: false },
}

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-neutral-100 text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100">
      {children}
    </div>
  )
}
