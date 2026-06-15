'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/events';

export default function SessionTracker() {
  useEffect(() => {
    trackEvent('session.start', { entityType: 'session' });
  }, []);
  return null;
}
