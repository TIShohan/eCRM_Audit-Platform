import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function UserForm({ user, onClose, onSuccess }) {
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
                        daily_limit: parseInt(dailyLimit)
                    })
                    .eq('id', user.id)

                if (updateError) throw updateError
            } else {
                const { error } = await signUp(email, password, role, parseInt(dailyLimit))
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
        <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
                <h2 style={{ marginBottom: '20px' }}>{isEditing ? 'Edit User' : 'Create New User'}</h2>

                <form onSubmit={handleSubmit}>
                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isEditing}
                            style={inputStyle}
                        />
                    </div>

                    {!isEditing && (
                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={inputStyle}
                            />
                        </div>
                    )}

                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>Role</label>
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

                    {error && <p style={{ color: 'red', fontSize: '14px', marginBottom: '15px' }}>{error}</p>}

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <button type="button" onClick={onClose} style={cancelButtonStyle}>Cancel</button>
                        <button type="submit" disabled={loading} style={submitButtonStyle}>
                            {loading ? 'Processing...' : isEditing ? 'Update User' : 'Create User'}
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
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
}

const modalContentStyle = {
    background: 'white',
    padding: '30px',
    borderRadius: '8px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
}

const inputGroupStyle = {
    marginBottom: '15px'
}

const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '5px',
    color: '#4a5568'
}

const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #cbd5e0',
    borderRadius: '4px',
    fontSize: '14px'
}

const cancelButtonStyle = {
    padding: '8px 16px',
    background: '#edf2f7',
    color: '#4a5568',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
}

const submitButtonStyle = {
    padding: '8px 16px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
}
