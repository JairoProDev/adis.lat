import React from 'react';
import { IconShield, IconUserCheck } from '../Icons';

interface TrustBadgeProps {
    type: 'verified' | 'business' | 'identity';
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
}

export default function TrustBadge({ type, size = 'md', showLabel = true }: TrustBadgeProps) {
    const getBadgeConfig = () => {
        switch (type) {
            case 'verified':
                return {
                    icon: IconUserCheck,
                    color: '#3B82F6', // Blue
                    label: 'Verificado',
                    bgColor: '#EFF6FF',
                    borderColor: '#BFDBFE'
                };
            case 'business':
                return {
                    icon: IconShield,
                    color: '#8B5CF6', // Purple
                    label: 'Empresa',
                    bgColor: '#F5F3FF',
                    borderColor: '#DDD6FE'
                };
            case 'identity':
                return {
                    icon: IconShield,
                    color: '#10B981', // Green
                    label: 'Identidad',
                    bgColor: '#ECFDF5',
                    borderColor: '#A7F3D0'
                };
        }
    };

    const config = getBadgeConfig();
    const Icon = config.icon;

    const sizeConfig = {
        sm: { icon: 12, padding: '2px 6px', fontSize: '0.625rem' },
        md: { icon: 14, padding: '4px 8px', fontSize: '0.75rem' },
        lg: { icon: 18, padding: '6px 12px', fontSize: '0.875rem' }
    };

    const s = sizeConfig[size];

    return (
        <div
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: s.padding,
                backgroundColor: config.bgColor,
                border: `1px solid ${config.borderColor}`,
                borderRadius: '100px',
                color: config.color,
                fontSize: s.fontSize,
                fontWeight: 600,
                userSelect: 'none',
                cursor: 'help'
            }}
            title={`Usuario con verificación de ${config.label}`}
        >
            <Icon size={s.icon} />
            {showLabel && <span>{config.label}</span>}
        </div>
    );
}
