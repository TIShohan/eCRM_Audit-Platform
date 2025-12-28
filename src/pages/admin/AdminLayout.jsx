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
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
            {/* Minimal Top Header */}
            <header style={{
                background: 'white',
                padding: '0 40px',
                height: '72px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                position: 'sticky',
                top: 0,
                zIndex: 1000
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '40px', height: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            padding: '6px 10px',
                            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '900',
                            color: 'white',
                            fontSize: '13px',
                            letterSpacing: '0.05em'
                        }}>eCRM</div>
                        <span style={{ fontWeight: '800', fontSize: '18px', color: '#0f172a', letterSpacing: '-0.02em' }}>Admin Portal</span>
                    </div>

                    <nav style={{ display: 'flex', gap: '8px', height: '100%' }}>
                        <HeaderLink to="/admin" label="Overview" active={isActive('/admin')} />
                        <HeaderLink to="/admin/users" label="Auditors" active={isActive('/admin/users')} />
                        <HeaderLink to="/admin/data" label="Inventory" active={isActive('/admin/data')} />
                        <HeaderLink to="/admin/questions" label="Questions" active={isActive('/admin/questions')} />
                        <HeaderLink to="/admin/reports" label="Analytics" active={isActive('/admin/reports')} />
                    </nav>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ textAlign: 'right', marginRight: '10px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a' }}>Administrator</div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>{user?.email}</div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="interactive-btn"
                        style={{
                            padding: '8px 16px',
                            background: '#fef2f2',
                            color: '#ef4444',
                            border: '1px solid #fee2e2',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '700'
                        }}
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Content Area */}
            <main className="fade-in" style={{ flex: 1, padding: '40px' }}>
                <div className="dashboard-container">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}

function HeaderLink({ to, label, active }) {
    return (
        <Link to={to} style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            color: active ? '#4f46e5' : '#64748b',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: active ? '700' : '600',
            position: 'relative',
            height: '100%',
            transition: 'all 0.2s'
        }}>
            {label}
            {active && (
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: '16px',
                    right: '16px',
                    height: '3px',
                    background: '#4f46e5',
                    borderRadius: '3px 3px 0 0'
                }}></div>
            )}
        </Link>
    )
}
