'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function ErrorCard({ message }: { message: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                marginBottom: '12px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
            }}
        >
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <div>
                <div style={{ fontWeight: 600, marginBottom: '2px' }}>Algo salió mal</div>
                <div style={{ opacity: 0.9 }}>{message}</div>
            </div>
        </motion.div>
    );
}
