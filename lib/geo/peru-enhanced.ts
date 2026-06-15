import { PERU_UBICACIONES, type Departamento } from '@/lib/peru-ubicaciones';
import { DISTRITOS_CUSCO } from '@/lib/cusco-ubicaciones';

function clonePeruBase(): Departamento[] {
  return PERU_UBICACIONES.map((d) => ({
    nombre: d.nombre,
    provincias: d.provincias.map((p) => ({
      nombre: p.nombre,
      distritos: [...p.distritos],
    })),
  }));
}

/** Perú con Cusco enriquecido desde la base geográfica detallada */
function buildEnhancedPeru(): Departamento[] {
  const base = clonePeruBase();
  const cuscoIdx = base.findIndex((d) => d.nombre === 'Cusco');
  if (cuscoIdx === -1) return base;

  const byProvincia = new Map<string, Set<string>>();
  for (const dist of DISTRITOS_CUSCO) {
    if (!byProvincia.has(dist.provincia)) byProvincia.set(dist.provincia, new Set());
    byProvincia.get(dist.provincia)!.add(dist.nombre);
  }

  const provMap = new Map(base[cuscoIdx].provincias.map((p) => [p.nombre, p]));

  for (const [provName, distritos] of byProvincia) {
    const existing = provMap.get(provName);
    if (existing) {
      const merged = new Set([...existing.distritos, ...distritos]);
      existing.distritos = Array.from(merged).sort((a, b) => a.localeCompare(b, 'es'));
    } else {
      const nueva = {
        nombre: provName,
        distritos: Array.from(distritos).sort((a, b) => a.localeCompare(b, 'es')),
      };
      base[cuscoIdx].provincias.push(nueva);
      provMap.set(provName, nueva);
    }
  }

  base[cuscoIdx].provincias.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  return base;
}

export const PERU_ENHANCED: Departamento[] = buildEnhancedPeru();

export function getPeruDepartamentos(): string[] {
  return PERU_ENHANCED.map((d) => d.nombre);
}

export function getPeruProvincias(departamento: string): string[] {
  const dept = PERU_ENHANCED.find((d) => d.nombre === departamento);
  return dept ? dept.provincias.map((p) => p.nombre) : [];
}

export function getPeruDistritos(departamento: string, provincia: string): string[] {
  const dept = PERU_ENHANCED.find((d) => d.nombre === departamento);
  if (!dept) return [];
  const prov = dept.provincias.find((p) => p.nombre === provincia);
  return prov ? prov.distritos : [];
}
