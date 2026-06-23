'use client';

import { cn } from '@/lib/utils';

interface QrPreviewProps {
  slug: string;
  businessName: string;
  format?: 'png' | 'svg';
  tier?: 'free' | 'pro';
  className?: string;
  size?: number;
}

export default function QrPreview({
  slug,
  businessName,
  format = 'png',
  tier = 'free',
  className,
  size = 200,
}: QrPreviewProps) {
  const encoded = encodeURIComponent(slug);
  const src = `/api/business/${encoded}/qr?format=${format}&tier=${tier}&t=${Date.now()}`;

  return (
    <div
      className={cn(
        'relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm',
        className
      )}
    >
      <img
        src={src}
        alt={`QR de ${businessName}`}
        width={size}
        height={size}
        className="mx-auto rounded-xl"
        style={{ width: size, height: size }}
      />
    </div>
  );
}
