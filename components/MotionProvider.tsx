'use client';

import { MotionConfig } from 'framer-motion';
import { ReactNode } from 'react';

/**
 * Motion Provider - Physics-based Animation Configuration
 * Standardizes spring animations across the application
 * Type: Spring with optimal stiffness and damping for premium feel
 */
export default function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
        mass: 1,
      }}
    >
      {children}
    </MotionConfig>
  );
}
