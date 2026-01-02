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
    const [auditorProgress, setAuditorProgress] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            setLoading(true)

            // 1. Fetch Global Stats
            const [auditDataRes, completedRes, pendingRes, auditorsRes] = await Promise.all([
                supabase.from('audit_data').select('*', { count: 'exact', head: true }).eq('is_archived', false),
                supabase.from('audit_data').select('*', { count: 'exact', head: true }).eq('status', 'completed').eq('is_archived', false),
                supabase.from('audit_data').select('*', { count: 'exact', head: true }).eq('status', 'pending').eq('is_archived', false),
                supabase.from('user_profiles').select('*').eq('role', 'auditor').not('email', 'like', 'deleted_%') // Exclude soft-deleted
            ])

            // 2. Fetch Daily Completion Counts for each auditor
            const today = new Date().toISOString().split('T')[0]
            const { data: dailyDoneData } = await supabase
                .from('audit_data')
                .select('assigned_to, id')
                .eq('status', 'completed')
                .eq('is_archived', false)
                .gte('completed_at', `${today}T00:00:00`)

            // Process counts manually since we have the data
            const doneCounts = (dailyDoneData || []).reduce((acc, curr) => {
                acc[curr.assigned_to] = (acc[curr.assigned_to] || 0) + 1
                return acc
            }, {})

            // 3. Map Auditors to their progress
            const progress = (auditorsRes.data || []).map(auditor => ({
                id: auditor.id,
                name: auditor.full_name || auditor.email.split('@')[0],
                email: auditor.email,
                done: doneCounts[auditor.id] || 0,
                limit: auditor.daily_limit || 50,
                isActive: auditor.is_active
            }))

            setStats({
                total: auditDataRes.count || 0,
                completed: completedRes.count || 0,
                pending: pendingRes.count || 0,
                activeAuditors: (auditorsRes.data || []).filter(a => a.is_active).length,
                totalAuditors: (auditorsRes.data || []).length
            })
            setAuditorProgress(progress)
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

            {/* Auditors Progress Dashboard */}
            <div className="card" style={{ background: 'white', padding: '24px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Auditors Progress Dashboard</h3>
                    <span style={{ fontSize: '12px', background: '#f8fafc', padding: '4px 12px', borderRadius: '20px', color: '#64748b', fontWeight: '700', border: '1px solid #f1f5f9' }}>Live Today</span>
                </div>

                <div className="table-responsive">
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={thStyle}>Auditor Name</th>
                                <th style={thStyle}>Status</th>
                                <th style={{ ...thStyle, textAlign: 'center' }}>Daily Done</th>
                                <th style={{ ...thStyle, textAlign: 'center' }}>Daily Limit</th>
                                <th style={{ ...thStyle, textAlign: 'right' }}>Progress</th>
                            </tr>
                        </thead>
                        <tbody>
                            {auditorProgress.map((auditor) => {
                                const progress = Math.min((auditor.done / auditor.limit) * 100, 100);
                                return (
                                    <tr key={auditor.id} style={{ transition: 'background 0.2s' }}>
                                        <td style={tdStyle}>
                                            <div style={{ fontWeight: '700', color: '#1e293b' }}>{auditor.name}</div>
                                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{auditor.email}</div>
                                        </td>
                                        <td style={tdStyle}>
                                            <span style={{
                                                padding: '4px 10px',
                                                borderRadius: '20px',
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                background: auditor.isActive ? '#f0fdf4' : '#fff1f2',
                                                color: auditor.isActive ? '#16a34a' : '#e11d48'
                                            }}>
                                                {auditor.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td style={{ ...tdStyle, textAlign: 'center', fontWeight: '800', color: '#0f172a' }}>{auditor.done}</td>
                                        <td style={{ ...tdStyle, textAlign: 'center', fontWeight: '800', color: '#64748b' }}>{auditor.limit}</td>
                                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-end' }}>
                                                <div style={{ width: '100px', height: '6px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${progress}%`, height: '100%', background: progress >= 100 ? '#10b981' : '#4f46e5', transition: 'width 0.5s ease' }}></div>
                                                </div>
                                                <span style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', minWidth: '40px' }}>{Math.round(progress)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                            {auditorProgress.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No auditors found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

const thStyle = {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid #f1f5f9'
}

const tdStyle = {
    padding: '16px',
    fontSize: '13px',
    borderBottom: '1px solid #f8fafc'
}

function StatCard({ label, value, icon, color }) {
    return (
        <div className="card" style={{
            background: 'white',
            padding: '24px',
            borderRadius: '20px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
            border: `1px solid #f1f5f9`,
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
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
