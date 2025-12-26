import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function AdminLayout() {
    const { signOut, user } = useAuth()
    const navigate = useNavigate()

    const handleLogout = async () => {
        await signOut()
        navigate('/login')
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar */}
            <aside style={{
                width: '250px',
                background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <h2 style={{ marginBottom: '30px', fontSize: '20px' }}>Admin Panel</h2>

                <nav style={{ flex: 1 }}>
                    <Link to="/admin" style={linkStyle}>
                        📊 Dashboard
                    </Link>
                    <Link to="/admin/users" style={linkStyle}>
                        👥 User Management
                    </Link>
                    <Link to="/admin/data" style={linkStyle}>
                        📁 Data Management
                    </Link>
                    <Link to="/admin/questions" style={linkStyle}>
                        ❓ Questions
                    </Link>
                    <Link to="/admin/reports" style={linkStyle}>
                        📈 Reports
                    </Link>
                </nav>

                <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                    <p style={{ fontSize: '14px', marginBottom: '10px', opacity: 0.8 }}>
                        {user?.email}
                    </p>
                    <button
                        onClick={handleLogout}
                        style={{
                            width: '100%',
                            padding: '10px',
                            background: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                        onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                    >
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{
                flex: 1,
                padding: '30px',
                background: '#f5f7fa',
                overflowY: 'auto'
            }}>
                <Outlet />
            </main>
        </div>
    )
}

const linkStyle = {
    display: 'block',
    padding: '12px 16px',
    marginBottom: '8px',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '6px',
    transition: 'background 0.2s',
    fontSize: '15px'
}
