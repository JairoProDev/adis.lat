'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Categoria } from '@/types';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  const router = useRouter();

  const categoriaLabels: Record<Categoria | 'todos', string> = {
    todos: 'Todos',
    empleos: 'Empleos',
    inmuebles: 'Inmuebles',
    vehiculos: 'Vehículos',
    servicios: 'Servicios',
    productos: 'Productos',
    eventos: 'Eventos',
    negocios: 'Negocios',
    comunidad: 'Comunidad',
  };

  return (
    <nav aria-label="Breadcrumb" style={{ marginBottom: '1rem' }}>
      <ol
        itemScope
        itemType="https://schema.org/BreadcrumbList"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          listStyle: 'none',
          padding: 0,
          margin: 0,
          flexWrap: 'wrap',
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
        }}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const position = index + 1;

          return (
            <li
              key={index}
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {isLast ? (
                <span
                  itemProp="name"
                  style={{
                    color: 'var(--text-primary)',
                    fontWeight: 500,
                  }}
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : item.href ? (
                <a
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    router.push(item.href!);
                  }}
                  itemProp="item"
                  style={{
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  <span itemProp="name">{item.label}</span>
                </a>
              ) : (
                <span itemProp="name">{item.label}</span>
              )}
              <meta itemProp="position" content={position.toString()} />
              {!isLast && (
                <span aria-hidden="true" style={{ color: 'var(--text-tertiary)' }}>
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

