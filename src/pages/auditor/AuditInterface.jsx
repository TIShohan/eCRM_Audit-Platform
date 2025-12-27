import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import MapPreview from '../../components/MapPreview'

export default function AuditInterface() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const audioRef = useRef(null)

    // Data States
    const [record, setRecord] = useState(null)
    const [questions, setQuestions] = useState([])
    const [answers, setAnswers] = useState({}) // { questionId: optionId }

    // UI States
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [playbackRate, setPlaybackRate] = useState(1)
    const [isPlaying, setIsPlaying] = useState(false)
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        if (user) loadNextAudit()
    }, [user])

    async function loadNextAudit() {
        try {
            setLoading(true)
            setAnswers({})

            // 1. Fetch one pending record assigned to this auditor
            const { data: records, error: recError } = await supabase
                .from('audit_data')
                .select('*')
                .eq('assigned_to', user.id)
                .eq('status', 'pending')
                .order('created_at', { ascending: true })
                .limit(1)

            if (recError) throw recError
            if (!records || records.length === 0) {
                setRecord(null)
                setLoading(false)
                return
            }

            const currentRecord = records[0]
            setRecord(currentRecord)

            // 2. Fetch questions (Common or Campaign-specific for this record)
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

            // 1. Insert responses
            const responseEntries = Object.entries(answers).map(([qId, oId]) => ({
                audit_data_id: record.id,
                question_id: qId,
                answer_option_id: oId,
                auditor_id: user.id
            }))

            const { error: respError } = await supabase
                .from('audit_responses')
                .insert(responseEntries)

            if (respError) throw respError

            // 2. Update record status
            const { error: updateError } = await supabase
                .from('audit_data')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString()
                })
                .eq('id', record.id)

            if (updateError) throw updateError

            // 3. Load next
            loadNextAudit()

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
        <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 400px', gap: '30px', alignItems: 'start' }}>

            {/* Left Column: Data & Audio */}
            <div>
                <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Contact Preview</h2>
                        <span style={{ fontSize: '12px', color: '#718096', fontWeight: '600' }}>ID: {record.contact_id}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '14px' }}>
                        <div style={infoBoxStyle}><label style={labelStyle}>Campaign</label>{record.campaign_name}</div>
                        <div style={infoBoxStyle}><label style={labelStyle}>Date</label>{record.contact_date}</div>
                        <div style={infoBoxStyle}><label style={labelStyle}>Duration</label>{record.duration}</div>
                        <div style={infoBoxStyle}><label style={labelStyle}>Outlet</label>{record.outlet_name || 'N/A'}</div>
                    </div>

                    <hr style={{ margin: '25px 0', border: 'none', borderTop: '1px solid #edf2f7' }} />

                    {/* Audio Player UI */}
                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <button onClick={togglePlay} style={playButtonStyle}>
                                {isPlaying ? '⏸' : '▶'}
                            </button>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '12px', color: '#4a5568', fontWeight: 'bold', marginBottom: '5px' }}>Audio Playback</div>
                                <audio
                                    ref={audioRef}
                                    src={record.audio_link}
                                    onEnded={() => setIsPlaying(false)}
                                    style={{ width: '100%', height: '32px' }}
                                    controls
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                            <button onClick={() => skip(-10)} style={smallButtonStyle}>-10s</button>
                            <button onClick={() => skip(10)} style={smallButtonStyle}>+10s</button>
                            <button onClick={handleSpeed} style={{ ...smallButtonStyle, marginLeft: 'auto', background: playbackRate > 1 ? '#4f46e5' : '#e2e8f0', color: playbackRate > 1 ? 'white' : '#4a5568' }}>
                                {playbackRate}x Speed
                            </button>
                        </div>
                    </div>
                </div>

                {/* Location Map */}
                <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px' }}>Location Verification</h3>
                    <div style={{ height: '300px', borderRadius: '8px', overflow: 'hidden', background: '#e2e8f0' }}>
                        {record.contact_location ? (() => {
                            const [lat, lng] = record.contact_location.split(',').map(s => parseFloat(s.trim()))
                            return <MapPreview lat={lat} lng={lng} />
                        })() : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#718096' }}>No Location Data</div>}
                    </div>
                </div>
            </div>

            {/* Right Column: Questions */}
            <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', position: 'sticky', top: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1a202c', marginBottom: '20px', borderBottom: '2px solid #ebf4ff', paddingBottom: '10px' }}>
                    Audit Checklist
                </h3>

                <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
                    {questions.map((q, idx) => (
                        <div key={q.id} style={{ marginBottom: '25px' }}>
                            <p style={{ fontSize: '14px', fontWeight: '600', color: '#2d3748', marginBottom: '10px', lineHeight: '1.4' }}>
                                {idx + 1}. {q.question_text}
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {q.answer_options.map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => handleOptionSelect(q.id, opt.id)}
                                        style={{
                                            padding: '8px 12px',
                                            fontSize: '12px',
                                            borderRadius: '6px',
                                            border: '1px solid',
                                            borderColor: answers[q.id] === opt.id ? '#4f46e5' : '#e2e8f0',
                                            background: answers[q.id] === opt.id ? '#ebf4ff' : 'white',
                                            color: answers[q.id] === opt.id ? '#4f46e5' : '#718096',
                                            fontWeight: answers[q.id] === opt.id ? '700' : '500',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
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
                        padding: '14px',
                        marginTop: '10px',
                        background: (submitting || Object.keys(answers).length < questions.length) ? '#e2e8f0' : '#48bb78',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '15px',
                        cursor: (submitting || Object.keys(answers).length < questions.length) ? 'not-allowed' : 'pointer',
                        boxShadow: '0 10px 15px -3px rgba(72, 187, 120, 0.2)'
                    }}
                >
                    {submitting ? 'Submitting...' : 'Complete & Next ➔'}
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
