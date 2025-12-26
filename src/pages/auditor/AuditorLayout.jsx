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
                padding: '15px 40px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#4f46e5' }}>eCRM Audit</h2>
                    <nav style={{ display: 'flex', gap: '20px', marginLeft: '30px' }}>
                        <Link to="/auditor" style={navLinkStyle}>Dashboard</Link>
                        {/* We don't link to the interface directly; the dashboard handles the entry */}
                    </nav>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <span style={{ fontSize: '14px', color: '#718096' }}>{user?.email}</span>
                    <button
                        onClick={handleLogout}
                        style={{
                            padding: '6px 15px',
                            background: '#fff5f5',
                            color: '#c53030',
                            border: '1px solid #feb2b2',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600'
                        }}
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            {/* Content Area */}
            <main style={{ flex: 1, padding: '30px 40px' }}>
                <Outlet />
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
