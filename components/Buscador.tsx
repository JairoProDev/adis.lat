'use client';

import { useState, useRef, useEffect } from 'react';
import { FaSearch, FaMagic } from 'react-icons/fa';
import { useTranslation } from '@/hooks/useTranslation';
import { Categoria } from '@/types';
import {
  IconTodos,
  IconEmpleos,
  IconInmuebles,
  IconVehiculos,
  IconServicios,
  IconProductos,
  IconEventos,
  IconNegocios,
  IconComunidad
} from './Icons';

interface BuscadorProps {
  value: string;
  onChange: (value: string) => void;
  categoriaSeleccionada?: Categoria | 'todos';
  onCategoriaChange?: (categoria: Categoria | 'todos') => void;
}

export default function Buscador({ value, onChange, categoriaSeleccionada = 'todos', onCategoriaChange }: BuscadorProps) {
  const { t } = useTranslation();
  const [mostrarCategorias, setMostrarCategorias] = useState(false);
  const contenedorRef = useRef<HTMLButtonElement>(null);
  const categoriasRef = useRef<HTMLDivElement>(null);

  const CATEGORIAS: Array<{ value: Categoria | 'todos'; labelKey: string; icon: React.ComponentType<{ size?: number; color?: string }> }> = [
    { value: 'todos', labelKey: 'categories.all', icon: IconTodos },
    { value: 'empleos', labelKey: 'categories.empleos', icon: IconEmpleos },
    { value: 'inmuebles', labelKey: 'categories.inmuebles', icon: IconInmuebles },
    { value: 'vehiculos', labelKey: 'categories.vehiculos', icon: IconVehiculos },
    { value: 'servicios', labelKey: 'categories.servicios', icon: IconServicios },
    { value: 'productos', labelKey: 'categories.productos', icon: IconProductos },
    { value: 'eventos', labelKey: 'categories.eventos', icon: IconEventos },
    { value: 'negocios', labelKey: 'categories.negocios', icon: IconNegocios },
    { value: 'comunidad', labelKey: 'categories.comunidad', icon: IconComunidad },
  ];

  const categoriaActual = CATEGORIAS.find(cat => cat.value === categoriaSeleccionada) || CATEGORIAS[0];
  const CategoriaIcon = categoriaActual.icon;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contenedorRef.current &&
        categoriasRef.current &&
        !contenedorRef.current.contains(event.target as Node) &&
        !categoriasRef.current.contains(event.target as Node)
      ) {
        setMostrarCategorias(false);
      }
    };

    if (mostrarCategorias) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mostrarCategorias]);

  const handleCategoriaSelect = (categoria: Categoria | 'todos') => {
    onCategoriaChange?.(categoria);
    setMostrarCategorias(false);
  };

  return (
    <div className={`-mx-4 px-4 py-2 md:mx-0 md:px-0 transition-all duration-300`}>
      <div className="relative group z-30">
        <div
          className={`
            relative flex items-center bg-white border-2 rounded-xl px-4 py-3 
            shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200
            ${mostrarCategorias ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-gray-200 hover:border-gray-300'}
            focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10
          `}
        >
          {/* Category Trigger */}
          <button
            ref={contenedorRef}
            onClick={() => setMostrarCategorias(!mostrarCategorias)}
            className={`flex items-center gap-2 pr-3 mr-3 border-r border-gray-200 hover:text-blue-600 transition-colors ${categoriaSeleccionada !== 'todos' ? 'text-blue-600' : 'text-gray-500'}`}
            aria-label="Categoría"
          >
            <CategoriaIcon size={20} />
            <span className="sr-only">{t(categoriaActual.labelKey)}</span>
            <span className="text-[10px] text-gray-400">▼</span>
          </button>

          {/* Search Input */}
          <div className="flex-1 flex items-center min-w-0">
            <FaSearch className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
            <input
              type="search"
              placeholder={t('search.placeholder') || "¿Qué estás buscando? Ej: 'depa 2 cuartos'"}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full border-none outline-none text-[15px] text-gray-700 placeholder-gray-400 bg-transparent truncate"
            />
          </div>

          {/* AI Hint */}
          <button className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white border-none rounded-lg text-xs font-bold tracking-wide shadow-sm hover:shadow-md transition-shadow ml-2 shrink-0">
            <FaMagic className="text-yellow-300" />
            <span>AI</span>
          </button>
        </div>

        {/* Dropdown de categorías */}
        {mostrarCategorias && (
          <div
            ref={categoriasRef}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-2"
          >
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {CATEGORIAS.map((cat) => {
                const CatIcon = cat.icon;
                const estaSeleccionada = categoriaSeleccionada === cat.value;

                return (
                  <button
                    key={cat.value}
                    onClick={() => handleCategoriaSelect(cat.value)}
                    className={`
                      flex flex-col items-center gap-2 p-3 rounded-xl transition-all
                      ${estaSeleccionada
                        ? 'bg-blue-50 border-2 border-blue-500 text-blue-700 shadow-sm'
                        : 'bg-gray-50 border border-transparent text-gray-600 hover:bg-gray-100 hover:scale-105'
                      }
                    `}
                  >
                    <div className={`
                      p-2 rounded-full 
                      ${estaSeleccionada ? 'bg-white' : 'bg-gray-200/50'}
                    `}>
                      <CatIcon size={20} />
                    </div>
                    <span className="text-xs font-medium text-center leading-tight">
                      {t(cat.labelKey)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Suggestion Text */}
      <div className="mt-3 flex items-start gap-2 px-1 opacity-80">
        <span className="text-sm">💡</span>
        <p className="text-[13px] text-gray-500 leading-snug">
          <span className="hidden sm:inline">Prueba buscar: </span>
          <span className="font-medium text-gray-600">"trabajo remoto diseño"</span> o <span className="font-medium text-gray-600">"auto usado 2020"</span>
        </p>
      </div>
    </div>
  );
}

