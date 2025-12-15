import * as fs from 'fs';
import * as path from 'path';

// Buscar los dos archivos CSV más recientes
const files = fs.readdirSync(process.cwd())
    .filter(f => f.startsWith('adisos_export_todas-las-carpetas') && f.endsWith('.csv'))
    .map(f => ({
        name: f,
        time: fs.statSync(path.join(process.cwd(), f)).mtime
    }))
    .sort((a, b) => b.time.getTime() - a.time.getTime());

if (files.length < 2) {
    console.log('No hay suficientes archivos CSV para comparar');
    process.exit(1);
}

const nuevoCSV = files[0].name;
const anteriorCSV = files[1].name;

console.log(`📊 Comparando ubicaciones:\n`);
console.log(`Anterior: ${anteriorCSV}`);
console.log(`Nuevo:    ${nuevoCSV}\n`);

// Leer ambos archivos
const nuevoContent = fs.readFileSync(nuevoCSV, 'utf-8');
const anteriorContent = fs.readFileSync(anteriorCSV, 'utf-8');

const nuevoLines = nuevoContent.split('\n');
const anteriorLines = anteriorContent.split('\n');

// Función para extraer ubicación de una línea CSV
function extraerUbicacion(line: string): string {
    // La ubicación está en la columna "ubicacion"
    // Necesitamos parsear el CSV correctamente
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++; // Skip next quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            parts.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    parts.push(current);

    // La columna ubicacion debería estar en índice 5 (0-indexed)
    // id, categoria, titulo, descripcion, contacto, ubicacion, ...
    return parts[5] || '';
}

// Obtener headers
const headers = nuevoLines[0].split(',');
const ubicacionIndex = headers.findIndex(h => h.includes('ubicacion'));
console.log(`Índice de columna ubicacion: ${ubicacionIndex}\n`);

// Comparar primeras 15 líneas
console.log('=== COMPARACIÓN DE UBICACIONES ===\n');

for (let i = 1; i < Math.min(16, nuevoLines.length, anteriorLines.length); i++) {
    const nuevoLine = nuevoLines[i];
    const anteriorLine = anteriorLines[i];

    if (!nuevoLine.trim() || !anteriorLine.trim()) continue;

    const nuevaUbicacion = extraerUbicacion(nuevoLine);
    const anteriorUbicacion = extraerUbicacion(anteriorLine);

    // Extraer título para contexto
    const tituloMatch = nuevoLine.match(/,[^,]*,([^,]*)/);
    const titulo = tituloMatch ? tituloMatch[1].replace(/^"|"$/g, '').substring(0, 40) : '';

    if (nuevaUbicacion !== anteriorUbicacion) {
        console.log(`${i}. ${titulo}...`);
        console.log(`   ❌ Anterior: ${anteriorUbicacion}`);
        console.log(`   ✅ Nueva:    ${nuevaUbicacion}\n`);
    }
}

// Estadísticas
let mejoradas = 0;
let total = 0;

for (let i = 1; i < Math.min(nuevoLines.length, anteriorLines.length); i++) {
    const nuevoLine = nuevoLines[i];
    const anteriorLine = anteriorLines[i];

    if (!nuevoLine.trim() || !anteriorLine.trim()) continue;

    const nuevaUbicacion = extraerUbicacion(nuevoLine);
    const anteriorUbicacion = extraerUbicacion(anteriorLine);

    total++;
    if (nuevaUbicacion !== 'Cusco, Perú' && anteriorUbicacion === 'Cusco, Perú') {
        mejoradas++;
    }
}

console.log('\n=== ESTADÍSTICAS ===');
console.log(`Total de avisos: ${total}`);
console.log(`Ubicaciones mejoradas: ${mejoradas} (${((mejoradas / total) * 100).toFixed(1)}%)`);
console.log(`Ubicaciones con detalle específico: ${mejoradas}`);
