import { useState, useEffect } from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function AuditorLayout() {
    const { signOut, user } = useAuth()
    const navigate = useNavigate()
    const [isDark, setIsDark] = useState(() => localStorage.getItem('auditor-theme') === 'dark')

    useEffect(() => {
        localStorage.setItem('auditor-theme', isDark ? 'dark' : 'light')
        if (isDark) {
            document.body.classList.add('auditor-dark')
        } else {
            document.body.classList.remove('auditor-dark')
        }
    }, [isDark])

    const handleLogout = async () => {
        await signOut()
        navigate('/login')
    }

    return (
        <div className={isDark ? 'auditor-dark' : ''} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-color)', color: 'var(--text-primary)', transition: 'all 0.3s ease' }}>
            {/* Header */}
            <header style={{
                background: 'var(--surface-color)',
                padding: '12px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                borderBottom: '1px solid var(--border-color)',
                zIndex: 10,
                transition: 'all 0.3s ease'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', padding: '8px 12px', borderRadius: '8px', color: 'white', fontWeight: '900', fontSize: '14px', letterSpacing: '1px' }}>
                        eCRM
                    </div>
                    <nav style={{ display: 'flex', gap: '20px', marginLeft: '20px' }}>
                        <Link to="/auditor" style={{ ...navLinkStyle, color: 'var(--text-primary)' }}>Dashboard</Link>
                    </nav>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Theme Toggle Button */}
                    <button
                        onClick={() => setIsDark(!isDark)}
                        style={{
                            padding: '8px',
                            background: 'var(--surface-color)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            transition: 'all 0.2s',
                            color: 'var(--text-primary)'
                        }}
                        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--bg-color)'
                            e.currentTarget.style.transform = 'scale(1.1)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--surface-color)'
                            e.currentTarget.style.transform = 'scale(1)'
                        }}
                    >
                        {isDark ? '☀️' : '🌙'}
                    </button>

                    <button
                        onClick={handleLogout}
                        style={{
                            padding: '8px 16px',
                            background: isDark ? 'rgba(220, 38, 38, 0.1)' : '#fff5f5',
                            color: '#ef4444',
                            border: '1px solid ' + (isDark ? '#450a0a' : '#feb2b2'),
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '700',
                            transition: 'all 0.2s'
                        }}
                    >
                        Log Out
                    </button>
                </div>
            </header>

            {/* Content Area */}
            <main className="content-padding fade-in" style={{ flex: 1, padding: '30px 40px' }}>
                <div className="dashboard-container">
                    <Outlet context={{ isDark }} />
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
