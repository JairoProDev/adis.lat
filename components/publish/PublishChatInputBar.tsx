'use client';

import Buscador from '@/components/Buscador';
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

/** Input inferior del chat — mismo shell que el buscador principal */
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
  const hasText = value.trim().length > 0;

  return (
    <div
      className={`shrink-0 border-t border-black/[0.06] bg-[var(--bg-secondary)]/80 backdrop-blur-sm ${
        compact ? 'px-2 py-2' : 'px-3 py-3'
      }`}
    >
      {publishImageUrl && onRemoveImage && (
        <div className="mb-2 flex items-center gap-2 px-0.5">
          <PublishImagePreview url={publishImageUrl} onRemove={onRemoveImage} size="sm" />
          <span className="text-[10px] text-[var(--text-tertiary)]">Foto adjunta</span>
        </div>
      )}
      <Buscador
        value={value}
        onChange={onChange}
        compact={compact}
        flat={false}
        composerMode="publish"
        placeholder={placeholder}
        onPrimaryAction={onSend}
        primaryActionDisabled={disabled || !hasText}
        primaryActionLoading={sending}
        primaryActionLabel={sending ? '…' : compact ? 'Enviar' : 'Enviar'}
        primaryIconOnly={compact}
        onPublishImageSelected={onPublishImage}
        publishImageAttached={Boolean(publishImageUrl)}
        publishImageUploading={publishImageUploading}
      />
    </div>
  );
}
