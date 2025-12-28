import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function UserForm({ user, onClose, onSuccess }) {
    const [fullName, setFullName] = useState(user?.full_name || '')
    const [mobileNumber, setMobileNumber] = useState(user?.mobile_number || '')
    const [email, setEmail] = useState(user?.email || '')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState(user?.role || 'auditor')
    const [dailyLimit, setDailyLimit] = useState(user?.daily_limit || 50)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const { signUp } = useAuth()
    const isEditing = !!user

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            if (isEditing) {
                const { error: updateError } = await supabase
                    .from('user_profiles')
                    .update({
                        role,
                        daily_limit: parseInt(dailyLimit),
                        full_name: fullName,
                        mobile_number: mobileNumber
                    })
                    .eq('id', user.id)

                if (updateError) throw updateError
            } else {
                const { error } = await signUp(email, password, role, parseInt(dailyLimit), fullName, mobileNumber)
                if (error) throw error
            }

            onSuccess()
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={modalOverlayStyle} className="fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div style={modalContentStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                            {isEditing ? 'Modify Auditor' : 'Register Auditor'}
                        </h2>
                        <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                            {isEditing ? 'Update profile and quotas' : 'Create a new system access'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="interactive-btn"
                        style={{ border: 'none', background: '#f1f5f9', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>Full Name</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                placeholder="John Doe"
                                style={inputStyle}
                            />
                        </div>

                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>Mobile Number</label>
                            <input
                                type="tel"
                                value={mobileNumber}
                                onChange={(e) => setMobileNumber(e.target.value)}
                                required
                                placeholder="017xxxxxxxx"
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isEditing}
                            placeholder="auditor@ecrm.com"
                            style={{ ...inputStyle, opacity: isEditing ? 0.7 : 1, cursor: isEditing ? 'not-allowed' : 'text' }}
                        />
                    </div>

                    {!isEditing && (
                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>Access Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                style={inputStyle}
                            />
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>System Role</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                style={inputStyle}
                            >
                                <option value="auditor">Auditor</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>Daily Limit</label>
                            <input
                                type="number"
                                value={dailyLimit}
                                onChange={(e) => setDailyLimit(e.target.value)}
                                required
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    {error && (
                        <div style={{ color: '#ef4444', fontSize: '12px', marginBottom: '16px', background: '#fef2f2', padding: '10px', borderRadius: '8px', border: '1px solid #fee2e2', fontWeight: '600' }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            className="interactive-btn"
                            style={{ flex: 1, padding: '12px', background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '14px' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="interactive-btn"
                            style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)' }}
                        >
                            {loading ? 'Saving...' : isEditing ? 'Update User' : 'Register User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    pointerEvents: 'auto'
}

const modalContentStyle = {
    background: 'white',
    padding: '32px',
    borderRadius: '24px',
    width: '90%',
    maxWidth: '480px',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
    position: 'relative'
}

const inputGroupStyle = {
    marginBottom: '20px'
}

const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: '800',
    color: '#64748b',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
}

const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#0f172a',
    background: '#f8fafc',
    outline: 'none',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
}
