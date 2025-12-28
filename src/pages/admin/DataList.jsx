import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

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

            // 1. Fetch Global Stats for the top cards
            const { count: totalCount } = await supabase.from('audit_data').select('*', { count: 'exact', head: true })
            const { count: pendingCount } = await supabase.from('audit_data').select('*', { count: 'exact', head: true }).eq('status', 'pending')
            const { count: completedCount } = await supabase.from('audit_data').select('*', { count: 'exact', head: true }).eq('status', 'completed')
            setStats({ total: totalCount || 0, pending: pendingCount || 0, completed: completedCount || 0 })

            // 2. Fetch the Daily Summary View
            const { data, error } = await supabase
                .from('daily_inventory_summary')
                .select('*')
                .order('upload_date', { ascending: false })

            if (error) throw error
            setSummary(data || [])

        } catch (err) {
            console.error('Error fetching inventory:', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ paddingBottom: '60px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1a202c' }}>
                    Audit Inventory Summary
                </h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={fetchData}
                        style={{
                            padding: '8px 16px',
                            background: '#edf2f7',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            color: '#4a5568'
                        }}
                    >
                        🔄 Refresh Stats
                    </button>
                    <a
                        href="/admin/data/upload"
                        style={{
                            padding: '8px 16px',
                            background: '#4f46e5',
                            color: 'white',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            fontWeight: '600'
                        }}
                    >
                        + Upload More
                    </a>
                </div>
            </div>

            {/* Global Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <StatCard label="Grand Total" value={stats.total} color="#4f46e5" />
                <StatCard label="Total Audited" value={stats.completed} color="#2f855a" />
                <StatCard label="Grand Pending" value={stats.pending} color="#e53e3e" />
            </div>

            <div style={{
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                overflow: 'hidden',
                border: '1px solid #e2e8f0'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                            <th style={thStyle}>Upload Date</th>
                            <th style={thStyle}>Total Data</th>
                            <th style={thStyle}>Audited (Done)</th>
                            <th style={thStyle}>Claimed (In-Progress)</th>
                            <th style={thStyle}>Available (Queue)</th>
                            <th style={thStyle}>Progress</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#718096' }}>Loading inventory metrics...</td>
                            </tr>
                        ) : summary.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#718096' }}>No records found in database.</td>
                            </tr>
                        ) : (
                            summary.map((day) => {
                                const percent = Math.round((day.audited / day.total) * 100) || 0
                                return (
                                    <tr key={day.upload_date} style={{ borderBottom: '1px solid #edf2f7', transition: 'background 0.2s' }}>
                                        <td style={{ ...tdStyle, fontWeight: '700', color: '#1a202c' }}>{day.upload_date}</td>
                                        <td style={tdStyle}>{day.total.toLocaleString()}</td>
                                        <td style={{ ...tdStyle, color: '#2f855a', fontWeight: '600' }}>{day.audited.toLocaleString()}</td>
                                        <td style={{ ...tdStyle, color: '#805ad5' }}>{day.assigned.toLocaleString()}</td>
                                        <td style={{ ...tdStyle, color: '#e53e3e', fontWeight: '600' }}>{day.available.toLocaleString()}</td>
                                        <td style={tdStyle}>
                                            <div style={{ width: '120px', height: '8px', background: '#edf2f7', borderRadius: '4px', overflow: 'hidden', marginBottom: '4px' }}>
                                                <div style={{ width: `${percent}%`, height: '100%', background: '#48bb78' }} />
                                            </div>
                                            <span style={{ fontSize: '11px', color: '#718096', fontWeight: '600' }}>{percent}% Complete</span>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '30px', padding: '20px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: '1.6' }}>
                    <strong>ℹ️ Inventory Logic:</strong>
                    <br />• <strong>Available</strong>: Records in the global pool waiting to be pulled.
                    <br />• <strong>Claimed</strong>: Records currently being audited by an auditor.
                    <br />• <strong>Audited</strong>: Audit successfully completed and submitted.
                </p>
            </div>
        </div>
    )
}

function StatCard({ label, value, color }) {
    return (
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', borderLeft: `6px solid ${color}`, boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ color: '#718096', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{label}</div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#1a202c' }}>{value.toLocaleString()}</div>
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
    fontSize: '15px',
    color: '#4a5568',
    verticalAlign: 'middle'
}
