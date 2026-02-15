/**
 * Componente Wrapper para Elementos Editables
 * Muestra un lapicito en la esquina superior derecha cuando está en modo edición
 */

'use client';

import { useState, ReactNode } from 'react';
import { IconEdit } from '@/components/Icons';

interface EditableElementProps {
    children: ReactNode;
    editMode: boolean;
    onEdit: () => void;
    className?: string;
}

export default function EditableElement({ children, editMode, onEdit, className = '' }: EditableElementProps) {
    const [isHovered, setIsHovered] = useState(false);

    if (!editMode) {
        return <div className={className}>{children}</div>;
    }

    return (
        <div
            className={`${className} relative group`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {children}

            {/* Lapicito flotante */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                }}
                className={`
                    absolute top-2 right-2 
                    w-8 h-8 rounded-full 
                    flex items-center justify-center
                    transition-all duration-200
                    shadow-lg
                    ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}
                `}
                style={{
                    backgroundColor: 'var(--brand-blue)',
                    zIndex: 10
                }}
            >
                <IconEdit size={14} color="white" />
            </button>
        </div>
    );
}
