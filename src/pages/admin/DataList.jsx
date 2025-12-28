import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminPageHeader from '../../components/admin/AdminPageHeader'

export default function DataList() {
    const [summary, setSummary] = useState([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 })

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        try {
            setLoading(true)

            // 1. Fetch Global Stats
            const { count: totalCount } = await supabase.from('audit_data').select('*', { count: 'exact', head: true }).eq('is_archived', false)
            const { count: pendingCount } = await supabase.from('audit_data').select('*', { count: 'exact', head: true }).eq('status', 'pending').eq('is_archived', false)
            const { count: completedCount } = await supabase.from('audit_data').select('*', { count: 'exact', head: true }).eq('status', 'completed').eq('is_archived', false)
            setStats({ total: totalCount || 0, pending: pendingCount || 0, completed: completedCount || 0 })

            // 2. Fetch the Daily Summary View
            const { data, error } = await supabase
                .from('daily_inventory_summary')
                .select('*')
                .order('record_date', { ascending: false })

            if (error) throw error
            setSummary(data || [])

        } catch (err) {
            console.error('Error fetching inventory:', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fade-in">
            <AdminPageHeader
                title="Audit Inventory"
                subtitle="Track daily ingestion batches and overall audit progress."
                action={
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={fetchData}
                            className="interactive-btn"
                            style={{
                                padding: '10px 20px',
                                background: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontWeight: '700',
                                fontSize: '14px',
                                color: '#64748b'
                            }}
                        >
                            🔄 Refresh Data
                        </button>
                        <a
                            href="/admin/data/upload"
                            className="interactive-btn"
                            style={{
                                padding: '10px 24px',
                                background: '#4f46e5',
                                color: 'white',
                                borderRadius: '10px',
                                textDecoration: 'none',
                                fontWeight: '700',
                                fontSize: '14px',
                                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                            }}
                        >
                            ＋ Ingest CSV
                        </a>
                    </div>
                }
            />

            {/* Global Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                <SmallStatCard label="Total Active Records" value={stats.total} color="#4f46e5" icon="📦" />
                <SmallStatCard label="Review Completed" value={stats.completed} color="#10b981" icon="✅" />
                <SmallStatCard label="Pending Review" value={stats.pending} color="#f59e0b" icon="⏳" />
            </div>

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
                            <th style={thStyle}>Record Date (from CSV)</th>
                            <th style={thStyle}>Volume</th>
                            <th style={thStyle}>Audited</th>
                            <th style={thStyle}>Claimed</th>
                            <th style={thStyle}>In Queue</th>
                            <th style={thStyle}>Completion Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Calculating batch metrics...</td>
                            </tr>
                        ) : summary.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>No data batches found in database.</td>
                            </tr>
                        ) : (
                            summary.map((day) => {
                                const percent = Math.round((day.audited / day.total) * 100) || 0
                                return (
                                    <tr key={day.record_date} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                                        <td style={{ ...tdStyle, fontWeight: '700', color: '#0f172a' }}>{day.record_date}</td>
                                        <td style={tdStyle}>{day.total.toLocaleString()}</td>
                                        <td style={{ ...tdStyle, color: '#10b981', fontWeight: '700' }}>{day.audited.toLocaleString()}</td>
                                        <td style={{ ...tdStyle, color: '#6366f1' }}>{day.assigned.toLocaleString()}</td>
                                        <td style={{ ...tdStyle, color: '#f59e0b', fontWeight: '700' }}>{day.available.toLocaleString()}</td>
                                        <td style={tdStyle}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ flex: 1, height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${percent}%`, height: '100%', background: percent === 100 ? '#10b981' : '#4f46e5', transition: 'width 0.5s ease-out' }} />
                                                </div>
                                                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', width: '35px' }}>{percent}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div style={{
                marginTop: '32px',
                padding: '24px',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                gap: '16px'
            }}>
                <div style={{ fontSize: '24px' }}>💡</div>
                <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#0f172a', fontWeight: '700' }}>Inventory Management Tips</h4>
                    <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5', margin: 0 }}>
                        Data is grouped by the <strong>Contact_Date</strong> specified in your CSV files.
                        <strong> "Available"</strong> records are immediately visible to all active auditors in their global pull pool.
                    </p>
                </div>
            </div>
        </div>
    )
}

function SmallStatCard({ label, value, color, icon }) {
    return (
        <div className="card" style={{
            background: 'white',
            padding: '20px',
            borderRadius: '16px',
            border: `1px solid #f1f5f9`,
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
        }}>
            <div style={{
                width: '40px',
                height: '40px',
                background: `${color}10`,
                color: color,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
            }}>
                {icon}
            </div>
            <div>
                <div style={{ color: '#64748b', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{label}</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', lineHeight: '1' }}>{value.toLocaleString()}</div>
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
