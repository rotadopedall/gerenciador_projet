import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export default function AuthGuard({ children }) {
  const { session } = useAuthStore()
  if (!session) return <Navigate to="/login" replace />
  return children
}
