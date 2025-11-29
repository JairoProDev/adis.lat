'use client';

import { useEffect, useState } from 'react';
import { FaCheck, FaTimes, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Esperar animación
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: FaCheck,
    error: FaTimes,
    warning: FaExclamationTriangle,
    info: FaInfoCircle,
  };

  const colors = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  };

  const Icon = icons[type];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        backgroundColor: 'var(--bg-primary)',
        border: `2px solid ${colors[type]}`,
        borderRadius: '8px',
        padding: '1rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 3000,
        maxWidth: '400px',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.3s ease',
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      <Icon size={20} color={colors[type]} />
      <span style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>
        {message}
      </span>
    </div>
  );
}

