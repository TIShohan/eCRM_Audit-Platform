import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import QuestionForm from '../../components/admin/QuestionForm'
import AdminPageHeader from '../../components/admin/AdminPageHeader'

export default function QuestionManagement() {
    const [activeTab, setActiveTab] = useState('common')
    const [questions, setQuestions] = useState([])
    const [loading, setLoading] = useState(true)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingQuestion, setEditingQuestion] = useState(null)

    useEffect(() => {
        fetchQuestions()
    }, [activeTab])

    async function fetchQuestions() {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('questions')
                .select(`
          *,
          answer_options (*)
        `)
                .eq('question_type', activeTab)
                .order('order_index', { ascending: true })

            if (error) throw error
            setQuestions(data || [])
        } catch (err) {
            console.error('Error fetching questions:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this question? This will remove all associated responses.')) return

        try {
            const { error } = await supabase.from('questions').delete().eq('id', id)
            if (error) throw error
            fetchQuestions()
        } catch (err) {
            alert('Delete failed: ' + err.message)
        }
    }

    const handleFormSuccess = () => {
        setIsFormOpen(false)
        setEditingQuestion(null)
        fetchQuestions()
    }

    return (
        <div className="fade-in">
            <AdminPageHeader
                title="Question Bank"
                subtitle="Configure audit forms with global common metrics or campaign-specific logic."
                action={
                    <button
                        className="interactive-btn"
                        style={{
                            padding: '12px 24px',
                            background: '#4f46e5',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: '700',
                            fontSize: '14px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                        }}
                        onClick={() => { setEditingQuestion(null); setIsFormOpen(true); }}
                    >
                        ＋ Add New Question
                    </button>
                }
            />

            {isFormOpen && (
                <QuestionForm
                    type={activeTab}
                    question={editingQuestion}
                    onClose={() => setIsFormOpen(false)}
                    onSuccess={handleFormSuccess}
                />
            )}

            {/* Tabs */}
            <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '32px',
                padding: '6px',
                background: '#f1f5f9',
                borderRadius: '14px',
                width: 'fit-content',
                border: '1px solid #e2e8f0'
            }}>
                <TabButton
                    active={activeTab === 'common'}
                    onClick={() => setActiveTab('common')}
                    label="🌍 Common Metrics"
                />
                <TabButton
                    active={activeTab === 'campaign'}
                    onClick={() => setActiveTab('campaign')}
                    label="🎯 Campaign Specific"
                />
            </div>

            <div style={{
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                overflow: 'hidden',
                border: '1px solid #e2e8f0'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                            <th style={thStyle}>Pos</th>
                            <th style={thStyle}>Question Narrative</th>
                            {activeTab === 'campaign' && <th style={thStyle}>Target ID</th>}
                            <th style={thStyle}>Validated Options</th>
                            <th style={thStyle}>Management</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Refreshing logic bank...</td></tr>
                        ) : questions.length === 0 ? (
                            <tr><td colSpan="5" style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>No {activeTab} questions defined yet.</td></tr>
                        ) : questions.map((q) => (
                            <tr key={q.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                                <td style={{ ...tdStyle, fontWeight: '700', color: '#64748b' }}>#{q.order_index}</td>
                                <td style={tdStyle}>
                                    <div style={{ fontWeight: '700', color: '#0f172a', maxWidth: '400px', lineHeight: '1.4' }}>{q.question_text}</div>
                                </td>
                                {activeTab === 'campaign' && (
                                    <td style={tdStyle}>
                                        <span style={{ padding: '4px 10px', background: '#eff6ff', color: '#1d4ed8', borderRadius: '20px', fontSize: '11px', fontWeight: '800', border: '1px solid #dbeafe' }}>
                                            {q.campaign_id}
                                        </span>
                                    </td>
                                )}
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        {q.answer_options?.sort((a, b) => a.order_index - b.order_index).map(opt => (
                                            <span key={opt.id} style={{ fontSize: '11px', padding: '4px 10px', background: '#f0fdf4', color: '#15803d', border: '1px solid #dcfce7', borderRadius: '20px', fontWeight: '700' }}>
                                                {opt.option_text}
                                            </span>
                                        )) || <em style={{ color: '#94a3b8' }}>No options</em>}
                                    </div>
                                </td>
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            className="interactive-btn"
                                            onClick={() => { setEditingQuestion(q); setIsFormOpen(true); }}
                                            style={{ color: '#4f46e5', border: '1px solid #e2e8f0', background: 'white', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="interactive-btn"
                                            onClick={() => handleDelete(q.id)}
                                            style={{ color: '#ef4444', border: '1px solid #fee2e2', background: '#fef2f2', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function TabButton({ active, onClick, label }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '10px 24px',
                borderRadius: '10px',
                border: 'none',
                background: active ? 'white' : 'transparent',
                color: active ? '#0f172a' : '#64748b',
                fontWeight: active ? '800' : '600',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: active ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
        >
            {label}
        </button>
    )
}

const thStyle = {
    padding: '16px 20px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
}

const tdStyle = {
    padding: '16px 20px',
    verticalAlign: 'middle',
    fontSize: '14px',
    color: '#334155'
}
