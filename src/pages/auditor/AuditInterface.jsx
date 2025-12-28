import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import MapPreview from '../../components/MapPreview'

export default function AuditInterface() {
    const { user, profile } = useAuth()
    const navigate = useNavigate()
    const audioRef = useRef(null)

    // Data States
    const [record, setRecord] = useState(null)
    const [questions, setQuestions] = useState([])
    const [answers, setAnswers] = useState({}) // { questionId: optionId }

    // UI States
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [limitReached, setLimitReached] = useState(false)
    const [playbackRate, setPlaybackRate] = useState(1)
    const [isPlaying, setIsPlaying] = useState(false)
    const [stats, setStats] = useState({ remaining: 0, completedToday: 0 })

    useEffect(() => {
        if (user) loadNextAudit()
    }, [user])

    async function loadNextAudit() {
        try {
            setLoading(true)
            setAnswers({})
            setLimitReached(false)

            // 1. Fetch overall stats for motivation
            const today = new Date().toISOString().split('T')[0]

            const [todayCountRes, remainingCountRes] = await Promise.all([
                supabase
                    .from('audit_data')
                    .select('*', { count: 'exact', head: true })
                    .eq('assigned_to', user.id)
                    .eq('status', 'completed')
                    .eq('is_archived', false)
                    .gte('completed_at', `${today}T00:00:00`),
                supabase
                    .from('audit_data')
                    .select('*', { count: 'exact', head: true })
                    .eq('assigned_to', user.id)
                    .eq('status', 'pending')
                    .eq('is_archived', false)
            ])

            const todayCount = todayCountRes.count || 0
            const remainingCount = remainingCountRes.count || 0
            setStats({ remaining: remainingCount, completedToday: todayCount })

            if (todayCount >= (profile?.daily_limit || 50)) {
                setLimitReached(true)
                setRecord(null)
                setLoading(false)
                return
            }

            // 2. Fetch one record: 
            // Try to find one already assigned to this auditor that is pending
            const { data: existingAssigned, error: existingError } = await supabase
                .from('audit_data')
                .select('*')
                .eq('assigned_to', user.id)
                .eq('status', 'pending')
                .eq('is_archived', false)
                .limit(1)

            let currentRecord = existingAssigned?.[0]

            // If no record is assigned, PULL the oldest unassigned pending record from the global queue
            if (!currentRecord) {
                const { data: pulled, error: pullError } = await supabase
                    .from('audit_data')
                    .select('*')
                    .is('assigned_to', null)
                    .eq('status', 'pending')
                    .eq('is_archived', false)
                    .order('created_at', { ascending: true })
                    .limit(1)

                if (pullError) throw pullError

                if (pulled && pulled.length > 0) {
                    // Update the record immediately to "claim" it
                    const { data: claimed, error: claimError } = await supabase
                        .from('audit_data')
                        .update({ assigned_to: user.id })
                        .eq('id', pulled[0].id)
                        .select()

                    if (claimError) throw claimError
                    currentRecord = claimed[0]
                }
            }

            if (!currentRecord) {
                setRecord(null)
                setLoading(false)
                return
            }

            setRecord(currentRecord)

            // 3. Fetch questions (Common or Campaign-specific for this record)
            const { data: qData, error: qError } = await supabase
                .from('questions')
                .select('*, answer_options(*)')
                .or(`question_type.eq.common,and(question_type.eq.campaign,campaign_id.eq."${currentRecord.campaign_id}")`)
                .order('order_index', { ascending: true })

            if (qError) throw qError
            setQuestions(qData || [])

        } catch (err) {
            console.error('Failed to load audit:', err)
            alert('Error loading audit data. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleOptionSelect = (questionId, optionId) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionId }))
    }

    const handleSubmit = async () => {
        if (Object.keys(answers).length < questions.length) {
            alert('Please answer all questions before submitting.')
            return
        }

        try {
            setSubmitting(true)
            const currentRecordId = record.id // Guard ID

            // 1. Insert/Upsert responses
            const responseEntries = Object.entries(answers).map(([qId, oId]) => ({
                audit_data_id: currentRecordId,
                question_id: qId,
                answer_option_id: oId,
                auditor_id: user.id
            }))

            const { error: respError } = await supabase
                .from('audit_responses')
                .upsert(responseEntries, { onConflict: 'audit_data_id,question_id' })

            if (respError) throw respError

            // 2. Update record status to 'completed'
            const { error: updateError } = await supabase
                .from('audit_data')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString()
                })
                .eq('id', currentRecordId)

            if (updateError) throw updateError

            // 3. Clear current record from state to force UI refresh
            setRecord(null)
            setAnswers({})
            setIsPlaying(false)
            if (audioRef.current) audioRef.current.pause()

            // 4. Fetch the next pending record
            await loadNextAudit()

        } catch (err) {
            console.error('Submit error:', err)
            alert('Failed to submit audit: ' + err.message)
        } finally {
            setSubmitting(false)
        }
    }

    // Audio Controls logic
    const togglePlay = () => {
        if (audioRef.current.paused) {
            audioRef.current.play()
            setIsPlaying(true)
        } else {
            audioRef.current.pause()
            setIsPlaying(false)
        }
    }

    const handleSpeed = () => {
        const rates = [1, 1.25, 1.5, 2]
        const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length]
        setPlaybackRate(nextRate)
        audioRef.current.playbackRate = nextRate
    }

    const skip = (seconds) => {
        audioRef.current.currentTime += seconds
    }

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading audit environment...</div>

    if (limitReached) {
        return (
            <div style={{ padding: '60px 20px', textAlign: 'center', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '50px', marginBottom: '20px' }}>🛑</div>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1a202c', marginBottom: '10px' }}>Daily Limit Reached</h2>
                <p style={{ color: '#718096', marginBottom: '30px' }}>
                    You have reached your daily limit of <strong>{profile?.daily_limit}</strong> audits.<br />
                    Please come back tomorrow or contact your supervisor.
                </p>
                <button
                    onClick={() => navigate('/auditor')}
                    style={{ padding: '12px 24px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                >
                    Return to Dashboard
                </button>
            </div>
        )
    }

    if (!record) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <h2>Queue Empty</h2>
                <p>No pending audits assigned to you. Great job!</p>
                <button
                    onClick={() => navigate('/auditor')}
                    style={{ marginTop: '20px', padding: '10px 20px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                    Back to Dashboard
                </button>
            </div>
        )
    }

    return (
        <div className="audit-grid fade-in" style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 400px', gap: '20px', alignItems: 'start' }}>

            {/* Left Column: Data & Audio */}
            <div>
                {/* Motivation Bar */}
                <div style={{
                    background: 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ fontSize: '20px' }}>🎯</div>
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: '700', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Queue Progress</div>
                            <div style={{ fontSize: '15px', fontWeight: '800' }}>
                                {stats.remaining < 15 ? (
                                    <>Only <span style={{ fontSize: '20px', color: '#fcd34d' }}>{stats.remaining}</span> audits remaining!</>
                                ) : (
                                    <>Keep going! You're doing great.</>
                                )}
                            </div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', opacity: 0.8 }}>COMPLETED TODAY</div>
                        <div style={{ fontSize: '18px', fontWeight: '900' }}>{stats.completedToday} / {profile?.daily_limit || 50}</div>
                    </div>
                </div>

                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Contact Preview</h2>
                        <span style={{ fontSize: '11px', color: '#718096', fontWeight: '600', background: '#f7fafc', padding: '2px 8px', borderRadius: '4px' }}>
                            ID: {record.contact_id}
                        </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', fontSize: '13px' }}>
                        <div style={infoBoxStyle}><label style={labelStyle}>Campaign</label>{record.campaign_name}</div>
                        <div style={infoBoxStyle}><label style={labelStyle}>Date</label>{record.contact_date}</div>
                        <div style={infoBoxStyle}><label style={labelStyle}>Duration</label>{record.duration}</div>
                        <div style={infoBoxStyle}><label style={labelStyle}>Outlet</label>{record.outlet_name || 'N/A'}</div>
                    </div>

                    <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #edf2f7' }} />

                    {/* Audio Player UI - More Compact */}
                    <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <button onClick={togglePlay} style={playButtonStyle}>
                                {isPlaying ? '⏸' : '▶'}
                            </button>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '11px', color: '#4a5568', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Audio Review</span>
                                    <span style={{ fontSize: '11px', color: '#a0aec0' }}>{playbackRate}x Speed</span>
                                </div>
                                <audio
                                    ref={audioRef}
                                    src={record.audio_link}
                                    onEnded={() => setIsPlaying(false)}
                                    style={{ width: '100%', height: '32px' }}
                                    controls
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            <button onClick={() => skip(-10)} style={smallButtonStyle}>⏪ 10s</button>
                            <button onClick={() => skip(10)} style={smallButtonStyle}>10s ⏩</button>
                            <div style={{ flex: 1 }}></div>
                            {[1, 1.5, 2].map(speed => (
                                <button
                                    key={speed}
                                    onClick={() => {
                                        setPlaybackRate(speed)
                                        audioRef.current.playbackRate = speed
                                    }}
                                    style={{
                                        ...smallButtonStyle,
                                        background: playbackRate === speed ? '#4f46e5' : 'white',
                                        color: playbackRate === speed ? 'white' : '#4a5568',
                                        borderColor: playbackRate === speed ? '#4f46e5' : '#e2e8f0'
                                    }}
                                >
                                    {speed}x
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Location Map */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '600' }}>Location Verification</h3>
                        <span style={{ fontSize: '11px', color: '#48bb78', fontWeight: '700' }}>● GPS ENABLED</span>
                    </div>
                    <div style={{ height: '260px', borderRadius: '8px', overflow: 'hidden', background: '#e2e8f0', border: '1px solid #edf2f7' }}>
                        {record.location ? (() => {
                            const [lat, lng] = record.location.split(',').map(s => parseFloat(s.trim()))
                            return <MapPreview lat={lat} lng={lng} />
                        })() : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#718096' }}>No Location Data</div>}
                    </div>
                </div>
            </div>

            {/* Right Column: Questions */}
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', position: 'sticky', top: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#1a202c', marginBottom: '15px', borderBottom: '2px solid #ebf4ff', paddingBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Audit Checklist
                </h3>

                <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 220px)', paddingRight: '5px' }}>
                    {questions.map((q, idx) => (
                        <div key={q.id} style={{ marginBottom: '20px' }}>
                            <p style={{ fontSize: '13px', fontWeight: '700', color: '#2d3748', marginBottom: '8px', lineHeight: '1.4' }}>
                                {idx + 1}. {q.question_text}
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {q.answer_options.map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => handleOptionSelect(q.id, opt.id)}
                                        style={{
                                            padding: '6px 10px',
                                            fontSize: '11px',
                                            borderRadius: '6px',
                                            border: '1px solid',
                                            borderColor: answers[q.id] === opt.id ? '#4f46e5' : '#e2e8f0',
                                            background: answers[q.id] === opt.id ? '#ebf4ff' : 'white',
                                            color: answers[q.id] === opt.id ? '#4f46e5' : '#4a5568',
                                            fontWeight: answers[q.id] === opt.id ? '700' : '500',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (answers[q.id] !== opt.id) {
                                                e.currentTarget.style.borderColor = '#4f46e5'
                                                e.currentTarget.style.background = '#f8fafc'
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (answers[q.id] !== opt.id) {
                                                e.currentTarget.style.borderColor = '#e2e8f0'
                                                e.currentTarget.style.background = 'white'
                                            }
                                        }}
                                    >
                                        {opt.option_text}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={submitting || Object.keys(answers).length < questions.length}
                    style={{
                        width: '100%',
                        padding: '12px',
                        marginTop: '15px',
                        background: (submitting || Object.keys(answers).length < questions.length) ? '#e2e8f0' : 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '800',
                        fontSize: '14px',
                        cursor: (submitting || Object.keys(answers).length < questions.length) ? 'not-allowed' : 'pointer',
                        boxShadow: (submitting || Object.keys(answers).length < questions.length) ? 'none' : '0 10px 15px -3px rgba(72, 187, 120, 0.3)',
                        transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        if (!submitting && Object.keys(answers).length >= questions.length) {
                            e.currentTarget.style.transform = 'translateY(-2px)'
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                    }}
                >
                    {submitting ? 'Submitting...' : 'COMPLETE & NEXT ➔'}
                </button>
            </div>

        </div>
    )
}

const infoBoxStyle = {
    background: '#f8fafc',
    padding: '10px 15px',
    borderRadius: '6px',
    border: '1px solid #edf2f7'
}

const labelStyle = {
    display: 'block',
    fontSize: '10px',
    fontWeight: '800',
    textTransform: 'uppercase',
    color: '#a0aec0',
    marginBottom: '2px'
}

const playButtonStyle = {
    width: '50px',
    height: '50px',
    borderRadius: '25px',
    border: 'none',
    background: '#4f46e5',
    color: 'white',
    fontSize: '20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 6px rgba(79, 70, 229, 0.3)'
}

const smallButtonStyle = {
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '600',
    borderRadius: '4px',
    border: '1px solid #e2e8f0',
    background: 'white',
    color: '#4a5568',
    cursor: 'pointer'
}
