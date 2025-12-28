import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminPageHeader from '../../components/admin/AdminPageHeader'

export default function Dashboard() {
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        pending: 0,
        activeAuditors: 0,
        totalAuditors: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            setLoading(true)

            // Total audit data (non-archived)
            const { count: auditDataCount } = await supabase
                .from('audit_data')
                .select('*', { count: 'exact', head: true })
                .eq('is_archived', false)

            // Completed audits (non-archived)
            const { count: completedCount } = await supabase
                .from('audit_data')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'completed')
                .eq('is_archived', false)

            // Pending audits (non-archived)
            const { count: pendingCount } = await supabase
                .from('audit_data')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending')
                .eq('is_archived', false)

            // Total Auditors
            const { count: totalAuditors } = await supabase
                .from('user_profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'auditor')

            // Active Auditors
            const { count: activeAuditors } = await supabase
                .from('user_profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'auditor')
                .eq('is_active', true)

            setStats({
                total: auditDataCount || 0,
                completed: completedCount || 0,
                pending: pendingCount || 0,
                activeAuditors: activeAuditors || 0,
                totalAuditors: totalAuditors || 0
            })
        } catch (error) {
            console.error('Error fetching admin stats:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fade-in">
            <AdminPageHeader
                title="Operational Overview"
                subtitle="Real-time performance metrics and system administrative controls."
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
                <StatCard label="Total Data" value={stats.total} icon="📦" color="#4f46e5" />
                <StatCard label="Completed Data" value={stats.completed} icon="✅" color="#10b981" />
                <StatCard label="Remaining" value={stats.total - stats.completed} icon="⏳" color="#f59e0b" />
                <StatCard
                    label="Total Active Users"
                    value={`${stats.activeAuditors}/${stats.totalAuditors}`}
                    icon="👥"
                    color="#7c3aed"
                />
            </div>
        </div>
    )
}

function StatCard({ label, value, icon, color }) {
    return (
        <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '20px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
            border: `1px solid #f1f5f9`,
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
        }}>
            <div style={{
                width: '52px',
                height: '52px',
                background: `${color}10`,
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
            }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a' }}>{value}</div>
            </div>
        </div>
    )
}
