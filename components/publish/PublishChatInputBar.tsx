'use client';

import { useRef } from 'react';
import PublishChatInput from './PublishChatInput';
import PublishImagePreview from './PublishImagePreview';

interface PublishChatInputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  compact?: boolean;
  disabled?: boolean;
  sending?: boolean;
  placeholder?: string;
  onPublishImage?: (file: File) => void;
  publishImageUrl?: string | null;
  publishImageUploading?: boolean;
  onRemoveImage?: () => void;
}

export default function PublishChatInputBar({
  value,
  onChange,
  onSend,
  compact = false,
  disabled = false,
  sending = false,
  placeholder = 'Escribe tu mensaje…',
  onPublishImage,
  publishImageUrl,
  publishImageUploading = false,
  onRemoveImage,
}: PublishChatInputBarProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={`shrink-0 bg-[var(--bg-secondary)] ${compact ? 'px-2.5 pb-2.5 pt-2' : 'px-4 pb-4 pt-3'}`}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && onPublishImage) onPublishImage(file);
          e.target.value = '';
        }}
      />
      {publishImageUrl && onRemoveImage && (
        <div className="mb-2 flex items-center gap-2 px-0.5">
          <PublishImagePreview url={publishImageUrl} onRemove={onRemoveImage} size="sm" />
          <span className="text-[10px] text-[var(--text-tertiary)]">Foto adjunta</span>
        </div>
      )}
      <PublishChatInput
        value={value}
        onChange={onChange}
        onSend={onSend}
        compact={compact}
        disabled={disabled}
        sending={sending}
        placeholder={placeholder}
        onAttachImage={onPublishImage ? () => fileRef.current?.click() : undefined}
        imageAttached={Boolean(publishImageUrl)}
        imageUploading={publishImageUploading}
      />
    </div>
  );
}
