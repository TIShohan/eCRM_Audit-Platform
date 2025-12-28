import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import UserForm from '../../components/admin/UserForm'

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
            // Fetch profiles
            const { data: profiles, error: profileError } = await supabase
                .from('user_profiles')
                .select('id, email, role, daily_limit, created_at')
                .order('created_at', { ascending: false })

            if (profileError) throw profileError

            // Fetch metrics for each auditor
            const usersWithMetrics = await Promise.all(profiles.map(async (profile) => {
                if (profile.role === 'admin') return { ...profile, assigned: '-', completed: '-' }

                const { count: assignedCount } = await supabase
                    .from('audit_data')
                    .select('*', { count: 'exact', head: true })
                    .eq('assigned_to', profile.id)

                const { count: completedCount } = await supabase
                    .from('audit_data')
                    .select('*', { count: 'exact', head: true })
                    .eq('assigned_to', profile.id)
                    .eq('status', 'completed')

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
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1a202c' }}>
                    User Management
                </h1>
                <button
                    style={{
                        padding: '10px 20px',
                        background: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                    onClick={() => handleOpenForm()}
                >
                    + Create User
                </button>
            </div>

            {isFormOpen && (
                <UserForm
                    user={editingUser}
                    onClose={handleCloseForm}
                    onSuccess={handleFormSuccess}
                />
            )}

            <div style={{
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                overflow: 'hidden'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#f7fafc', borderBottom: '1px solid #edf2f7' }}>
                            <th style={thStyle}>User Email</th>
                            <th style={thStyle}>Role</th>
                            <th style={thStyle}>Limit</th>
                            <th style={thStyle}>Assigned</th>
                            <th style={thStyle}>Completed</th>
                            <th style={thStyle}>Created At</th>
                            <th style={thStyle}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="7" style={{ padding: '20px', textAlign: 'center' }}>Loading users...</td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ padding: '20px', textAlign: 'center' }}>No users found.</td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                                    <td style={tdStyle}>{user.email || 'No Email'}</td>
                                    <td style={tdStyle}>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            textTransform: 'uppercase',
                                            background: user.role === 'admin' ? '#e9d8fd' : '#bee3f8',
                                            color: user.role === 'admin' ? '#553c9a' : '#2b6cb0'
                                        }}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td style={tdStyle}>{user.daily_limit}</td>
                                    <td style={tdStyle}>{user.assigned}</td>
                                    <td style={tdStyle}>{user.completed}</td>
                                    <td style={tdStyle}>{new Date(user.created_at).toLocaleDateString()}</td>
                                    <td style={tdStyle}>
                                        <button
                                            style={{ color: '#667eea', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '600' }}
                                            onClick={() => handleOpenForm(user)}
                                        >
                                            Edit
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
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#4a5568'
}

const tdStyle = {
    padding: '12px 20px',
    fontSize: '14px',
    color: '#1a202c'
}
