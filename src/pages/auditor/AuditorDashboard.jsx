import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function AuditorDashboard() {
    const { user, profile } = useAuth()
    const navigate = useNavigate()
    const [stats, setStats] = useState({
        assigned: 0,
        completed: 0,
        remaining: 0,
        todayCompleted: 0,
        monthlyCompleted: 0,
        globalAvailable: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user) fetchMetrics()
    }, [user])

    async function fetchMetrics() {
        if (!user?.id) return
        try {
            setLoading(true)

            // 1. Fetch unassigned records (Global Queue)
            const { count: unassignedCount } = await supabase
                .from('audit_data')
                .select('*', { count: 'exact', head: true })
                .is('assigned_to', null)
                .eq('status', 'pending')
                .eq('is_archived', false)

            // 2. Total Assigned to ME
            const { count: assignedCount } = await supabase
                .from('audit_data')
                .select('*', { count: 'exact', head: true })
                .eq('assigned_to', user.id)
                .eq('is_archived', false)

            // 3. Completed by ME
            const { count: completedCount } = await supabase
                .from('audit_data')
                .select('*', { count: 'exact', head: true })
                .eq('assigned_to', user.id)
                .eq('status', 'completed')
                .eq('is_archived', false)

            // 4. Today's Completed by ME
            const today = new Date().toISOString().split('T')[0]
            const { count: todayCount } = await supabase
                .from('audit_data')
                .select('*', { count: 'exact', head: true })
                .eq('assigned_to', user.id)
                .eq('status', 'completed')
                .eq('is_archived', false)
                .gte('completed_at', `${today}T00:00:00`)

            // 5. Monthly Completed by ME (Shows 1st-current, resets on 5th of next month)
            const now = new Date()
            let dataMonth = now.getMonth()
            let dataYear = now.getFullYear()

            // If today is before the 5th, we are still looking at the previous month's ledger
            if (now.getDate() < 5) {
                dataMonth -= 1
            }

            const startOfCycle = new Date(dataYear, dataMonth, 1).toISOString()
            const { count: monthCount } = await supabase
                .from('audit_data')
                .select('*', { count: 'exact', head: true })
                .eq('assigned_to', user.id)
                .eq('status', 'completed')
                .eq('is_archived', false)
                .gte('completed_at', startOfCycle)

            setStats({
                assigned: assignedCount || 0,
                completed: completedCount || 0,
                remaining: (assignedCount || 0) - (completedCount || 0) + (unassignedCount || 0),
                todayCompleted: todayCount || 0,
                monthlyCompleted: monthCount || 0,
                globalAvailable: unassignedCount || 0
            })
        } catch (err) {
            console.error('Error fetching metrics:', err)
        } finally {
            setLoading(false)
        }
    }

    const isOverLimit = stats.todayCompleted >= (profile?.daily_limit || 50)

    return (
        <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1a202c', marginBottom: '10px' }}>
                    Welcome back, {profile?.full_name || 'Auditor'}
                </h1>
                <p style={{ color: '#718096' }}>
                    Queue is waiting. You have {Math.max(0, (profile?.daily_limit || 0) - stats.todayCompleted)} audits left in your daily quota.
                </p>
            </div>

            {loading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#718096' }}>Loading metrics...</div>
            ) : (
                <>
                    {/* Metric Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                        <MetricCard
                            label="Daily Quota Left"
                            value={Math.max(0, (profile?.daily_limit || 0) - stats.todayCompleted)}
                            icon="⏳"
                            color="#ed8936"
                        />
                        <MetricCard
                            label="Completed Today"
                            value={stats.todayCompleted}
                            limit={profile?.daily_limit}
                            icon="✅"
                            color="#48bb78"
                        />
                        <MetricCard
                            label="Completed This Month"
                            value={stats.monthlyCompleted}
                            icon="📊"
                            color="#4f46e5"
                        />
                    </div>

                    {/* Start Action */}
                    <div style={{
                        background: 'white',
                        padding: '50px',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                        textAlign: 'center',
                        border: isOverLimit ? '2px solid #feb2b2' : 'none'
                    }}>
                        {isOverLimit ? (
                            <div>
                                <div style={{ fontSize: '40px', marginBottom: '15px' }}>🛑</div>
                                <h2 style={{ fontSize: '22px', borderBottom: 'none' }}>Daily Limit Reached</h2>
                                <p style={{ color: '#718096', marginBottom: '0' }}>
                                    You have completed {stats.todayCompleted} audits today. Please come back tomorrow or contact your admin.
                                </p>
                            </div>
                        ) : (stats.globalAvailable === 0 && (stats.assigned - stats.completed) === 0) ? (
                            <div>
                                <div style={{ fontSize: '40px', marginBottom: '15px' }}>🎉</div>
                                <h2 style={{ fontSize: '22px', borderBottom: 'none' }}>System Queue Empty</h2>
                                <p style={{ color: '#718096', marginBottom: '0' }}>There are currently no records available for auditing.</p>
                            </div>
                        ) : (
                            <div>
                                <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '15px' }}>Ready to start auditing?</h2>
                                <p style={{ color: '#718096', marginBottom: '30px' }}>The system will pull the next available record for you.</p>
                                <button
                                    onClick={() => navigate('/auditor/audit')}
                                    style={{
                                        padding: '16px 40px',
                                        background: '#4f46e5',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '18px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.4)',
                                        transition: 'transform 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    🚀 Start Audit Queue
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}

function MetricCard({ label, value, limit, icon, color = '#4f46e5' }) {
    return (
        <div className="card" style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
            borderTop: `4px solid ${color}`,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <p style={{ fontSize: '13px', color: '#718096', fontWeight: '600', marginBottom: '5px' }}>{label}</p>
                    <p style={{ fontSize: '28px', fontWeight: '800', color: '#1a202c' }}>
                        {value}
                        {limit && <span style={{ fontSize: '14px', color: '#a0aec0', fontWeight: '400' }}> / {limit}</span>}
                    </p>
                </div>
                <span style={{ fontSize: '24px' }}>{icon}</span>
            </div>
        </div>
    )
}
