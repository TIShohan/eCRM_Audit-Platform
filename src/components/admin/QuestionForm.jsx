import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function QuestionForm({ question, type, onClose, onSuccess }) {
    const [text, setText] = useState(question?.question_text || '')
    const [orderIndex, setOrderIndex] = useState(question?.order_index || 0)
    const [campaignId, setCampaignId] = useState(question?.campaign_id || '')
    const [options, setOptions] = useState(question?.answer_options?.sort((a, b) => a.order_index - b.order_index) || [])
    const [newOption, setNewOption] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleAddOption = () => {
        if (!newOption.trim()) return
        setOptions([...options, {
            id: Math.random(), // Temporary ID for UI tracking
            option_text: newOption.trim(),
            order_index: options.length + 1,
            isNew: true
        }])
        setNewOption('')
    }

    const handleRemoveOption = (id) => {
        setOptions(options.filter(o => o.id !== id))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (options.length === 0) {
            setError('Please add at least one answer option.')
            return
        }

        setLoading(true)
        setError('')

        try {
            // 1. Upsert Question
            const questionData = {
                question_text: text,
                question_type: type,
                order_index: parseInt(orderIndex),
                campaign_id: type === 'campaign' ? campaignId : null
            }

            let questionId = question?.id

            if (questionId) {
                const { error: qError } = await supabase
                    .from('questions')
                    .update(questionData)
                    .eq('id', questionId)
                if (qError) throw qError
            } else {
                const { data: newQ, error: qError } = await supabase
                    .from('questions')
                    .insert(questionData)
                    .select()
                    .single()
                if (qError) throw qError
                questionId = newQ.id
            }

            // 2. Clear old options if editing
            if (question?.id) {
                await supabase.from('answer_options').delete().eq('question_id', questionId)
            }

            // 3. Batch insert all current options
            const optionsToInsert = options.map((opt, idx) => ({
                question_id: questionId,
                option_text: opt.option_text,
                order_index: idx + 1
            }))

            const { error: optError } = await supabase
                .from('answer_options')
                .insert(optionsToInsert)

            if (optError) throw optError

            onSuccess()
        } catch (err) {
            console.error('Save error:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={overlayStyle} className="fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div style={modalStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                            {question ? 'Edit Logic' : 'New Audit Question'}
                        </h2>
                        <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                            {type === 'common' ? '🌍 Common across all campaigns' : '🎯 Campaign specific metric'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="interactive-btn"
                        style={{ border: 'none', background: '#f1f5f9', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={formGroupStyle}>
                        <label style={labelStyle}>Question Narrative</label>
                        <textarea
                            required
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="e.g. Did the agent follow the standard greeting?"
                            style={{ ...inputStyle, height: '80px', resize: 'none' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                        <div>
                            <label style={labelStyle}>Sort Order</label>
                            <input
                                type="number"
                                value={orderIndex}
                                onChange={(e) => setOrderIndex(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                        {type === 'campaign' && (
                            <div>
                                <label style={labelStyle}>Target Campaign ID</label>
                                <input
                                    required
                                    value={campaignId}
                                    onChange={(e) => setCampaignId(e.target.value)}
                                    placeholder="Ex: 102"
                                    style={inputStyle}
                                />
                            </div>
                        )}
                    </div>

                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                        <label style={labelStyle}>Response Options</label>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                            <input
                                value={newOption}
                                onChange={(e) => setNewOption(e.target.value)}
                                placeholder="Add option (e.g. Pass)"
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOption())}
                                style={{ ...inputStyle, background: 'white' }}
                            />
                            <button
                                type="button"
                                onClick={handleAddOption}
                                className="interactive-btn"
                                style={{ padding: '0 20px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}
                            >
                                Add
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {options.map((opt) => (
                                <div key={opt.id} style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', color: '#334155' }}>
                                    {opt.option_text}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveOption(opt.id)}
                                        style={{ marginLeft: '8px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: '800', fontSize: '14px', padding: 0 }}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            {options.length === 0 && <span style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>No options defined yet.</span>}
                        </div>
                    </div>

                    {error && (
                        <div style={{ color: '#ef4444', fontSize: '12px', marginBottom: '16px', background: '#fef2f2', padding: '10px', borderRadius: '8px', border: '1px solid #fee2e2', fontWeight: '600' }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            className="interactive-btn"
                            style={{ flex: 1, padding: '12px', background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '14px' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="interactive-btn"
                            style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)' }}
                        >
                            {loading ? 'Saving...' : 'Save Question'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3000,
    pointerEvents: 'none'
}

const modalStyle = {
    background: 'white',
    padding: '32px',
    borderRadius: '24px',
    width: '100%',
    maxWidth: '560px',
    boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
    pointerEvents: 'auto'
}

const formGroupStyle = { marginBottom: '20px' }

const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: '800',
    color: '#64748b',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
}

const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#0f172a',
    background: '#f8fafc',
    outline: 'none',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
}
