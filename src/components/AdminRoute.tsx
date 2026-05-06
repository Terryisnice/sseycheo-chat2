import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ProtectedRoute } from './ProtectedRoute'

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth()

  return (
    <ProtectedRoute>
      {profile?.role === 'admin' ? children : <Navigate to="/lobby" replace />}
    </ProtectedRoute>
  )
}
