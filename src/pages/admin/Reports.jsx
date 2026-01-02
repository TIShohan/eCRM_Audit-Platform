import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Papa from 'papaparse'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import AdminPageHeader from '../../components/admin/AdminPageHeader'

// Simple SVG Icons with 50% opacity
const Icon = ({ path, size = 18, color = 'currentColor', rotate = false }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
            opacity: 0.5,
            display: 'block',
            animation: rotate ? 'spin 1s linear infinite' : 'none'
        }}
    >
        <path d={path} />
    </svg>
)

const PATHS = {
    calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    chevronLeft: "M15 18l-6-6 6-6",
    chevronRight: "M9 18l6-6-6-6",
    zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
    download: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
    refresh: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
    arrowRight: "M5 12h14M12 5l7 7-7 7",
    file: "M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9zM13 2v7h7",
    loader: "M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"
}

/**
 * Custom Header Component for DatePickers
 */
const CustomHeader = ({
    date,
    decreaseYear,
    increaseYear,
    decreaseMonth,
    increaseMonth,
    prevYearButtonDisabled,
    nextYearButtonDisabled,
    prevMonthButtonDisabled,
    nextMonthButtonDisabled,
    showMonthNav = true,
}) => (
    <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid #f1f5f9',
        background: '#fff'
    }}>
        <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={decreaseYear} disabled={prevYearButtonDisabled} className="header-nav-btn">
                <Icon path={PATHS.chevronLeft} size={14} />
            </button>
            {showMonthNav && (
                <button onClick={decreaseMonth} disabled={prevMonthButtonDisabled} className="header-nav-btn">
                    <Icon path={PATHS.chevronLeft} size={18} />
                </button>
            )}
        </div>

        <span key={`${date.getFullYear()}-${date.getMonth()}`} className="header-year-display" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {showMonthNav && <span style={{ color: '#4f46e5' }}>{date.toLocaleString('default', { month: 'long' })}</span>}
            <span style={{ fontWeight: '900' }}>{date.getFullYear()}</span>
        </span>

        <div style={{ display: 'flex', gap: '6px' }}>
            {showMonthNav && (
                <button onClick={increaseMonth} disabled={nextMonthButtonDisabled} className="header-nav-btn">
                    <Icon path={PATHS.chevronRight} size={18} />
                </button>
            )}
            <button onClick={increaseYear} disabled={nextYearButtonDisabled} className="header-nav-btn">
                <Icon path={PATHS.chevronRight} size={14} />
            </button>
        </div>
    </div>
)

export default function Reports() {
    const [startDate, setStartDate] = useState(null)
    const [endDate, setEndDate] = useState(null)
    const [selectedMonthPlaceholder, setSelectedMonthPlaceholder] = useState(null)
    const [exporting, setExporting] = useState(false)
    const [message, setMessage] = useState({ text: '', type: '' })

    useEffect(() => {
        if (startDate && endDate) {
            const isFirstDay = startDate.getDate() === 1
            const lastDay = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)
            if (isFirstDay && endDate.getDate() === lastDay.getDate() && startDate.getMonth() === endDate.getMonth()) {
                setSelectedMonthPlaceholder(startDate)
            } else {
                setSelectedMonthPlaceholder(null)
            }
        } else {
            setSelectedMonthPlaceholder(null)
        }
    }, [startDate, endDate])

    const handleReset = () => {
        setStartDate(null)
        setEndDate(null)
        setSelectedMonthPlaceholder(null)
        setMessage({ text: '', type: '' })
    }

    const handleExport = async () => {
        if (!startDate || !endDate) {
            setMessage({ text: 'Please define an export timeline first.', type: 'error' })
            return
        }

        try {
            setExporting(true)
            setMessage({ text: 'Aggregating records and flattening response data...', type: 'info' })

            const { data, error } = await supabase
                .from('audit_data')
                .select(`
                    *,
                    auditor:user_profiles!audit_data_assigned_to_fkey(id, full_name, email),
                    responses:audit_responses!audit_responses_audit_data_id_fkey(
                        question_id, answer_option_id, question_text,
                        question:questions(question_text),
                        option:answer_options(option_text)
                    )
                `)
                .eq('status', 'completed')
                .gte('contact_date', startDate.toISOString().split('T')[0])
                .lte('contact_date', endDate.toISOString().split('T')[0])
                .order('completed_at', { ascending: true })

            if (error) throw error
            if (!data || data.length === 0) {
                setMessage({ text: `No records found between ${startDate.toLocaleDateString()} and ${endDate.toLocaleDateString()}.`, type: 'error' })
                return
            }

            const { data: allQuestions, error: qError } = await supabase
                .from('questions')
                .select('question_text, order_index, question_type, campaign_id')
                .eq('is_active', true)
                .order('order_index', { ascending: true })

            if (qError) throw qError

            const activeCampaigns = new Set(data.map(d => d.campaign_id))
            const masterList = allQuestions
                .filter(q => q.question_type === 'common' || activeCampaigns.has(q.campaign_id))
                .map(q => q.question_text)

            const legacyList = new Set()
            data.forEach(record => {
                record.responses?.forEach(resp => {
                    const qText = resp.question_text || resp.question?.question_text
                    if (qText && !masterList.includes(qText)) legacyList.add(qText)
                })
            })

            const sortedQuestions = [...masterList, ...Array.from(legacyList).sort()]
            const fixedColumns = ['Contact_id', 'Contact_Date', 'Region', 'Area', 'Territory', 'House', 'Point', 'Auditee_ID', 'Auditee_Name', 'Outlet', 'Route', 'Cluster', 'Campaign_ID', 'Campaign', 'Audio_Link', 'Duration', 'Auditor', 'Completed_At']

            const formatted = data.map(record => {
                const row = {
                    'Contact_id': record.contact_id || '',
                    'Contact_Date': record.contact_date || '',
                    'Region': record.assigned_region || '',
                    'Area': record.assigned_area || '',
                    'Territory': record.assigned_territory || '',
                    'House': record.assigned_house || '',
                    'Point': record.assigned_point || '',
                    'Auditee_ID': record.auditee_id || '',
                    'Auditee_Name': record.auditee_name || '',
                    'Outlet': record.outlet_name || '',
                    'Route': record.route || '',
                    'Cluster': record.cluster || '',
                    'Campaign_ID': record.campaign_id || '',
                    'Campaign': record.campaign_name || '',
                    'Audio_Link': record.audio_link || '',
                    'Duration': record.duration || '',
                    'Auditor': record.auditor?.full_name || record.auditor?.email || 'Unassigned',
                    'Completed_At': record.completed_at ? new Date(record.completed_at).toLocaleString() : ''
                }
                sortedQuestions.forEach(q => { row[q] = '' })
                record.responses?.forEach(resp => {
                    const qText = resp.question_text || resp.question?.question_text
                    if (qText) row[qText] = resp.option?.option_text || ''
                })
                return row
            })

            const csv = Papa.unparse(formatted, { columns: [...fixedColumns, ...sortedQuestions] })
            const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `Audit_Report_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}.csv`
            document.body.appendChild(link)
            link.click()
            URL.revokeObjectURL(url)
            setMessage({ text: `Successfully exported ${data.length} records.`, type: 'success' })
        } catch (err) {
            setMessage({ text: 'Compilation failed: ' + err.message, type: 'error' })
        } finally {
            setExporting(false)
        }
    }

    return (
        <div className="fade-in" style={{ width: '100%', maxWidth: '960px', margin: '0 auto' }}>
            <AdminPageHeader title="Audit Reports" subtitle="High-scale data synthesis and export engine." />

            <div style={containerStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={dotStyle}></div>
                        <div>
                            <h2 style={sectionTitleStyle}>Timeline Configuration</h2>
                            {startDate && endDate ? (
                                <div style={rangeBadgeStyle}>
                                    <Icon path={PATHS.calendar} size={12} />
                                    <span>{startDate.toLocaleDateString()}</span>
                                    <Icon path={PATHS.arrowRight} size={10} />
                                    <span>{endDate.toLocaleDateString()}</span>
                                </div>
                            ) : (
                                <span style={{ fontSize: '12px', color: '#94a3b8' }}>No dates selected yet</span>
                            )}
                        </div>
                    </div>
                    <button onClick={handleReset} style={resetBtnStyle}>
                        <Icon path={PATHS.refresh} size={12} />
                        Reset
                    </button>
                </div>

                <div style={quickSelectCardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <div style={zapIconStyle}><Icon path={PATHS.zap} size={14} color="white" /></div>
                        <label style={miniLabelStyle}>Smart Selection: Entire Month Export</label>
                    </div>
                    <div style={inputWrapperStyle}>
                        <div style={inputIconStyle}><Icon path={PATHS.calendar} size={18} /></div>
                        <DatePicker
                            selected={selectedMonthPlaceholder}
                            onChange={(date) => {
                                if (date) {
                                    setStartDate(new Date(date.getFullYear(), date.getMonth(), 1))
                                    setEndDate(new Date(date.getFullYear(), date.getMonth() + 1, 0))
                                }
                            }}
                            dateFormat="MMMM yyyy"
                            showMonthYearPicker
                            placeholderText="Select month to populate range..."
                            className="modern-datepicker-input"
                            portalId="root-portal"
                            renderCustomHeader={(props) => <CustomHeader {...props} showMonthNav={false} />}
                        />
                    </div>
                </div>

                <div style={dividerStyle}>
                    <div style={lineStyle}></div>
                    <span style={dividerTextStyle}>Custom Range Definition</span>
                    <div style={lineStyle}></div>
                </div>

                <div style={gridStyle}>
                    <div>
                        <label style={labelStyle}>Start Date</label>
                        <div style={inputWrapperStyle}>
                            <div style={inputIconStyle}><Icon path={PATHS.calendar} size={18} /></div>
                            <DatePicker
                                selected={startDate}
                                onChange={setStartDate}
                                selectsStart
                                startDate={startDate}
                                endDate={endDate}
                                dateFormat="yyyy-MM-dd"
                                fixedHeight
                                portalId="root-portal"
                                className="modern-datepicker-input"
                                renderCustomHeader={(props) => <CustomHeader {...props} />}
                            />
                        </div>
                    </div>
                    <div>
                        <label style={labelStyle}>End Date</label>
                        <div style={inputWrapperStyle}>
                            <div style={inputIconStyle}><Icon path={PATHS.calendar} size={18} /></div>
                            <DatePicker
                                selected={endDate}
                                onChange={setEndDate}
                                selectsEnd
                                startDate={startDate}
                                endDate={endDate}
                                minDate={startDate}
                                dateFormat="yyyy-MM-dd"
                                fixedHeight
                                portalId="root-portal"
                                className="modern-datepicker-input"
                                renderCustomHeader={(props) => <CustomHeader {...props} />}
                            />
                        </div>
                    </div>
                </div>

                {message.text && (
                    <div style={{
                        ...msgBoxStyle,
                        background: message.type === 'error' ? '#fef2f2' : (message.type === 'success' ? '#f0fdf4' : '#eff6ff'),
                        color: message.type === 'error' ? '#b91c1c' : (message.type === 'success' ? '#15803d' : '#1d4ed8')
                    }}>
                        <Icon path={PATHS.file} size={18} />
                        {message.text}
                    </div>
                )}

                <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="interactive-btn"
                    style={{
                        ...exportBtnStyle,
                        background: exporting ? '#94a3b8' : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                        boxShadow: exporting ? 'none' : '0 10px 30px rgba(79, 70, 229, 0.3)'
                    }}
                >
                    {exporting ? <><Icon path={PATHS.loader} size={20} color="white" rotate /> Processing...</> : <><Icon path={PATHS.download} size={20} color="white" /> Generate Global Report</>}
                </button>
            </div>

            <div style={footerSpecStyle}>
                <div style={footerIconWrapperStyle}><Icon path={PATHS.file} size={20} color="#4f46e5" /></div>
                <div>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>Technical Specification</h3>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Reports feature serialized metadata, audio trace links, and dynamic mapping. Encoded in UTF-8 with BOM.</p>
                </div>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .header-nav-btn { background: transparent; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 6px; border-radius: 50%; transition: all 0.2s; }
                .header-nav-btn:hover:not(:disabled) { background: #f1f5f9; }
                .header-year-display { font-weight: 800; font-size: 15px; color: #0f172a; animation: pulseEffect 0.4s ease-out; }
                @keyframes pulseEffect { 0% { transform: scale(1); } 50% { transform: scale(1.1); color: #4f46e5; } 100% { transform: scale(1); } }
                .modern-datepicker-input { width: 100%; padding: 14px 18px 14px 46px; border: 1px solid #e2e8f0; border-radius: 14px; font-size: 15px; font-weight: 600; background: #f8fafc; outline: none; color: #0f172a; transition: all 0.2s; cursor: pointer; }
                .modern-datepicker-input:focus { border-color: #4f46e5; background: #fff; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.08); }
                .react-datepicker { font-family: 'Inter', sans-serif; border: none; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15); overflow: hidden; background: #fff; display: flex; flex-direction: column; }
                .react-datepicker__month-container { width: 100%; display: flex; flex-direction: column; }
                .react-datepicker__month { margin: 0; padding: 15px; display: flex; flex-direction: column; align-items: center; }
                .react-datepicker__header { background: #fff; border-bottom: 1px solid #f1f5f9; padding: 0; width: 100%; }
                .react-datepicker__day-names { display: flex; justify-content: center; padding: 10px 15px 0; }
                .react-datepicker__day-name { color: #94a3b8; fontWeight: 700; font-size: 11px; width: 40px; margin: 2px; text-align: center; }
                .react-datepicker__week { display: flex; justify-content: center; }
                .react-datepicker__day { width: 40px; line-height: 40px; margin: 2px; border-radius: 12px; font-weight: 600; color: #334155; text-align: center; transition: all 0.2s; }
                .react-datepicker__day--outside-month { opacity: 0.25; font-weight: 400; }
                .react-datepicker__day:hover { background: #f1f5f9; color: #4f46e5; opacity: 1; }
                .react-datepicker__day--selected, .react-datepicker__day--in-range { background: #4f46e5 !important; color: #fff !important; opacity: 1 !important; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2); }
                
                /* Redesigned 3x4 Month Picker */
                .react-datepicker { 
                    font-family: 'Inter', sans-serif; 
                    border: none; 
                    border-radius: 24px; 
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.18); 
                    overflow: hidden; 
                    background: #fff; 
                    width: 320px !important;
                    display: flex !important;
                    flex-direction: column !important;
                }
                .react-datepicker__month-container { width: 100% !important; }
                .react-datepicker__month { 
                    padding: 20px !important;
                    margin: 0 !important;
                    display: flex !important;
                    flex-direction: column !important;
                    gap: 8px !important;
                }
                .react-datepicker__month-wrapper { 
                    display: grid !important; 
                    grid-template-columns: repeat(3, 1fr) !important; 
                    gap: 12px !important; 
                    width: 100% !important;
                }
                .react-datepicker__month-text { 
                    padding: 14px 0 !important; 
                    margin: 0 !important; 
                    border-radius: 14px !important; 
                    font-weight: 700 !important; 
                    color: #475569 !important; 
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    font-size: 14px !important;
                    text-align: center !important;
                    cursor: pointer !important;
                    width: 100% !important;
                }
                .react-datepicker__month-text:hover { background: #f8fafc !important; color: #4f46e5 !important; transform: scale(1.05); }
                .react-datepicker__month-text--selected, .react-datepicker__month-text--keyboard-selected { 
                    background: #4f46e5 !important; 
                    color: #fff !important; 
                    box-shadow: 0 10px 20px -5px rgba(79, 70, 229, 0.4) !important; 
                }
            `}</style>
        </div>
    )
}

const containerStyle = { background: 'white', padding: '48px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 40px rgba(0,0,0,0.03)', position: 'relative' }
const dotStyle = { width: '12px', height: '12px', background: '#4f46e5', borderRadius: '50%', boxShadow: '0 0 0 4px rgba(79, 70, 229, 0.1)' }
const sectionTitleStyle = { fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0, marginBottom: '6px' }
const resetBtnStyle = { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontWeight: '700', color: '#64748b', cursor: 'pointer' }
const rangeBadgeStyle = { display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 10px', background: '#eff6ff', color: '#1d4ed8', borderRadius: '8px', fontSize: '11px', fontWeight: '800' }
const quickSelectCardStyle = { marginBottom: '32px', padding: '24px', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', borderRadius: '18px', border: '1px solid #bae6fd' }
const zapIconStyle = { background: '#0284c7', padding: '6px', borderRadius: '8px', display: 'flex' }
const miniLabelStyle = { fontSize: '13px', fontWeight: '800', color: '#0369a1', marginBottom: 0 }
const inputWrapperStyle = { position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }
const inputIconStyle = { position: 'absolute', left: '16px', zIndex: 10, pointerEvents: 'none' }
const dividerStyle = { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }
const lineStyle = { height: '1px', background: '#e2e8f0', flex: 1 }
const dividerTextStyle = { fontSize: '11px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }
const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '40px' }
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }
const msgBoxStyle = { padding: '16px 20px', borderRadius: '14px', marginBottom: '32px', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '12px' }
const exportBtnStyle = { width: '100%', padding: '18px', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '900', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: 'pointer' }
const footerSpecStyle = { marginTop: '48px', background: '#f8fafc', padding: '32px', borderRadius: '20px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '24px' }
const footerIconWrapperStyle = { background: 'white', padding: '12px', borderRadius: '14px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', height: 'fit-content' }
