import { useState } from 'react'
import Papa from 'papaparse'
import { supabase } from '../../lib/supabase'
import ConfirmationModal from '../../components/ConfirmationModal'

export default function DataManagement() {
    const [uploading, setUploading] = useState(false)
    const [results, setResults] = useState(null)
    const [error, setError] = useState(null)
    const [cleaning, setCleaning] = useState(false)

    // Modal state
    const [modal, setModal] = useState({ show: false, message: '', type: '', step: 1 })

    // Upload confirmation state
    const [uploadConfirmation, setUploadConfirmation] = useState({
        show: false,
        totalRecords: 0,
        duplicates: 0,
        newRecords: 0,
        dateRange: '',
        pendingRows: []
    })

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
                    // Helper to standardize dates to YYYY-MM-DD
                    const standardDate = (dateStr) => {
                        if (!dateStr) return null;

                        // Already ISO (YYYY-MM-DD)
                        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;

                        const parts = dateStr.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
                        if (parts) {
                            const n1 = parseInt(parts[1], 10);
                            const n2 = parseInt(parts[2], 10);
                            const year = parts[3];

                            // Rule 1: First number > 12? MUST be Day. Format is DD/MM/YYYY
                            if (n1 > 12) {
                                return `${year}-${n2.toString().padStart(2, '0')}-${n1.toString().padStart(2, '0')}`;
                            }

                            // Rule 2: Second number > 12? MUST be Day. Format is MM/DD/YYYY
                            if (n2 > 12) {
                                return `${year}-${n1.toString().padStart(2, '0')}-${n2.toString().padStart(2, '0')}`;
                            }

                            // Rule 3: Ambiguous (e.g. 05/07/2025)
                            return `${year}-${n1.toString().padStart(2, '0')}-${n2.toString().padStart(2, '0')}`;
                        }

                        // Attempt JS Parse
                        const parsed = new Date(dateStr);
                        if (!isNaN(parsed.getTime())) {
                            return parsed.toISOString().split('T')[0];
                        }

                        return dateStr;
                    }

                    const rows = results.data.map(row => ({
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
                        contact_date: standardDate(row['Contact_Date']),
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

                    // Check for duplicates
                    const contactIds = rows.map(r => r.contact_id)
                    const { data: existing, error: checkError } = await supabase
                        .from('audit_data')
                        .select('contact_id')
                        .in('contact_id', contactIds)

                    if (checkError) throw checkError

                    const existingIds = new Set(existing.map(e => e.contact_id))
                    const newRows = rows.filter(r => !existingIds.has(r.contact_id))
                    const duplicateCount = rows.length - newRows.length

                    // Get date range from file
                    const dates = rows.map(r => r.contact_date).filter(Boolean).sort()
                    const dateRange = dates.length > 0
                        ? dates[0] === dates[dates.length - 1]
                            ? dates[0]
                            : `${dates[0]} to ${dates[dates.length - 1]}`
                        : 'Unknown'

                    // If duplicates found, show confirmation
                    if (duplicateCount > 0) {
                        setUploadConfirmation({
                            show: true,
                            totalRecords: rows.length,
                            duplicates: duplicateCount,
                            newRecords: newRows.length,
                            dateRange,
                            pendingRows: newRows
                        })
                        setUploading(false)
                        return
                    }

                    // No duplicates, proceed directly
                    await insertRecords(newRows)

                } catch (err) {
                    console.error('Upload error:', err)
                    setError(err.message)
                    setUploading(false)
                }
            },
            error: (err) => {
                setError('Failed to parse CSV file.')
                setUploading(false)
            }
        })
    }

    const insertRecords = async (rows) => {
        try {
            setUploading(true)
            const { error: insertError } = await supabase
                .from('audit_data')
                .insert(rows)

            if (insertError) throw insertError

            setResults({
                total: rows.length,
                valid: rows.length,
                message: `Successfully uploaded ${rows.length} new records!`
            })
            setUploadConfirmation({ show: false, totalRecords: 0, duplicates: 0, newRecords: 0, dateRange: '', pendingRows: [] })
        } catch (err) {
            console.error('Insert error:', err)
            setError(err.message)
        } finally {
            setUploading(false)
        }
    }

    const handleConfirmUpload = () => {
        insertRecords(uploadConfirmation.pendingRows)
    }

    const handleCancelUpload = () => {
        setUploadConfirmation({ show: false, totalRecords: 0, duplicates: 0, newRecords: 0, dateRange: '', pendingRows: [] })
        setUploading(false)
        setError(null)
    }

    const startCleanup = (type) => {
        const message = type === 'all'
            ? 'Are you sure you want to PERMANENTLY delete ALL local records and their responses? This cannot be undone.'
            : 'Are you sure you want to delete only COMPLETED records? This will free up space while keeping pending work.';

        setModal({ show: true, message, type, step: 1 })
    }

    const handleCleanupConfirm = async () => {
        if (modal.step === 1) {
            setModal({ ...modal, step: 2, message: 'FINAL WARNING: This action is destructive. Are you absolutely certain?' })
            return
        }

        try {
            setCleaning(true)
            let query = supabase.from('audit_data').delete()

            if (modal.type === 'completed') {
                query = query.eq('status', 'completed')
            } else {
                query = query.neq('id', '00000000-0000-0000-0000-000000000000') // Trick to delete all
            }

            const { error: delError } = await query
            if (delError) throw delError

            alert(`Successfully deleted ${modal.type === 'completed' ? 'completed' : 'all'} records.`)
            setModal({ show: false, message: '', type: '', step: 1 })
        } catch (err) {
            alert('Cleanup failed: ' + err.message)
        } finally {
            setCleaning(false)
        }
    }

    const handleArchive = async () => {
        try {
            setCleaning(true)
            const { error: archError } = await supabase
                .from('audit_data')
                .update({ is_archived: true })
                .eq('status', 'completed')
                .eq('is_archived', false)

            if (archError) throw archError

            alert('Successfully archived all completed records. They will no longer appear in active metrics or queues.')
        } catch (err) {
            alert('Archiving failed: ' + err.message)
        } finally {
            setCleaning(false)
        }
    }

    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: '60px' }}>
            <div style={{ width: '100%', maxWidth: '1000px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1a202c', marginBottom: '30px' }}>
                    Data Management
                </h1>

                {/* CSV Import Section */}
                <div style={{
                    background: 'white',
                    padding: '40px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                    textAlign: 'center',
                    border: '2px dashed #e2e8f0',
                    marginBottom: '30px'
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
                            style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0 }}
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
                        <div style={{ marginTop: '30px', padding: '20px', background: '#f0fff4', border: '1px solid #c6f6d5', borderRadius: '8px', color: '#2f855a' }}>
                            <h3 style={{ marginBottom: '10px', fontWeight: '700' }}>Upload Successful</h3>
                            <p>{results.message}</p>
                        </div>
                    )}
                </div>

                {/* Archiving Section */}
                <div style={{
                    background: 'white',
                    padding: '30px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                    marginBottom: '30px',
                    border: '1px solid #e2e8f0'
                }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#2d3748', marginBottom: '10px' }}>Data Archiving</h2>
                    <p style={{ color: '#718096', fontSize: '14px', marginBottom: '20px' }}>
                        Archiving moves completed records out of the active dashboard and auditor queue while preserving them in the database for history/exports.
                    </p>
                    <button
                        onClick={handleArchive}
                        disabled={cleaning}
                        style={{
                            padding: '12px 24px',
                            background: '#3182ce',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            opacity: cleaning ? 0.7 : 1
                        }}
                    >
                        {cleaning ? 'Archiving...' : 'Archive Completed Audits'}
                    </button>
                </div>

                {/* Cleanup Tools Section */}
                <div style={{
                    background: '#fff5f5',
                    padding: '30px',
                    borderRadius: '12px',
                    border: '1px solid #feb2b2'
                }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#c53030', marginBottom: '10px' }}>⚠️ Danger Zone: Database Cleanup</h2>
                    <p style={{ color: '#718096', fontSize: '14px', marginBottom: '20px' }}>
                        Use these tools to manage database size. Deleting records will also remove all associated auditor responses.
                    </p>

                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button
                            onClick={() => startCleanup('completed')}
                            disabled={cleaning}
                            style={{
                                padding: '10px 20px',
                                background: 'white',
                                color: '#c53030',
                                border: '1px solid #feb2b2',
                                borderRadius: '6px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Delete Completed Records
                        </button>
                        <button
                            onClick={() => startCleanup('all')}
                            disabled={cleaning}
                            style={{
                                padding: '10px 20px',
                                background: '#c53030',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            {cleaning ? 'Cleaning...' : 'Purge All Database Records'}
                        </button>
                    </div>
                </div>

                {/* Duplicate Upload Confirmation Modal */}
                {uploadConfirmation.show && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            background: 'white',
                            padding: '30px',
                            borderRadius: '12px',
                            maxWidth: '500px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                        }}>
                            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#c53030', marginBottom: '15px' }}>
                                ⚠️ Duplicate Records Detected
                            </h3>
                            <div style={{ marginBottom: '20px', color: '#4a5568', lineHeight: '1.6' }}>
                                <p style={{ marginBottom: '10px' }}>
                                    <strong>File Date Range:</strong> {uploadConfirmation.dateRange}
                                </p>
                                <p style={{ marginBottom: '10px' }}>
                                    <strong>Total Records in File:</strong> {uploadConfirmation.totalRecords}
                                </p>
                                <p style={{ marginBottom: '10px', color: '#c53030' }}>
                                    <strong>Already Exist:</strong> {uploadConfirmation.duplicates}
                                </p>
                                <p style={{ marginBottom: '10px', color: '#2f855a' }}>
                                    <strong>New Records to Insert:</strong> {uploadConfirmation.newRecords}
                                </p>
                            </div>
                            <p style={{ marginBottom: '20px', fontSize: '14px', color: '#718096' }}>
                                You have already uploaded some of these records. Only unique data will be inserted. Do you want to continue?
                            </p>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={handleCancelUpload}
                                    style={{
                                        padding: '10px 20px',
                                        background: 'white',
                                        color: '#4a5568',
                                        border: '1px solid #cbd5e0',
                                        borderRadius: '6px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmUpload}
                                    style={{
                                        padding: '10px 20px',
                                        background: '#4f46e5',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Yes, Upload {uploadConfirmation.newRecords} New Records
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <ConfirmationModal
                    isVisible={modal.show}
                    message={modal.message}
                    modalStep={modal.step}
                    onConfirm={handleCleanupConfirm}
                    onCancel={() => setModal({ show: false, message: '', type: '', step: 1 })}
                />

                <div style={{ marginTop: '40px', background: '#edf2f7', padding: '20px', borderRadius: '10px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px' }}>Data Lifecycle Management</h3>
                    <p style={{ fontSize: '14px', color: '#4a5568' }}>
                        It is recommended to <strong>Export Reports</strong> before purging records. Once deleted, auditor findings cannot be recovered.
                    </p>
                </div>
            </div>
        </div>
    )
}
