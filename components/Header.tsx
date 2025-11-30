import { FaChartLine } from 'react-icons/fa';
import Breadcrumbs from './Breadcrumbs';

interface HeaderProps {
  onChangelogClick?: () => void;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export default function Header({ onChangelogClick, breadcrumbs }: HeaderProps) {
  return (
    <header style={{
      backgroundColor: 'var(--bg-primary)',
      borderBottom: '1px solid var(--border-color)',
      padding: '1rem',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: breadcrumbs ? '0.5rem' : 0
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
        letterSpacing: '-0.02em',
        margin: 0
      }}>
        buscadis.com
      </h1>
      {onChangelogClick && (
        <button
          onClick={onChangelogClick}
          aria-label="Ver nuestro progreso y changelog"
          style={{
            background: 'none',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '0.5rem 0.75rem',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <FaChartLine size={14} aria-hidden="true" />
          Nuestro Progreso
        </button>
      )}
      </div>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs items={breadcrumbs} />
      )}
    </header>
  );
}

