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
    const [isTransitioning, setIsTransitioning] = useState(false) // New state for background loading
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

            // 2. Buffer Management:
            // Check how many pending records this auditor already has assigned
            const { data: existingPending, error: existingError } = await supabase
                .from('audit_data')
                .select('*')
                .eq('assigned_to', user.id)
                .eq('status', 'pending')
                .eq('is_archived', false)
                .order('created_at', { ascending: true })

            if (existingError) throw existingError

            let currentRecord = existingPending?.[0]

            // 3. If buffer is empty, pull a new BATCH of 5 random records
            if (!currentRecord) {
                // Get available count for random offset
                const { count: availableCount } = await supabase
                    .from('audit_data')
                    .select('*', { count: 'exact', head: true })
                    .is('assigned_to', null)
                    .eq('status', 'pending')
                    .eq('is_archived', false)

                if (availableCount && availableCount > 0) {
                    // Calculate how many we can pull (max 5, but don't exceed daily limit)
                    const remainingQuota = (profile?.daily_limit || 50) - todayCount
                    const batchSize = Math.min(5, availableCount, remainingQuota)

                    if (batchSize > 0) {
                        const randomIndex = Math.max(0, Math.floor(Math.random() * (availableCount - batchSize)))

                        // Fetch the IDs of the records to claim
                        const { data: batchToPull, error: pullError } = await supabase
                            .from('audit_data')
                            .select('id')
                            .is('assigned_to', null)
                            .eq('status', 'pending')
                            .eq('is_archived', false)
                            .range(randomIndex, randomIndex + batchSize - 1)

                        if (pullError) throw pullError

                        if (batchToPull && batchToPull.length > 0) {
                            const ids = batchToPull.map(r => r.id)
                            const { data: claimed, error: claimError } = await supabase
                                .from('audit_data')
                                .update({ assigned_to: user.id })
                                .in('id', ids)
                                .is('assigned_to', null) // Safety check: Only claim if still unassigned
                                .select()

                            if (claimError) throw claimError
                            currentRecord = claimed[0]
                        }
                    }
                }
            }

            if (!currentRecord) {
                setRecord(null)
                setLoading(false)
                setIsTransitioning(false)
                return
            }

            setRecord(currentRecord)

            // 4. Fetch questions (Common or Campaign-specific for this record)
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
            setIsTransitioning(false) // Always stop transition on finish
        }
    }

    const handleOptionSelect = (questionId, optionId) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionId }))
    }

    const handleSubmit = async () => {
        // Check for Skip Logic (Q1: ফাইল নেই or কিছুই শোনা যাচ্ছে না)
        const firstQuestion = questions[0]
        const firstAnswerId = answers[firstQuestion?.id]
        const firstAnswerOption = firstQuestion?.answer_options.find(opt => opt.id === firstAnswerId)
        const isSkipOption = firstAnswerOption?.option_text === 'ফাইল নেই' || firstAnswerOption?.option_text === 'কিছুই শোনা যাচ্ছে না'

        if (!isSkipOption && Object.keys(answers).length < questions.length) {
            alert('Please answer all questions before submitting.')
            return
        }

        try {
            setSubmitting(true)
            setIsTransitioning(true) // Start the smooth transition
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

            // 3. Prepare for next - keep current UI visible for a split second 
            // then loadNextAudit will replace the stats and record.
            setAnswers({})
            setIsPlaying(false)
            if (audioRef.current) audioRef.current.pause()

            // 4. Fetch the next pending record (this will handle clearing isTransitioning)
            await loadNextAudit()

        } catch (err) {
            console.error('Submit error:', err)
            alert('Failed to submit audit: ' + err.message)
            setIsTransitioning(false)
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

    // Logic for Skip Validation
    const firstQuestion = questions[0]
    const firstAnswerId = firstQuestion ? answers[firstQuestion.id] : null
    const firstAnswerOption = firstQuestion?.answer_options.find(opt => opt.id === firstAnswerId)
    const isSkipOption = firstAnswerOption?.option_text === 'ফাইল নেই' || firstAnswerOption?.option_text === 'কিছুই শোনা যাচ্ছে না'
    const canSubmit = isSkipOption || (Object.keys(answers).length >= questions.length && questions.length > 0)

    if (loading && !record) return <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700', color: '#4f46e5' }}>Initializing Audit Environment...</div>

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

    if (!record && !loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <h2>Queue Empty</h2>
                <p>No pending audits available. Great job!</p>
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
        <div style={{ position: 'relative', width: '100%' }}>
            {/* Smooth Transition Overlay */}
            {isTransitioning && (
                <div style={{
                    position: 'absolute',
                    inset: '-10px',
                    background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 100,
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '3px solid #e2e8f0',
                        borderTopColor: '#4f46e5',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <div style={{ marginTop: '15px', fontWeight: '800', color: '#4f46e5', fontSize: '14px', letterSpacing: '0.05em' }}>PREPARING NEXT AUDIT...</div>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            )}

            <div className={`audit-grid ${isTransitioning ? 'blur' : 'fade-in'}`} style={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: '540px 1fr',
                gap: '15px',
                alignItems: 'start',
                opacity: isTransitioning ? 0.6 : 1,
                transition: 'opacity 0.4s ease'
            }}>

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
                            <div style={{ fontSize: '24px' }}>
                                {((profile?.daily_limit || 50) - stats.completedToday) === 1 ? '🏁' :
                                    ((profile?.daily_limit || 50) - stats.completedToday) <= 5 ? '✨' :
                                        ((profile?.daily_limit || 50) - stats.completedToday) <= 10 ? '🎯' : '💪'}
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', fontWeight: '700', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Queue Progress</div>
                                <div style={{ fontSize: '15px', fontWeight: '800' }}>
                                    {(() => {
                                        const remaining = (profile?.daily_limit || 50) - stats.completedToday;
                                        if (remaining === 1) return <>The final one! <span style={{ color: '#fcd34d', fontSize: '20px', textShadow: '0 0 10px rgba(252, 211, 77, 0.5)' }}>🚀 Almost there!</span></>;
                                        if (remaining <= 5) return <>Last sprint! Only <span style={{ fontSize: '20px', color: '#fcd34d' }}>{remaining}</span> left. 🎉</>;
                                        if (remaining <= 10) return <>Great pace! <span style={{ color: '#fcd34d' }}>{remaining}</span> to go. Keep it up!</>;
                                        return <>You have <span style={{ fontSize: '20px', color: '#fcd34d' }}>{remaining}</span> more to go today.</>;
                                    })()}
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

                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'center' }}>
                                <button
                                    onClick={() => skip(-10)}
                                    style={skipButtonStyle}
                                    onMouseDown={(e) => {
                                        e.currentTarget.style.transform = 'translateY(1px) scale(0.97)';
                                        e.currentTarget.style.background = '#f1f5f9';
                                    }}
                                    onMouseUp={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                        e.currentTarget.style.background = 'white';
                                    }}
                                >
                                    ⏪ 10s Backward
                                </button>
                                <button
                                    onClick={() => skip(10)}
                                    style={skipButtonStyle}
                                    onMouseDown={(e) => {
                                        e.currentTarget.style.transform = 'translateY(1px) scale(0.97)';
                                        e.currentTarget.style.background = '#f1f5f9';
                                    }}
                                    onMouseUp={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                        e.currentTarget.style.background = 'white';
                                    }}
                                >
                                    10s Forward ⏩
                                </button>
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
                        <div style={{ height: '180px', borderRadius: '8px', overflow: 'hidden', background: '#e2e8f0', border: '1px solid #edf2f7' }}>
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

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '15px 20px',
                        paddingRight: '5px'
                    }}>
                        {questions.map((q, idx) => {
                            const isSkipped = isSkipOption && idx > 0;
                            return (
                                <div key={q.id} style={{
                                    background: isSkipped ? '#f1f5f9' : '#f8fafc',
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: '1px solid #edf2f7',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    opacity: isSkipped ? 0.5 : 1,
                                    pointerEvents: isSkipped ? 'none' : 'auto',
                                    filter: isSkipped ? 'grayscale(1)' : 'none',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <p style={{ fontSize: '14px', fontWeight: '800', color: '#1a202c', marginBottom: '8px', lineHeight: '1.4' }}>
                                        {idx + 1}. {q.question_text}
                                    </p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: 'auto' }}>
                                        {q.answer_options.map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => handleOptionSelect(q.id, opt.id)}
                                                style={{
                                                    padding: '8px 18px',
                                                    minWidth: '70px',
                                                    textAlign: 'center',
                                                    fontSize: '12px',
                                                    borderRadius: '8px',
                                                    border: '1px solid',
                                                    borderColor: answers[q.id] === opt.id ? '#4f46e5' : '#e2e8f0',
                                                    background: answers[q.id] === opt.id ? '#ebf4ff' : 'white',
                                                    color: answers[q.id] === opt.id ? '#4f46e5' : '#4a5568',
                                                    fontWeight: answers[q.id] === opt.id ? '700' : '500',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    boxShadow: answers[q.id] === opt.id ? '0 2px 4px rgba(79, 70, 229, 0.1)' : 'none'
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
                            )
                        })}
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !canSubmit}
                        style={{
                            width: '100%',
                            padding: '12px',
                            marginTop: '15px',
                            background: (submitting || !canSubmit) ? '#e2e8f0' : 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '800',
                            fontSize: '14px',
                            cursor: (submitting || !canSubmit) ? 'not-allowed' : 'pointer',
                            boxShadow: (submitting || !canSubmit) ? 'none' : '0 10px 15px -3px rgba(72, 187, 120, 0.3)',
                            transition: 'transform 0.2s'
                        }}
                        onMouseDown={(e) => {
                            if (!submitting && canSubmit) {
                                e.currentTarget.style.transform = 'translateY(1px) scale(0.98)'
                                e.currentTarget.style.boxShadow = 'none'
                                e.currentTarget.style.filter = 'brightness(0.9)'
                            }
                        }}
                        onMouseUp={(e) => {
                            if (!submitting && canSubmit) {
                                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(72, 187, 120, 0.3)'
                                e.currentTarget.style.filter = 'brightness(1)'
                            }
                        }}
                    >
                        {submitting ? 'Submitting...' : 'COMPLETE & NEXT ➔'}
                    </button>
                </div>

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

const skipButtonStyle = {
    padding: '8px 20px',
    fontSize: '12px',
    fontWeight: '700',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    background: 'white',
    color: '#4f46e5',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    minWidth: '140px'
}
