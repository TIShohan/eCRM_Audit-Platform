import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import Papa from 'papaparse'
import AdminPageHeader from '../../components/admin/AdminPageHeader'

export default function Reports() {
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [exporting, setExporting] = useState(false)
    const [message, setMessage] = useState({ text: '', type: '' })

    const handleExport = async () => {
        if (!startDate || !endDate) {
            setMessage({ text: 'Please select both start and end dates.', type: 'error' })
            return
        }

        try {
            setExporting(true)
            setMessage({ text: 'Compiling large dataset and flattening responses...', type: 'info' })

            // 1. Fetch completed audit data within range
            const { data, error } = await supabase
                .from('audit_data')
                .select(`
          *,
          auditor:user_profiles!audit_data_assigned_to_fkey(id, email),
          responses:audit_responses!audit_responses_audit_data_id_fkey(
            question_id,
            answer_option_id,
            question:questions(question_text),
            option:answer_options(option_text)
          )
        `)
                .eq('status', 'completed')
                .gte('completed_at', `${startDate}T00:00:00`)
                .lte('completed_at', `${endDate}T23:59:59`)

            if (error) throw error

            if (!data || data.length === 0) {
                setMessage({ text: 'Zero results found for the selected timeline. Adjust dates and try again.', type: 'error' })
                return
            }

            // 2. Format data for CSV
            const formattedData = data.map(record => {
                const row = {
                    'Contact_id': record.contact_id,
                    'Contact_Date': record.contact_date,
                    'Region': record.assigned_region,
                    'Area': record.assigned_area,
                    'Territory': record.assigned_territory,
                    'House': record.assigned_house,
                    'Point': record.assigned_point,
                    'Auditee_ID': record.auditee_id,
                    'Auditee_Name': record.auditee_name,
                    'Outlet': record.outlet_name,
                    'Route': record.route,
                    'Cluster': record.cluster,
                    'Campaign': record.campaign_name,
                    'Audio_Link': record.audio_link,
                    'Duration': record.duration,
                    'Auditor': record.auditor?.email || 'Unassigned',
                    'Completed_At': new Date(record.completed_at).toLocaleString()
                }

                // Add each response as a column
                record.responses.forEach(resp => {
                    const questionText = resp.question.question_text
                    row[questionText] = resp.option.option_text
                })

                return row
            })

            // 3. Convert to CSV using PapaParse
            const csv = Papa.unparse(formattedData)

            // 4. Trigger download
            const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
            const link = document.createElement('a')
            const url = URL.createObjectURL(blob)
            link.setAttribute('href', url)
            link.setAttribute('download', `Audit_Analytics_${startDate}_to_${endDate}.csv`)
            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            setMessage({ text: `Success! Exported ${data.length} records. Check your downloads folder.`, type: 'success' })
        } catch (err) {
            console.error('Export error:', err)
            setMessage({ text: 'Server error during report compilation: ' + err.message, type: 'error' })
        } finally {
            setExporting(false)
        }
    }

    return (
        <div className="fade-in" style={{ width: '100%', maxWidth: '900px' }}>
            <AdminPageHeader
                title="Data Analytics"
                subtitle="Generate and export comprehensive CSV insights for external reporting."
            />

            <div style={{
                background: 'white',
                padding: '48px',
                borderRadius: '20px',
                boxShadow: '0 4px 30px rgba(0,0,0,0.03)',
                border: '1px solid #e2e8f0',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                        <div style={{ width: '12px', height: '12px', background: '#4f46e5', borderRadius: '50%' }}></div>
                        <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Configure Export Timeline</h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '40px' }}>
                        <div>
                            <label style={labelStyle}>Start Date (Inclusive)</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>End Date (Inclusive)</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    {message.text && (
                        <div style={{
                            padding: '16px 20px',
                            borderRadius: '12px',
                            marginBottom: '32px',
                            fontSize: '14px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            background: message.type === 'error' ? '#fef2f2' : (message.type === 'success' ? '#f0fdf4' : '#eff6ff'),
                            color: message.type === 'error' ? '#b91c1c' : (message.type === 'success' ? '#15803d' : '#1d4ed8'),
                            border: `1px solid ${message.type === 'error' ? '#fee2e2' : (message.type === 'success' ? '#dcfce7' : '#dbeafe')}`
                        }}>
                            <span>{message.type === 'error' ? '❌' : (message.type === 'success' ? '✅' : 'ℹ️')}</span>
                            {message.text}
                        </div>
                    )}

                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="interactive-btn"
                        style={{
                            width: '100%',
                            padding: '16px',
                            background: exporting ? '#94a3b8' : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '14px',
                            fontWeight: '800',
                            fontSize: '16px',
                            cursor: exporting ? 'not-allowed' : 'pointer',
                            boxShadow: exporting ? 'none' : '0 6px 24px rgba(79, 70, 229, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px'
                        }}
                    >
                        {exporting ? (
                            <>
                                <span className="rotate">⏳</span>
                                Compiling...
                            </>
                        ) : (
                            <>
                                <span>📥</span>
                                Download Comprehensive Audit Report
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div style={{
                marginTop: '48px',
                background: '#f8fafc',
                padding: '32px',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: '24px'
            }}>
                <div style={{ fontSize: '32px' }}>📑</div>
                <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>Report Specification</h3>
                    <ul style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.8', margin: 0, paddingLeft: '20px' }}>
                        <li><strong>Metadata:</strong> Includes all geographic and operational data from original CSV.</li>
                        <li><strong>Audio Trace:</strong> Cloud storage links and session durations for verification.</li>
                        <li><strong>Flattened Responses:</strong> Each survey question is mapped to its own dynamic column.</li>
                        <li><strong>Excel Optimized:</strong> Export uses UTF-8 BOM for seamless Microsoft Excel compatibility.</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '10px'
}

const inputStyle = {
    width: '100%',
    padding: '14px 18px',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600',
    background: '#f8fafc',
    outline: 'none',
    color: '#0f172a',
    transition: 'all 0.2s',
    cursor: 'pointer'
}
