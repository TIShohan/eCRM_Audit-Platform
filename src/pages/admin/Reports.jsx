import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import Papa from 'papaparse'

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
            setMessage({ text: 'Generating report...', type: 'info' })

            // 1. Fetch completed audit data within range
            // We join audit_data with audit_responses, questions, and answer_options
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
                setMessage({ text: 'No completed audits found for this date range.', type: 'error' })
                return
            }

            // 2. Format data for CSV
            // We need to flatten the responses into columns
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

            // 4. Trigger download with BOM for Excel/UTF-8 support
            const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
            const link = document.createElement('a')
            const url = URL.createObjectURL(blob)
            link.setAttribute('href', url)
            link.setAttribute('download', `Audit_Report_${startDate}_to_${endDate}.csv`)
            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            setMessage({ text: `Report successfully generated with ${data.length} records.`, type: 'success' })
        } catch (err) {
            console.error('Export error:', err)
            setMessage({ text: 'Failed to generate report: ' + err.message, type: 'error' })
        } finally {
            setExporting(false)
        }
    }

    return (
        <div style={{ width: '100%', maxWidth: '800px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1a202c', marginBottom: '30px' }}>
                Audit Reports
            </h1>

            <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '10px' }}>Export Audit Results</h2>
                <p style={{ color: '#718096', marginBottom: '30px' }}>
                    Select a date range to download a comprehensive CSV report of all completed audits.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                    <div>
                        <label style={labelStyle}>Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>End Date</label>
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
                        padding: '15px',
                        borderRadius: '6px',
                        marginBottom: '20px',
                        fontSize: '14px',
                        background: message.type === 'error' ? '#fff5f5' : (message.type === 'success' ? '#f0fff4' : '#ebf8ff'),
                        color: message.type === 'error' ? '#c53030' : (message.type === 'success' ? '#2f855a' : '#2b6cb0'),
                        border: `1px solid ${message.type === 'error' ? '#feb2b2' : (message.type === 'success' ? '#c6f6d5' : '#bee3f8')}`
                    }}>
                        {message.type === 'error' ? '⚠️ ' : (message.type === 'success' ? '✅ ' : 'ℹ️ ')}
                        {message.text}
                    </div>
                )}

                <button
                    onClick={handleExport}
                    disabled={exporting}
                    style={{
                        width: '100%',
                        padding: '14px',
                        background: exporting ? '#a0aec0' : '#4f46e5',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '16px',
                        cursor: exporting ? 'not-allowed' : 'pointer',
                        transition: 'background 0.2s',
                        boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)'
                    }}
                >
                    {exporting ? 'Processing Report...' : '📥 Download CSV Report'}
                </button>
            </div>

            <div style={{ marginTop: '40px', background: '#edf2f7', padding: '20px', borderRadius: '10px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px' }}>What's included in the report?</h3>
                <ul style={{ fontSize: '14px', color: '#4a5568', lineHeight: '1.6', paddingLeft: '20px' }}>
                    <li>All original CSV columns (Region, Area, Territory, etc.)</li>
                    <li>Audio metadata (Link, Duration)</li>
                    <li>Auditor details (Email, Completion timestamp)</li>
                    <li><strong>All survey answers</strong> flattened into individual columns</li>
                </ul>
            </div>
        </div>
    )
}

const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: '8px'
}

const inputStyle = {
    width: '100%',
    padding: '10px',
    border: '1px solid #cbd5e0',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    color: '#2d3748'
}
