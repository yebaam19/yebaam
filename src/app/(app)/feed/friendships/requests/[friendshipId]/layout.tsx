'use client'


export default function FriendshipRequestLayout({ children }: { children: React.ReactNode }) {

  return (
    <div>

      {/* Main Content - Mismo estilo que perfil de usuario */}
      <main className="mx-auto max-w-7xl p-4">{children}</main>
    </div>
  )
}
