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

            // 2. Clear old options if editing (Simple approach for now)
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
        <div style={overlayStyle}>
            <div style={modalStyle}>
                <h2 style={{ marginBottom: '20px' }}>{question ? 'Edit' : 'Add'} {type === 'common' ? 'Common' : 'Campaign'} Question</h2>

                <form onSubmit={handleSubmit}>
                    <div style={formGroupStyle}>
                        <label style={labelStyle}>Question Text</label>
                        <textarea
                            required
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="e.g. Is the customer information correct?"
                            style={{ ...inputStyle, height: '80px', resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Order Index</label>
                            <input
                                type="number"
                                value={orderIndex}
                                onChange={(e) => setOrderIndex(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                        {type === 'campaign' && (
                            <div style={{ flex: 2 }}>
                                <label style={labelStyle}>Campaign ID</label>
                                <input
                                    required
                                    value={campaignId}
                                    onChange={(e) => setCampaignId(e.target.value)}
                                    placeholder="e.g. 985"
                                    style={inputStyle}
                                />
                            </div>
                        )}
                    </div>

                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '15px', marginBottom: '20px' }}>
                        <label style={labelStyle}>Answer Options</label>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                            <input
                                value={newOption}
                                onChange={(e) => setNewOption(e.target.value)}
                                placeholder="Add option (e.g. Yes)"
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOption())}
                                style={inputStyle}
                            />
                            <button
                                type="button"
                                onClick={handleAddOption}
                                style={{ padding: '0 15px', background: '#2d3748', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                Add
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {options.map((opt) => (
                                <div key={opt.id} style={{ display: 'flex', alignItems: 'center', background: '#f7fafc', border: '1px solid #cbd5e0', padding: '4px 10px', borderRadius: '4px', fontSize: '13px' }}>
                                    {opt.option_text}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveOption(opt.id)}
                                        style={{ marginLeft: '8px', background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            {options.length === 0 && <span style={{ color: '#a0aec0', fontSize: '12px' }}>No options added yet.</span>}
                        </div>
                    </div>

                    {error && <div style={{ color: '#e53e3e', fontSize: '13px', marginBottom: '15px', background: '#fff5f5', padding: '8px', borderRadius: '4px' }}>{error}</div>}

                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{ flex: 1, padding: '10px', background: '#edf2f7', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{ flex: 1, padding: '10px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                        >
                            {loading ? 'Saving...' : 'Save Question'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }
const modalStyle = { background: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }
const formGroupStyle = { marginBottom: '15px' }
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '600', color: '#4a5568', marginBottom: '5px' }
const inputStyle = { width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '4px', fontSize: '14px', outline: 'none' }
