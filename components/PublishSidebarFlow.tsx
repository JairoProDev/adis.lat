'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const PublishChatWizard = dynamic(() => import('@/components/publish/PublishChatWizard'), {
  ssr: false,
});

export default function PublishSidebarFlow({
  onNotify,
}: {
  onNotify?: (msg: string, type?: 'info' | 'error' | 'success') => void;
}) {
  return (
    <div className="flex flex-col h-full min-h-0 px-1 pb-1">
      <PublishChatWizard compact onNotify={onNotify} />
    </div>
  );
}
