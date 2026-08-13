import { useEffect, type ReactNode } from 'react'
import { Navigate, Outlet, useNavigate } from 'react-router-dom'
import {
  AUTH_SESSION_EXPIRED_EVENT,
  clearAuthSession,
  getAccessToken,
  getUserRole,
} from '@/utils/authSession'

type SupportedRole = 'LANDLORD' | 'CONTRACTOR'

export function AuthSessionExpirationHandler() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleExpiredSession = () => navigate('/login', { replace: true })
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleExpiredSession)
    return () => window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleExpiredSession)
  }, [navigate])

  return null
}

export default function RequireRole({
  role,
  children,
}: {
  role: SupportedRole
  children?: ReactNode
}) {
  const accessToken = getAccessToken()
  const currentRole = getUserRole()

  if (!accessToken) return <Navigate to="/login" replace />

  if (currentRole !== 'LANDLORD' && currentRole !== 'CONTRACTOR') {
    clearAuthSession()
    return <Navigate to="/login" replace />
  }

  if (currentRole !== role) {
    return <Navigate to={currentRole === 'LANDLORD' ? '/' : '/contractor'} replace />
  }

  return children ?? <Outlet />
}
