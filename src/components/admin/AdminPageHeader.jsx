import React from 'react'

export default function AdminPageHeader({ title, subtitle, action }) {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: '40px',
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: '24px'
        }}>
            <div>
                <h1 style={{
                    fontSize: '32px',
                    fontWeight: '800',
                    color: '#0f172a',
                    letterSpacing: '-0.02em',
                    lineHeight: '1.2',
                    marginBottom: '8px'
                }}>
                    {title}
                </h1>
                {subtitle && (
                    <p style={{
                        fontSize: '15px',
                        color: '#64748b',
                        fontWeight: '500'
                    }}>
                        {subtitle}
                    </p>
                )}
            </div>
            {action && (
                <div>
                    {action}
                </div>
            )}
        </div>
    )
}
