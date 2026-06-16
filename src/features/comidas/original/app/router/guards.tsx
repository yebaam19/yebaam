import { Navigate } from 'react-router-dom'

type AdminGuardProps = {
  children: React.ReactNode
}

export function AdminGuard({ children }: AdminGuardProps) {
  const rawUser = localStorage.getItem('auth_user')

  if (!rawUser) {
    return <Navigate to="/login" replace />
  }

  try {
    const user = JSON.parse(rawUser)
    const role = user?.role

    if (role !== 'ADMIN' && role !== 'BUSINESS_ADMIN') {
      return <Navigate to="/" replace />
    }

    return <>{children}</>
  } catch {
    return <Navigate to="/login" replace />
  }
}