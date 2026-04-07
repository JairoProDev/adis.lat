import Link from 'next/link';

export default function FeedPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem',
        background: 'var(--bg-secondary)',
        color: 'var(--text-primary)'
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: '680px',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.06)'
        }}
      >
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Feed social en pausa temporal
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Esta sección está archivada mientras construimos la capa social real. Por ahora, la experiencia activa es
          <strong> Mi Negocio</strong>.
        </p>
        <Link
          href="/mi-negocio"
          style={{
            display: 'inline-block',
            background: 'var(--brand-blue)',
            color: 'white',
            fontWeight: 700,
            textDecoration: 'none',
            borderRadius: '10px',
            padding: '0.65rem 1rem'
          }}
        >
          Ir a Mi Negocio
        </Link>
      </section>
    </main>
  );
}
