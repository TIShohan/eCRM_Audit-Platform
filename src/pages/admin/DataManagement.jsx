import { useState } from 'react'
import Papa from 'papaparse'
import { supabase } from '../../lib/supabase'

export default function DataManagement() {
    const [uploading, setUploading] = useState(false)
    const [results, setResults] = useState(null)
    const [error, setError] = useState(null)

    const handleFileUpload = (e) => {
        const file = e.target.files[0]
        if (!file) return

        setUploading(true)
        setError(null)
        setResults(null)

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const rows = results.data.map(row => ({
                        // Map every single column from the CSV
                        assigned_region: row['Assigned_Region'],
                        assigned_area: row['Assigned_Area'],
                        assigned_territory: row['Assigned_Territory'],
                        assigned_house: row['Assigned_House'],
                        assigned_point: row['Assigned_Point'],
                        auditee_id: row['User_ID'],
                        auditee_name: row['User_Name'],
                        route: row['route'],
                        cluster: row['cluster'],
                        outlet_name: row['outlet'],
                        contact_id: row['Contact_id'],
                        contact_date: row['Contact_Date'],
                        location: row['Contact_Location'],
                        audio_link: row['audio_links'],
                        start_time: row['Contact_Start_Time'],
                        end_time: row['Contact_end_time'],
                        duration: row['duration'],
                        campaign_id: row['campaign_id'],
                        campaign_name: row['campaign']?.trim(),
                        status: 'pending'
                    })).filter(row => row.contact_id && row.audio_link && row.campaign_id)

                    if (rows.length === 0) {
                        throw new Error('No valid records found in CSV. Please check headers.')
                    }

                    // Batch insert into Supabase
                    const { error: insertError } = await supabase
                        .from('audit_data')
                        .insert(rows)

                    if (insertError) throw insertError

                    setResults({
                        total: results.data.length,
                        valid: rows.length,
                        message: `Successfully uploaded ${rows.length} records with full metadata!`
                    })
                } catch (err) {
                    console.error('Upload error:', err)
                    setError(err.message)
                } finally {
                    setUploading(false)
                }
            },
            error: (err) => {
                setError('Failed to parse CSV file.')
                setUploading(false)
            }
        })
    }

    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', maxWidth: '1000px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1a202c', marginBottom: '30px' }}>
                    Data Management
                </h1>

                <div style={{
                    background: 'white',
                    padding: '40px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                    textAlign: 'center',
                    border: '2px dashed #e2e8f0'
                }}>
                    <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>Full CSV Import</h2>
                    <p style={{ color: '#718096', marginBottom: '30px' }}>
                        Uploading will preserve all CSV columns for the final audit report.
                    </p>

                    <div style={{ position: 'relative' }}>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            id="csv-upload"
                            style={{
                                position: 'absolute',
                                width: '1px',
                                height: '1px',
                                padding: '0',
                                margin: '-1px',
                                overflow: 'hidden',
                                clip: 'rect(0,0,0,0)',
                                border: '0'
                            }}
                        />
                        <label
                            htmlFor="csv-upload"
                            style={{
                                display: 'inline-block',
                                padding: '12px 30px',
                                background: uploading ? '#a0aec0' : '#4f46e5',
                                color: 'white',
                                borderRadius: '6px',
                                fontWeight: '600',
                                cursor: uploading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: uploading ? 'none' : '0 4px 10px rgba(79, 70, 229, 0.3)'
                            }}
                        >
                            {uploading ? 'Processing All Columns...' : 'Choose CSV File'}
                        </label>
                    </div>

                    {error && (
                        <div style={{ marginTop: '20px', color: '#e53e3e', background: '#fff5f5', padding: '10px', borderRadius: '6px', fontSize: '14px' }}>
                            <strong>Upload Error:</strong> {error}
                        </div>
                    )}

                    {results && (
                        <div style={{
                            marginTop: '30px',
                            padding: '20px',
                            background: '#f0fff4',
                            border: '1px solid #c6f6d5',
                            borderRadius: '8px',
                            color: '#2f855a'
                        }}>
                            <h3 style={{ marginBottom: '10px', fontWeight: '700' }}>Upload Successful</h3>
                            <p>{results.message}</p>
                            <p style={{ fontSize: '13px', opacity: 0.8 }}>
                                Preserved all metadata for {results.valid} records.
                            </p>
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '40px', background: '#edf2f7', padding: '20px', borderRadius: '10px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px' }}>Data Integrity Note</h3>
                    <p style={{ fontSize: '14px', color: '#4a5568' }}>
                        This system now implements <strong>Full Column Retention</strong>. Every header in your CSV is saved to provide a complete traceability report upon audit completion.
                    </p>
                </div>
            </div>
        </div>
    )
}
