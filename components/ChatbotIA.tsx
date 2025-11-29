'use client';

import React from 'react';

export default function ChatbotIA() {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        color: 'var(--text-secondary)',
        textAlign: 'center'
      }}
    >
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤖</div>
      <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
        Chatbot con IA
      </div>
      <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', maxWidth: '300px' }}>
        Próximamente: Busca avisos conversando con nuestra IA
      </div>
    </div>
  );
}

