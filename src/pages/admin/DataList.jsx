import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { autoAssignRecords } from '../../utils/autoAssign'

export default function DataList() {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')
    const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 })
    const [auditors, setAuditors] = useState([])
    const [selectingFor, setSelectingFor] = useState(null)
    const [assigning, setAssigning] = useState(false)

    const [page, setPage] = useState(1)
    const [pageSize] = useState(50)
    const [hasMore, setHasMore] = useState(true)

    const [searchCampaign, setSearchCampaign] = useState('')

    useEffect(() => {
        const handler = setTimeout(() => {
            fetchData()
        }, 400) // Debounce for search
        fetchAuditors()
        return () => clearTimeout(handler)
    }, [filter, page, searchCampaign])

    async function fetchAuditors() {
        const { data } = await supabase.from('user_profiles').select('*').eq('role', 'auditor')
        setAuditors(data || [])
    }

    async function fetchData() {
        try {
            setLoading(true)

            // 1. Fetch Global Stats
            const { count: totalCount } = await supabase.from('audit_data').select('*', { count: 'exact', head: true })
            const { count: pendingCount } = await supabase.from('audit_data').select('*', { count: 'exact', head: true }).eq('status', 'pending')
            const { count: completedCount } = await supabase.from('audit_data').select('*', { count: 'exact', head: true }).eq('status', 'completed')

            setStats({ total: totalCount, pending: pendingCount, completed: completedCount })

            // 2. Fetch Paginated Records with Filters
            let query = supabase
                .from('audit_data')
                .select(`
                  *,
                  assigned_user:user_profiles!audit_data_assigned_to_fkey(id, email)
                `)
                .order('created_at', { ascending: false })
                .range((page - 1) * pageSize, page * pageSize - 1)

            if (filter !== 'all') {
                query = query.eq('status', filter)
            }

            if (searchCampaign) {
                query = query.ilike('campaign_id', `%${searchCampaign}%`)
            }

            const { data: records, error } = await query
            if (error) throw error

            setData(records || [])
            setHasMore(records.length === pageSize)

        } catch (err) {
            console.error('Error fetching data:', err)
        } finally {
            setLoading(false)
        }
    }

    async function handleAssign(auditorId) {
        if (!selectingFor || assigning) return

        try {
            setAssigning(true)
            const { user } = (await supabase.auth.getUser()).data

            // 1. Update audit_data
            const { error: updateError } = await supabase
                .from('audit_data')
                .update({ assigned_to: auditorId, status: 'pending' })
                .eq('id', selectingFor.id)

            if (updateError) throw updateError

            // 2. Create entry in assignments table
            const { error: assignError } = await supabase
                .from('assignments')
                .insert({
                    audit_data_id: selectingFor.id,
                    auditor_id: auditorId,
                    assigned_by: user.id
                })

            if (assignError) throw assignError

            setSelectingFor(null)
            fetchData()
            alert('Record assigned successfully!')

        } catch (err) {
            console.error('Assignment error:', err)
            alert('Failed to assign record.')
        } finally {
            setAssigning(false)
        }
    }

    async function handleAutoAssign() {
        if (!window.confirm('Do you want to automatically distribute all unassigned records to active auditors?')) return

        try {
            setLoading(true)
            const result = await autoAssignRecords()
            alert(result.message)
            fetchData()
        } catch (err) {
            alert(`Auto-assignment failed: ${err.message}`)
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return '#2f855a'
            case 'in_progress': return '#d69e2e'
            default: return '#718096'
        }
    }

    return (
        <div style={{ width: '100%', paddingBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1a202c' }}>
                    Audit Data Records
                </h1>
                <Link
                    to="/admin/data/upload"
                    style={{
                        padding: '10px 20px',
                        background: '#4f46e5',
                        color: 'white',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontWeight: '600'
                    }}
                >
                    + Upload More Data
                </Link>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
                <StatCard label="Total Records" value={stats.total} color="#4f46e5" />
                <StatCard label="Pending" value={stats.pending} color="#718096" />
                <StatCard label="Completed" value={stats.completed} color="#2f855a" />
            </div>

            {/* Filter bar */}
            <div style={{ background: 'white', padding: '15px 20px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', gap: '15px', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>Filter Status:</span>
                <select
                    value={filter}
                    onChange={(e) => {
                        setFilter(e.target.value)
                        setPage(1)
                    }}
                    style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #e2e8f0', background: 'white' }}
                >
                    <option value="all">All Records</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                </select>

                <input
                    type="text"
                    placeholder="Search Campaign ID..."
                    onChange={(e) => {
                        // We'll update the fetch logic to handle this
                        setSearchCampaign(e.target.value)
                        setPage(1)
                    }}
                    style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #e2e8f0', width: '180px' }}
                />

                <button
                    onClick={handleAutoAssign}
                    disabled={loading || stats.pending === 0}
                    style={{
                        padding: '8px 16px',
                        background: stats.pending === 0 ? '#e2e8f0' : '#2d3748',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: (loading || stats.pending === 0) ? 'not-allowed' : 'pointer'
                    }}
                >
                    🤖 Auto-Assign Unassigned
                </button>

                <button
                    onClick={fetchData}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontSize: '14px' }}
                >
                    🔄 Refresh List
                </button>
            </div>

            {/* Table */}
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                            <th style={thStyle}>Contact ID</th>
                            <th style={thStyle}>Outlet / Location</th>
                            <th style={thStyle}>Campaign</th>
                            <th style={thStyle}>Status</th>
                            <th style={thStyle}>Auditor ID</th>
                            <th style={thStyle}>Created At</th>
                            <th style={thStyle}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#a0aec0' }}>Loading records...</td></tr>
                        ) : data.length === 0 ? (
                            <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#a0aec0' }}>No records found.</td></tr>
                        ) : data.map((record) => (
                            <tr key={record.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                                <td style={tdStyle}><strong>{record.contact_id}</strong></td>
                                <td style={tdStyle}>
                                    <div style={{ fontSize: '14px' }}>{record.outlet_name || 'N/A'}</div>
                                    <div style={{ fontSize: '12px', color: '#a0aec0' }}>{record.assigned_area}</div>
                                </td>
                                <td style={tdStyle}>
                                    <div style={{ fontSize: '14px' }}>{record.campaign_name}</div>
                                    <div style={{ fontSize: '12px', color: '#a0aec0' }}>ID: {record.campaign_id}</div>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        textTransform: 'uppercase',
                                        background: getStatusColor(record.status) + '15',
                                        color: getStatusColor(record.status)
                                    }}>
                                        {record.status}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    {record.assigned_user ? (
                                        <span style={{ fontSize: '14px', color: '#4a5568' }}>{record.assigned_user.email || 'Email missing'}</span>
                                    ) : (
                                        <span style={{ color: '#e53e3e', fontSize: '12px' }}>Unassigned</span>
                                    )}
                                </td>
                                <td style={tdStyle}>
                                    {new Date(record.created_at).toLocaleDateString()}
                                </td>
                                <td style={tdStyle}>
                                    <button
                                        onClick={() => setSelectingFor(record)}
                                        style={{
                                            padding: '6px 12px',
                                            background: '#4f46e5',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {record.assigned_to ? 'Reassign' : 'Assign'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '30px' }}>
                <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    style={{
                        padding: '8px 16px',
                        background: page === 1 ? '#e2e8f0' : 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        cursor: page === 1 ? 'not-allowed' : 'pointer'
                    }}
                >
                    Previous
                </button>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>Page {page}</span>
                <button
                    disabled={!hasMore}
                    onClick={() => setPage(p => p + 1)}
                    style={{
                        padding: '8px 16px',
                        background: !hasMore ? '#e2e8f0' : 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        cursor: !hasMore ? 'not-allowed' : 'pointer'
                    }}
                >
                    Next
                </button>
            </div>

            {/* Assignment Modal */}
            {selectingFor && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ marginBottom: '10px' }}>Assign Record</h3>
                        <p style={{ fontSize: '14px', color: '#718096', marginBottom: '20px' }}>
                            Select an auditor to review Contact: <strong>{selectingFor.contact_id}</strong>
                        </p>

                        <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                            {auditors.map(auditor => (
                                <div
                                    key={auditor.id}
                                    onClick={() => handleAssign(auditor.id)}
                                    style={{
                                        padding: '12px 15px', borderBottom: '1px solid #e2e8f0', cursor: 'pointer',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#f7fafc'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                >
                                    <span style={{ fontSize: '14px' }}>{auditor.email || `Auditor ${auditor.id.slice(-4)}`}</span>
                                    <span style={{ fontSize: '12px', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>
                                        Limit: {auditor.daily_limit}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => setSelectingFor(null)}
                            style={{ width: '100%', marginTop: '20px', padding: '10px', background: '#edf2f7', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

function StatCard({ label, value, color }) {
    return (
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: `4px solid ${color}` }}>
            <div style={{ color: '#718096', fontSize: '14px', marginBottom: '5px' }}>{label}</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#1a202c' }}>{value}</div>
        </div>
    )
}

const thStyle = { padding: '15px 20px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }
const tdStyle = { padding: '15px 20px', verticalAlign: 'middle' }
