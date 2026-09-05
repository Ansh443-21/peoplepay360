import { Navigate, useLocation } from 'react-router-dom'
import { useAuth, ROLE_DEFAULT_ROUTES } from '../context/AuthContext.jsx'
import { ShieldAlert } from 'lucide-react'

export default function ProtectedRoute({ children, path }) {
  const { role, canAccessRoute } = useAuth()
  const location = useLocation()
  const checkPath = path || location.pathname

  if (!canAccessRoute(checkPath)) {
    const fallback = ROLE_DEFAULT_ROUTES[role] || '/employees'
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        textAlign: 'center'
      }}>
        <ShieldAlert size={48} style={{ color: 'var(--status-expired-text)', marginBottom: '16px' }} />
        <h2 style={{ margin: '0 0 8px', color: 'var(--text-heading)' }}>Access Restricted</h2>
        <p style={{ margin: '0 0 20px', color: 'var(--text-muted)', maxWidth: '480px' }}>
          Your current role (<strong>{role}</strong>) does not have permission to access this module.
        </p>
        <Navigate to={fallback} replace />
      </div>
    )
  }

  return children
}
