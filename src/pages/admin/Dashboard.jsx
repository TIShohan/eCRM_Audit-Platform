import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalAuditData: 0,
        completedAudits: 0,
        pendingAudits: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            // Total users
            const { count: usersCount } = await supabase
                .from('user_profiles')
                .select('*', { count: 'exact', head: true })

            // Total audit data
            const { count: auditDataCount } = await supabase
                .from('audit_data')
                .select('*', { count: 'exact', head: true })

            // Completed audits
            const { count: completedCount } = await supabase
                .from('audit_data')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'completed')

            // Pending audits
            const { count: pendingCount } = await supabase
                .from('audit_data')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending')

            setStats({
                totalUsers: usersCount || 0,
                totalAuditData: auditDataCount || 0,
                completedAudits: completedCount || 0,
                pendingAudits: pendingCount || 0
            })
        } catch (error) {
            console.error('Error fetching stats:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <div>Loading dashboard...</div>
    }

    return (
        <div>
            <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '30px', color: '#1a202c' }}>
                Dashboard
            </h1>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginBottom: '40px'
            }}>
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers}
                    icon="👥"
                    color="#667eea"
                />
                <StatCard
                    title="Total Audit Records"
                    value={stats.totalAuditData}
                    icon="📁"
                    color="#48bb78"
                />
                <StatCard
                    title="Completed Audits"
                    value={stats.completedAudits}
                    icon="✅"
                    color="#38b2ac"
                />
                <StatCard
                    title="Pending Audits"
                    value={stats.pendingAudits}
                    icon="⏳"
                    color="#ed8936"
                />
            </div>

            <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '15px' }}>
                    Quick Actions
                </h2>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <ActionButton href="/admin/users" label="Manage Users" />
                    <ActionButton href="/admin/data" label="Upload Data" />
                    <ActionButton href="/admin/questions" label="Configure Questions" />
                    <ActionButton href="/admin/reports" label="Export Reports" />
                </div>
            </div>
        </div>
    )
}

function StatCard({ title, value, icon, color }) {
    return (
        <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            borderLeft: `4px solid ${color}`
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <p style={{ fontSize: '14px', color: '#718096', marginBottom: '8px' }}>
                        {title}
                    </p>
                    <p style={{ fontSize: '32px', fontWeight: '700', color: '#1a202c' }}>
                        {value}
                    </p>
                </div>
                <div style={{ fontSize: '40px', opacity: 0.3 }}>
                    {icon}
                </div>
            </div>
        </div>
    )
}

function ActionButton({ href, label }) {
    return (
        <a
            href={href}
            style={{
                display: 'inline-block',
                padding: '10px 20px',
                background: '#667eea',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#5568d3'}
            onMouseLeave={(e) => e.target.style.background = '#667eea'}
        >
            {label}
        </a>
    )
}
