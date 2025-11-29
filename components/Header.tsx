export default function Header() {
  return (
    <header style={{
      backgroundColor: 'var(--bg-primary)',
      borderBottom: '1px solid var(--border-color)',
      padding: '1rem',
      textAlign: 'center'
    }}>
      <h1 style={{
        fontSize: '1.5rem',
        fontWeight: 600,
        color: 'var(--text-primary)',
        letterSpacing: '-0.02em'
      }}>
        buscadis.com
      </h1>
    </header>
  );
}

