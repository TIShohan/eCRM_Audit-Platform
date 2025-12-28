import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function AuditorLayout() {
    const { signOut, user } = useAuth()
    const navigate = useNavigate()

    const handleLogout = async () => {
        await signOut()
        navigate('/login')
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f7fafc' }}>
            {/* Header */}
            <header style={{
                background: 'white',
                padding: '12px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', padding: '8px 12px', borderRadius: '8px', color: 'white', fontWeight: '900', fontSize: '14px', letterSpacing: '1px' }}>
                        eCRM
                    </div>
                    <nav style={{ display: 'flex', gap: '20px', marginLeft: '20px' }}>
                        <Link to="/auditor" style={navLinkStyle}>Dashboard</Link>
                    </nav>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ textAlign: 'right', display: 'none' }} className="sidebar-text">
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#1a202c' }}>Auditor Session</div>
                        <div style={{ fontSize: '11px', color: '#718096' }}>{user?.email}</div>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            padding: '8px 16px',
                            background: '#fff5f5',
                            color: '#c53030',
                            border: '1px solid #feb2b2',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '700',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#c53030'
                            e.currentTarget.style.color = 'white'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#fff5f5'
                            e.currentTarget.style.color = '#c53030'
                        }}
                    >
                        Log Out
                    </button>
                </div>
            </header>

            {/* Content Area */}
            <main className="content-padding fade-in" style={{ flex: 1, padding: '30px 40px' }}>
                <div className="dashboard-container">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}

const navLinkStyle = {
    fontSize: '14px',
    fontWeight: '600',
    color: '#4a5568',
    textDecoration: 'none'
}
