import { IconSearch } from './Icons';

interface BuscadorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function Buscador({ value, onChange }: BuscadorProps) {
  return (
    <div style={{ position: 'relative' }}>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '0.75rem',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--text-tertiary)',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <IconSearch />
      </div>
      <input
        type="search"
        placeholder="Buscar ofertas y oportunidades..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Buscar adisos"
        style={{
          width: '100%',
          padding: '0.75rem 1rem 0.75rem 2.5rem',
          fontSize: '1rem',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          outline: 'none',
          transition: 'border-color 0.2s'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--text-secondary)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--border-color)';
        }}
      />
    </div>
  );
}

