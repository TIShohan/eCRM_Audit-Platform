import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import UserForm from '../../components/admin/UserForm'
import AdminPageHeader from '../../components/admin/AdminPageHeader'

export default function UserManagement() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingUser, setEditingUser] = useState(null)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const { data: profiles, error: profileError } = await supabase
                .from('user_profiles')
                .select('id, email, full_name, mobile_number, role, daily_limit, is_active, created_at')
                .not('email', 'like', 'deleted_%') // HIDE SOFT DELETED USERS
                .order('created_at', { ascending: false })

            if (profileError) throw profileError

            const usersWithMetrics = await Promise.all(profiles.map(async (profile) => {
                if (profile.role === 'admin') return { ...profile, assigned: '-', completed: '-' }

                const { count: assignedCount } = await supabase
                    .from('audit_data')
                    .select('*', { count: 'exact', head: true })
                    .eq('assigned_to', profile.id)
                    .eq('is_archived', false)

                const { count: completedCount } = await supabase
                    .from('audit_data')
                    .select('*', { count: 'exact', head: true })
                    .eq('assigned_to', profile.id)
                    .eq('status', 'completed')
                    .eq('is_archived', false)

                return {
                    ...profile,
                    assigned: assignedCount || 0,
                    completed: completedCount || 0
                }
            }))

            setUsers(usersWithMetrics)
        } catch (error) {
            console.error('Error fetching users:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleToggleStatus = async (user) => {
        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({ is_active: !user.is_active })
                .eq('id', user.id)

            if (error) throw error
            fetchUsers()
        } catch (error) {
            console.error('Error toggling status:', error)
            alert('Failed to update status')
        }
    }

    const handleOpenForm = (user = null) => {
        setEditingUser(user)
        setIsFormOpen(true)
    }

    const handleCloseForm = () => {
        setEditingUser(null)
        setIsFormOpen(false)
    }

    const handleFormSuccess = () => {
        handleCloseForm()
        fetchUsers()
    }

    return (
        <div className="fade-in">
            <AdminPageHeader
                title="Auditor Network"
                subtitle="Manage access, quotas, and track individual performance metrics."
                action={
                    <button
                        className="interactive-btn"
                        style={{
                            padding: '12px 24px',
                            background: '#4f46e5',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: '700',
                            fontSize: '14px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                        }}
                        onClick={() => handleOpenForm()}
                    >
                        ＋ Create New User
                    </button>
                }
            />

            {isFormOpen && (
                <UserForm
                    user={editingUser}
                    onClose={handleCloseForm}
                    onSuccess={handleFormSuccess}
                />
            )}

            <div style={{
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                overflow: 'hidden',
                border: '1px solid #e2e8f0'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                            <th style={thStyle}>Identity</th>
                            <th style={thStyle}>Contact</th>
                            <th style={thStyle}>Access Role</th>
                            <th style={thStyle}>Daily Quota</th>
                            <th style={thStyle}>Status</th>
                            <th style={thStyle}>Claimed</th>
                            <th style={thStyle}>Done</th>
                            <th style={thStyle}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="8" style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Fetching auditor profiles...</td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>No users registered.</td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                                    <td style={tdStyle}>
                                        <div style={{ fontWeight: '700', color: '#0f172a' }}>{user.full_name || 'N/A'}</div>
                                        <div style={{ fontSize: '12px', color: '#64748b' }}>{user.email}</div>
                                    </td>
                                    <td style={tdStyle}>{user.mobile_number || 'N/A'}</td>
                                    <td style={tdStyle}>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            fontSize: '11px',
                                            fontWeight: '800',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            background: user.role === 'admin' ? '#f5f3ff' : '#eff6ff',
                                            color: user.role === 'admin' ? '#7c3aed' : '#3b82f6',
                                            border: `1px solid ${user.role === 'admin' ? '#ddd6fe' : '#dbeafe'}`
                                        }}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td style={{ ...tdStyle, fontWeight: '700' }}>{user.daily_limit}</td>
                                    <td style={tdStyle}>
                                        <button
                                            onClick={() => handleToggleStatus(user)}
                                            style={{
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontSize: '10px',
                                                fontWeight: '900',
                                                textTransform: 'uppercase',
                                                cursor: 'pointer',
                                                border: '1px solid',
                                                background: user.is_active !== false ? '#ecfdf5' : '#fef2f2',
                                                color: user.is_active !== false ? '#10b981' : '#ef4444',
                                                borderColor: user.is_active !== false ? '#10b981' : '#ef4444',
                                                transition: 'all 0.2s'
                                            }}
                                            className="interactive-btn"
                                        >
                                            {user.is_active !== false ? '● Active' : '○ Inactive'}
                                        </button>
                                    </td>
                                    <td style={tdStyle}>{user.assigned}</td>
                                    <td style={{ ...tdStyle, color: '#10b981', fontWeight: '700' }}>{user.completed}</td>
                                    <td style={tdStyle}>
                                        <button
                                            className="interactive-btn"
                                            style={{
                                                color: '#4f46e5',
                                                border: '1px solid #e2e8f0',
                                                background: 'white',
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontWeight: '700',
                                                fontSize: '12px'
                                            }}
                                            onClick={() => handleOpenForm(user)}
                                        >
                                            Modify
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

const thStyle = {
    padding: '16px 20px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
}

const tdStyle = {
    padding: '16px 20px',
    fontSize: '14px',
    color: '#334155',
    verticalAlign: 'middle'
}
