import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function AdminLayout() {
    const { signOut, user } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const handleLogout = async () => {
        await signOut()
        navigate('/login')
    }

    const isActive = (path) => {
        if (path === '/admin') return location.pathname === '/admin'
        return location.pathname.startsWith(path)
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
            {/* Sidebar */}
            <aside className="sidebar-width" style={{
                width: '280px',
                background: '#0f172a', // Deep slate for premium feel
                color: 'white',
                padding: '32px 20px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '10px 0 30px rgba(0,0,0,0.1)',
                zIndex: 10,
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decorative background element */}
                <div style={{
                    position: 'absolute',
                    top: '-10%',
                    left: '-10%',
                    width: '100%',
                    height: '40%',
                    background: 'radial-gradient(circle, rgba(79, 70, 229, 0.15) 0%, rgba(15, 23, 42, 0) 70%)',
                    pointerEvents: 'none'
                }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '48px', padding: '0 8px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '900',
                        fontSize: '20px',
                        boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                    }}>
                        E
                    </div>
                    <div>
                        <h2 className="sidebar-text" style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '0.02em', margin: 0 }}>ECRM Audit</h2>
                        <span className="sidebar-text" style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em' }}>v2.0 Platform</span>
                    </div>
                </div>

                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <SidebarLink to="/admin" icon="📊" label="Dashboard" active={isActive('/admin')} />
                    <SidebarLink to="/admin/users" icon="👥" label="User Management" active={isActive('/admin/users')} />
                    <SidebarLink to="/admin/data" icon="📦" label="Audit Inventory" active={isActive('/admin/data')} />
                    <SidebarLink to="/admin/questions" icon="📝" label="Question Bank" active={isActive('/admin/questions')} />
                    <SidebarLink to="/admin/reports" icon="📊" label="Analytics & Export" active={isActive('/admin/reports')} />
                </nav>

                <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
                    <div className="sidebar-text" style={{
                        padding: '16px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '12px',
                        marginBottom: '20px',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '32px', height: '32px', background: '#334155', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>👤</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>ADMINISTRATOR</div>
                                <div style={{ fontSize: '12px', color: 'white', opacity: 0.9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="interactive-btn"
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#f87171',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px'
                        }}
                    >
                        <span>🚪</span>
                        <span className="sidebar-text">Logout System</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="content-padding fade-in" style={{
                flex: 1,
                padding: '40px',
                overflowY: 'auto',
                height: '100vh'
            }}>
                <div className="dashboard-container">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}

function SidebarLink({ to, icon, label, active }) {
    return (
        <Link to={to} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            color: active ? 'white' : '#94a3b8',
            textDecoration: 'none',
            borderRadius: '12px',
            fontSize: '14.5px',
            fontWeight: active ? '600' : '500',
            background: active ? 'rgba(79, 70, 229, 0.15)' : 'transparent',
            borderRight: active ? '3px solid #6366f1' : '3px solid transparent',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            marginBottom: '4px'
        }}
            onMouseEnter={(e) => {
                if (!active) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                    e.currentTarget.style.color = 'white'
                }
            }}
            onMouseLeave={(e) => {
                if (!active) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#94a3b8'
                }
            }}
        >
            <span style={{
                fontSize: '18px',
                opacity: active ? 1 : 0.7,
                filter: active ? 'drop-shadow(0 0 5px rgba(99, 102, 241, 0.5))' : 'none'
            }}>{icon}</span>
            <span className="sidebar-text" style={{ flex: 1 }}>{label}</span>
            {active && (
                <div style={{ width: '4px', height: '4px', background: '#6366f1', borderRadius: '50%', boxShadow: '0 0 8px #6366f1' }}></div>
            )}
        </Link>
    )
}
