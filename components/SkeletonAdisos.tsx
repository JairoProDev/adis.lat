'use client';

/**
 * SkeletonAdisos - Professional skeleton UI that mirrors the real card layout.
 * Uses a CSS shimmer animation defined globally in globals.css via the
 * `.skeleton-shimmer` class. This component relies on CSS variables for
 * seamless light/dark mode support.
 */

// Single card skeleton - matches AdisoCard layout 1:1
function SkeletonCard() {
  return (
    <div
      className="skeleton-card"
      style={{
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Image placeholder — aspect ratio 4/3 matching the card */}
      <div
        className="skeleton-shimmer"
        style={{
          width: '100%',
          aspectRatio: '4/3',
          backgroundColor: 'var(--bg-tertiary)',
        }}
      />

      {/* Content area */}
      <div style={{ padding: '0.625rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {/* Title line (70%) */}
        <div
          className="skeleton-shimmer"
          style={{
            height: '13px',
            width: '72%',
            borderRadius: '6px',
            backgroundColor: 'var(--bg-tertiary)',
          }}
        />

        {/* Description line 1 (100%) */}
        <div
          className="skeleton-shimmer"
          style={{
            height: '11px',
            width: '100%',
            borderRadius: '6px',
            backgroundColor: 'var(--bg-tertiary)',
          }}
        />

        {/* Description line 2 (85%) */}
        <div
          className="skeleton-shimmer"
          style={{
            height: '11px',
            width: '85%',
            borderRadius: '6px',
            backgroundColor: 'var(--bg-tertiary)',
          }}
        />

        {/* Footer: price + stats */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
          <div
            className="skeleton-shimmer"
            style={{
              height: '10px',
              width: '36%',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-tertiary)',
            }}
          />
          <div
            className="skeleton-shimmer"
            style={{
              height: '10px',
              width: '28%',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-tertiary)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Toolbar skeleton — mirrors the count + sort + view-toggle row
export function SkeletonToolbar() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.75rem',
        padding: '0.25rem 0',
        gap: '8px',
      }}
    >
      {/* Left: count pill */}
      <div
        className="skeleton-shimmer"
        style={{
          height: '20px',
          width: '120px',
          borderRadius: '6px',
          backgroundColor: 'var(--bg-tertiary)',
        }}
      />

      {/* Right: sort + view toggles */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <div
          className="skeleton-shimmer"
          style={{
            height: '32px',
            width: '110px',
            borderRadius: '6px',
            backgroundColor: 'var(--bg-tertiary)',
          }}
        />
        <div
          className="skeleton-shimmer"
          style={{
            height: '32px',
            width: '96px',
            borderRadius: '6px',
            backgroundColor: 'var(--bg-tertiary)',
          }}
        />
      </div>
    </div>
  );
}

interface SkeletonAdisosProps {
  count?: number;
  isDesktop?: boolean;
  showToolbar?: boolean;
}

export default function SkeletonAdisos({ count, isDesktop, showToolbar = false }: SkeletonAdisosProps) {
  const cardCount = count ?? (isDesktop ? 8 : 6);

  return (
    <>
      {showToolbar && <SkeletonToolbar />}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isDesktop
            ? 'repeat(auto-fill, minmax(250px, 1fr))'
            : 'repeat(2, 1fr)',
          gap: isDesktop ? '1.5rem' : '0.75rem',
        }}
      >
        {Array.from({ length: cardCount }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </>
  );
}
