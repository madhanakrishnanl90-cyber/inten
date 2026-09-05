import React from 'react';

export default function LoadingFallback({ message = 'Loading...' }) {
  return (
    <div style={{
      minHeight: '50vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      padding: '40px',
      color: '#64748b',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid #e2e8f0',
        borderTopColor: '#2563eb',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <span style={{ fontSize: '0.88rem', fontWeight: 500, letterSpacing: '0.01em' }}>
        {message}
      </span>
    </div>
  );
}
