import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { firebaseUser, loading, profile } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="flex min-h-svh items-center justify-center">로딩 중...</div>
  }

  if (!firebaseUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!profile) {
    return <Navigate to="/onboarding" replace />
  }

  if (profile.isBlocked) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-gray-100 p-6 text-center text-sm text-gray-700">
        관리자에 의해 계정이 제한되었습니다. 운영진에게 문의해주세요.
      </div>
    )
  }

  return children
}
