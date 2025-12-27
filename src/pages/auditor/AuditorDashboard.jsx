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
        todayCompleted: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user) fetchMetrics()
    }, [user])

    async function fetchMetrics() {
        try {
            setLoading(true)

            // 1. Total Assigned
            const { count: assignedCount } = await supabase
                .from('audit_data')
                .select('*', { count: 'exact', head: true })
                .eq('assigned_to', user.id)

            // 2. Completed
            const { count: completedCount } = await supabase
                .from('audit_data')
                .select('*', { count: 'exact', head: true })
                .eq('assigned_to', user.id)
                .eq('status', 'completed')

            // 3. Today's Completed
            const today = new Date().toISOString().split('T')[0]
            const { count: todayCount } = await supabase
                .from('audit_data')
                .select('*', { count: 'exact', head: true })
                .eq('assigned_to', user.id)
                .eq('status', 'completed')
                .gte('completed_at', `${today}T00:00:00`)

            setStats({
                assigned: assignedCount || 0,
                completed: completedCount || 0,
                remaining: (assignedCount || 0) - (completedCount || 0),
                todayCompleted: todayCount || 0
            })
        } catch (err) {
            console.error('Error fetching metrics:', err)
        } finally {
            setLoading(false)
        }
    }

    const isOverLimit = stats.todayCompleted >= (profile?.daily_limit || 50)

    return (
        <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1a202c', marginBottom: '10px' }}>
                    Welcome back, Auditor
                </h1>
                <p style={{ color: '#718096' }}>Track your progress and start your daily audit queue.</p>
            </div>

            {/* Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <MetricCard label="Assigned Records" value={stats.assigned} icon="📁" />
                <MetricCard label="Remaining" value={stats.remaining} icon="⏳" color="#ed8936" />
                <MetricCard label="Completed Today" value={stats.todayCompleted} limit={profile?.daily_limit} icon="✅" color="#48bb78" />
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
                            You have completed {stats.todayCompleted} audits today. Please come back tomorrow or contact your admin to increase your limit.
                        </p>
                    </div>
                ) : stats.remaining === 0 ? (
                    <div>
                        <div style={{ fontSize: '40px', marginBottom: '15px' }}>🎉</div>
                        <h2 style={{ fontSize: '22px', borderBottom: 'none' }}>All Done!</h2>
                        <p style={{ color: '#718096', marginBottom: '0' }}>You have no pending assignments at the moment.</p>
                    </div>
                ) : (
                    <div>
                        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '15px' }}>Ready to start auditing?</h2>
                        <p style={{ color: '#718096', marginBottom: '30px' }}>Your next assigned record is waiting in the queue.</p>
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
        </div>
    )
}

function MetricCard({ label, value, limit, icon, color = '#4f46e5' }) {
    return (
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.04)', borderTop: `4px solid ${color}` }}>
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
