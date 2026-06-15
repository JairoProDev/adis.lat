'use client';

import { createPortal } from 'react-dom';
import StoryUploadWizard from './stories/StoryUploadWizard';

interface StoryUploadModalProps {
  onClose: () => void;
  onPublished: () => void;
}

export default function StoryUploadModal({ onClose, onPublished }: StoryUploadModalProps) {
  return createPortal(
    <div
      className="fixed inset-0 z-[10002] bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <StoryUploadWizard onClose={onClose} onPublished={onPublished} />
    </div>,
    document.body
  );
}
