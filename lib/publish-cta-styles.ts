/** CTA Publicar: fondo amarillo + icono y label celeste. */
export const publishCta = {
  iconColor: 'var(--brand-blue)',
  labelColor: 'var(--brand-blue)',
  background: 'linear-gradient(145deg, #ffd76a 0%, var(--brand-yellow) 50%, #ffb830 100%)',
  backgroundActive:
    'linear-gradient(145deg, #ffcf5c 0%, var(--brand-yellow) 55%, #f5b020 100%)',
  shadow: '0 6px 18px rgba(var(--brand-yellow-rgb), 0.45)',
  shadowActive:
    '0 6px 20px rgba(var(--brand-yellow-rgb), 0.55), 0 0 0 3px rgba(var(--brand-primary-rgb), 0.25)',
} as const;
