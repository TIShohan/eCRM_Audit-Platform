import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import QuestionForm from '../../components/admin/QuestionForm'

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
        <div style={{ width: '100%', paddingBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1a202c' }}>
                    Question Management
                </h1>
                <button
                    onClick={() => { setEditingQuestion(null); setIsFormOpen(true); }}
                    style={{
                        padding: '10px 20px',
                        background: '#4f46e5',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)'
                    }}
                >
                    + Add New Question
                </button>
            </div>

            {isFormOpen && (
                <QuestionForm
                    type={activeTab}
                    question={editingQuestion}
                    onClose={() => setIsFormOpen(false)}
                    onSuccess={handleFormSuccess}
                />
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '2px', marginBottom: '25px', background: '#e2e8f0', padding: '4px', borderRadius: '8px', width: 'fit-content' }}>
                <TabButton
                    active={activeTab === 'common'}
                    onClick={() => setActiveTab('common')}
                    label="Common Questions"
                />
                <TabButton
                    active={activeTab === 'campaign'}
                    onClick={() => setActiveTab('campaign')}
                    label="Campaign Specific"
                />
            </div>

            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                            <th style={thStyle}>Order</th>
                            <th style={thStyle}>Question Text</th>
                            {activeTab === 'campaign' && <th style={thStyle}>Campaign ID</th>}
                            <th style={thStyle}>Options</th>
                            <th style={thStyle}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#a0aec0' }}>Loading questions...</td></tr>
                        ) : questions.length === 0 ? (
                            <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#a0aec0' }}>No {activeTab} questions found.</td></tr>
                        ) : questions.map((q) => (
                            <tr key={q.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                                <td style={tdStyle}>{q.order_index}</td>
                                <td style={tdStyle}>
                                    <div style={{ fontWeight: '600', color: '#2d3748', maxWidth: '400px' }}>{q.question_text}</div>
                                </td>
                                {activeTab === 'campaign' && (
                                    <td style={tdStyle}>
                                        <span style={{ padding: '2px 8px', background: '#edf2f7', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                                            {q.campaign_id}
                                        </span>
                                    </td>
                                )}
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                        {q.answer_options?.sort((a, b) => a.order_index - b.order_index).map(opt => (
                                            <span key={opt.id} style={{ fontSize: '11px', padding: '2px 6px', background: '#f0fff4', color: '#2f855a', border: '1px solid #c6f6d5', borderRadius: '4px' }}>
                                                {opt.option_text}
                                            </span>
                                        )) || 'None'}
                                    </div>
                                </td>
                                <td style={tdStyle}>
                                    <button
                                        onClick={() => { setEditingQuestion(q); setIsFormOpen(true); }}
                                        style={{ color: '#4f46e5', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '600', marginRight: '15px' }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(q.id)}
                                        style={{ color: '#e53e3e', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '600' }}
                                    >
                                        Delete
                                    </button>
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
                padding: '8px 20px',
                borderRadius: '6px',
                border: 'none',
                background: active ? 'white' : 'transparent',
                color: active ? '#1a202c' : '#718096',
                fontWeight: active ? '700' : '500',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s'
            }}
        >
            {label}
        </button>
    )
}

const thStyle = { padding: '15px 20px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }
const tdStyle = { padding: '15px 20px', verticalAlign: 'middle', fontSize: '14px' }
