import { useAuth } from '../../contexts/AuthContext'

export default function AuditorDashboard() {
    const { signOut, user, profile } = useAuth()

    return (
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '10px' }}>
                    Auditor Dashboard
                </h1>
                <p style={{ color: '#718096', marginBottom: '20px' }}>
                    Welcome, {user?.email}. This section is currently under development.
                </p>

                <div style={{ padding: '20px', background: '#f7fafc', borderRadius: '8px', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px' }}>Current Role: {profile?.role}</h2>
                    <p style={{ fontSize: '14px' }}>Phase 8 will migrate the audio review interface here.</p>
                </div>

                <button
                    onClick={() => signOut()}
                    style={{
                        padding: '10px 20px',
                        background: '#e53e3e',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600'
                    }}
                >
                    Logout
                </button>
            </div>
        </div>
    )
}
