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
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f7fa' }}>
            {/* Sidebar */}
            <aside className="sidebar-width" style={{
                width: '260px',
                background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)',
                color: 'white',
                padding: '24px 16px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '4px 0 10px rgba(0,0,0,0.05)',
                transition: 'width 0.3s ease'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', padding: '0 8px' }}>
                    <div style={{ width: '32px', height: '32px', background: '#4f46e5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' }}>A</div>
                    <h2 className="sidebar-text" style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '0.05em' }}>ADMIN</h2>
                </div>

                <nav style={{ flex: 1 }}>
                    <SidebarLink to="/admin" icon="📊" label="Dashboard" />
                    <SidebarLink to="/admin/users" icon="👥" label="Users" />
                    <SidebarLink to="/admin/data" icon="📁" label="Data" />
                    <SidebarLink to="/admin/questions" icon="❓" label="Questions" />
                    <SidebarLink to="/admin/reports" icon="📈" label="Reports" />
                </nav>

                <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="sidebar-text" style={{ padding: '0 8px', marginBottom: '15px' }}>
                        <div style={{ fontSize: '11px', color: '#818cf8', fontWeight: '700', textTransform: 'uppercase' }}>Active Admin</div>
                        <div style={{ fontSize: '13px', color: 'white', opacity: 0.9, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.15)'
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                        }}
                    >
                        <span>🚪</span>
                        <span className="sidebar-text">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="content-padding fade-in" style={{
                flex: 1,
                padding: '30px',
                overflowY: 'auto'
            }}>
                <div className="dashboard-container">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}

function SidebarLink({ to, icon, label }) {
    return (
        <Link to={to} style={linkStyle}>
            <span style={{ fontSize: '18px' }}>{icon}</span>
            <span className="sidebar-text">{label}</span>
        </Link>
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
