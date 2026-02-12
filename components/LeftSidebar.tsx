'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface LeftSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LeftSidebar({ isOpen, onClose }: LeftSidebarProps) {
    // Mobile behavior might differ, but for now we follow desktop instruction
    // "Hamburger opens a sidebar more"

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            backgroundColor: '#000',
                            zIndex: 1400,
                        }}
                    />

                    {/* Sidebar */}
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            bottom: 0,
                            width: '280px',
                            backgroundColor: 'var(--bg-primary)',
                            zIndex: 1500,
                            boxShadow: 'var(--shadow-lg)',
                            padding: '1rem',
                            borderRight: '1px solid var(--border-color)',
                        }}
                    >
                        <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Menú</h2>
                        </div>

                        <div style={{ color: 'var(--text-secondary)' }}>
                            <p>Pronto disponible...</p>
                            {/* Placeholder content */}
                            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ height: '40px', background: 'var(--bg-secondary)', borderRadius: '8px' }} />
                                <div style={{ height: '40px', background: 'var(--bg-secondary)', borderRadius: '8px' }} />
                                <div style={{ height: '40px', background: 'var(--bg-secondary)', borderRadius: '8px' }} />
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
