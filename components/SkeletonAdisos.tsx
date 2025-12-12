export default function SkeletonAdisos() {
  return (
    <>
      <style jsx>{`
        .skeleton-grilla {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }
        @media (min-width: 768px) {
          .skeleton-grilla {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        .skeleton-item {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
      <div className="skeleton-grilla">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="skeleton-item"
            style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              minHeight: '120px'
            }}
          >
            <div style={{
              width: '60px',
              height: '12px',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: '4px'
            }} />
            <div style={{
              width: '100%',
              height: '16px',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: '4px',
              marginTop: '0.5rem'
            }} />
            <div style={{
              width: '80%',
              height: '16px',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: '4px'
            }} />
          </div>
        ))}
      </div>
    </>
  );
}
















