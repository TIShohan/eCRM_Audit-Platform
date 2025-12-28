import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children, requireAdmin = false }) {
    const { user, profile, loading, isActive } = useAuth()

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                color: '#6b7280'
            }}>
                Loading...
            </div>
        )
    }

    if (!user || !isActive) {
        return <Navigate to="/login" replace />
    }

    if (requireAdmin && profile?.role !== 'admin') {
        return <Navigate to="/auditor" replace />
    }

    return children
}
