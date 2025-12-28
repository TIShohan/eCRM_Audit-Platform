import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { signIn, user, profile, isActive, signOut } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (user && profile) {
            if (profile.is_active === false) {
                setError('Your account has been deactivated. Please contact the administrator.')
                signOut()
                return
            }

            if (profile.role === 'admin') {
                navigate('/admin')
            } else {
                navigate('/auditor')
            }
        }
    }, [user, profile, navigate, signOut])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const { data, error } = await signIn(email, password)
            if (error) throw error
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8fafc',
            backgroundImage: `radial-gradient(circle at 0% 0%, rgba(79, 70, 229, 0.05) 0%, transparent 40%), 
                             radial-gradient(circle at 100% 100%, rgba(124, 58, 237, 0.05) 0%, transparent 40%)`,
            padding: '24px'
        }}>
            <div className="fade-in" style={{
                background: 'white',
                padding: '48px',
                borderRadius: '32px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.01)',
                width: '100%',
                maxWidth: '440px'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                        padding: '12px 24px',
                        borderRadius: '16px',
                        marginBottom: '24px',
                        boxShadow: '0 8px 24px rgba(79, 70, 229, 0.2)'
                    }}>
                        <span style={{ fontSize: '18px', fontWeight: '900', color: 'white', letterSpacing: '0.02em' }}>eCRM Audit Platform</span>
                    </div>
                    <h1 style={{
                        fontSize: '32px',
                        fontWeight: '800',
                        color: '#0f172a',
                        letterSpacing: '-0.02em',
                        marginBottom: '8px'
                    }}>
                        Sign In
                    </h1>
                    <p style={{
                        color: '#64748b',
                        fontSize: '15px',
                        fontWeight: '500'
                    }}>
                        Enter your credentials to access the portal
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={labelStyle}>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="name@company.com"
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                        <label style={labelStyle}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            style={inputStyle}
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: '12px 16px',
                            background: '#fef2f2',
                            borderRadius: '12px',
                            marginBottom: '24px',
                            color: '#b91c1c',
                            fontSize: '13px',
                            fontWeight: '600',
                            border: '1px solid #fee2e2',
                            display: 'flex',
                            gap: '10px'
                        }}>
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="interactive-btn"
                        style={{
                            width: '100%',
                            padding: '16px',
                            background: loading ? '#94a3b8' : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '14px',
                            fontSize: '16px',
                            fontWeight: '800',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            boxShadow: loading ? 'none' : '0 6px 20px rgba(79, 70, 229, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px'
                        }}
                    >
                        {loading ? 'Authenticating...' : 'Sign In to Portal'}
                        {!loading && <span style={{ fontSize: '18px' }}>→</span>}
                    </button>
                </form>

                <div style={{
                    marginTop: '40px',
                    paddingTop: '24px',
                    borderTop: '1px solid #f1f5f9',
                    textAlign: 'center',
                    fontSize: '13px',
                    color: '#94a3b8',
                    fontWeight: '500'
                }}>
                    Protected by Enterprise Security
                </div>
            </div>
        </div>
    )
}

const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '8px'
}

const inputStyle = {
    width: '100%',
    padding: '14px 18px',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    fontSize: '15px',
    fontWeight: '600',
    background: '#f8fafc',
    outline: 'none',
    color: '#0f172a',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
}
