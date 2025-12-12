'use client';

import React, { useState, useEffect } from 'react';
import ChatbotIANew from './ChatbotIANew';
import { AnimatePresence, motion } from 'framer-motion';

export default function FloatingChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const [hasHistory, setHasHistory] = useState(false);

    // Load open state preference and check history
    useEffect(() => {
        const savedState = localStorage.getItem('adis_chat_open');
        // Default to open if no state saved (first visit) or if explicitly true
        if (savedState === 'true' || savedState === null) setIsOpen(true);

        const history = localStorage.getItem('adis_chat_history');
        if (history && history !== '[]') {
            setHasHistory(true);
        }
    }, []);

    const toggleChat = () => {
        const newState = !isOpen;
        setIsOpen(newState);
        localStorage.setItem('adis_chat_open', String(newState));
        if (newState) setHasUnread(false);
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            position: 'fixed',
                            bottom: '90px',
                            right: '20px',
                            width: '380px',
                            height: '600px',
                            maxHeight: 'calc(100vh - 110px)',
                            maxWidth: 'calc(100vw - 40px)',
                            backgroundColor: 'white',
                            borderRadius: '20px',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                            zIndex: 9999,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            border: '1px solid rgba(0,0,0,0.05)'
                        }}
                    >
                        {/* Close Header for Mobile */}
                        <div className="md:hidden" style={{ position: 'absolute', top: 10, right: 10, zIndex: 100 }}>
                            <button onClick={toggleChat} style={{ background: 'rgba(0,0,0,0.1)', border: 'none', borderRadius: '50%', width: 30, height: 30 }}>✕</button>
                        </div>

                        <ChatbotIANew onMinimize={() => {
                            setIsOpen(false);
                            localStorage.setItem('adis_chat_open', 'false');
                            setHasHistory(true); // Ensure history indicator is on
                        }} />
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                onClick={toggleChat}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    width: '60px',
                    height: '60px',
                    borderRadius: '30px',
                    backgroundColor: '#6366f1',
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    color: 'white',
                    border: 'none',
                    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                    zIndex: 10000,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px'
                }}
            >
                {isOpen ? '✕' : (hasHistory ? '💬' : '✨')}

                {/* Unread indicator pulse */}
                {!isOpen && hasUnread && (
                    <span style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '15px',
                        height: '15px',
                        backgroundColor: '#ef4444',
                        borderRadius: '50%',
                        border: '2px solid white'
                    }} />
                )}
            </motion.button>
        </>
    );
}
