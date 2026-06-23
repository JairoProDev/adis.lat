import type { SVGProps } from 'react';

/** Ícono QR minimalista: tres marcas de posición, sin ruido visual */
export default function QrMinimalIcon({
  size = 20,
  className,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      {...props}
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
      <rect x="5.25" y="5.25" width="2.5" height="2.5" rx="0.5" fill="currentColor" />
      <rect x="16.25" y="5.25" width="2.5" height="2.5" rx="0.5" fill="currentColor" />
      <rect x="5.25" y="16.25" width="2.5" height="2.5" rx="0.5" fill="currentColor" />
      <rect x="13" y="13" width="2" height="2" rx="0.25" fill="currentColor" opacity="0.85" />
      <rect x="16.5" y="13" width="2" height="2" rx="0.25" fill="currentColor" opacity="0.85" />
      <rect x="19" y="16" width="2" height="2" rx="0.25" fill="currentColor" opacity="0.85" />
    </svg>
  );
}
