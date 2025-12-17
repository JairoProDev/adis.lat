import * as fs from 'fs';
import * as path from 'path';

// Buscar el archivo CSV más reciente
const files = fs.readdirSync(process.cwd())
    .filter(f => f.startsWith('adisos_export_todas-las-carpetas') && f.endsWith('.csv'))
    .map(f => ({
        name: f,
        time: fs.statSync(path.join(process.cwd(), f)).mtime
    }))
    .sort((a, b) => b.time.getTime() - a.time.getTime());

if (files.length < 1) {
    console.log('No hay archivos CSV para analizar');
    process.exit(1);
}

const csvFile = files[0].name;
console.log(`📊 Analizando: ${csvFile}\n`);

const content = fs.readFileSync(csvFile, 'utf-8');
const lines = content.split('\n').filter(l => l.trim());

// Función para parsear CSV correctamente
function parsearLinea(line: string): string[] {
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
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
    return parts;
}

// Analizar ubicaciones
const ubicaciones: { [key: string]: number } = {};
const distritos: { [key: string]: number } = {};
const tiposVia: { [key: string]: number } = {};

let totalConDetalle = 0;
let totalGenerico = 0;

for (let i = 1; i < lines.length; i++) {
    const parts = parsearLinea(lines[i]);
    const ubicacion = parts[5] || '';

    if (!ubicacion) continue;

    // Contar ubicaciones
    ubicaciones[ubicacion] = (ubicaciones[ubicacion] || 0) + 1;

    // Detectar si tiene detalle específico
    if (ubicacion !== 'Cusco, Perú') {
        totalConDetalle++;

        // Extraer distrito
        const distritosLista = ['San Sebastián', 'San Jerónimo', 'Wanchaq', 'Wánchaq', 'Santiago', 'Cusco', 'Poroy', 'Saylla', 'Oropesa', 'Lucre', 'Huasao', 'Chinchero'];
        for (const dist of distritosLista) {
            if (ubicacion.includes(dist)) {
                distritos[dist] = (distritos[dist] || 0) + 1;
                break;
            }
        }

        // Detectar tipo de vía
        if (ubicacion.match(/^Urb\./i)) tiposVia['Urbanización'] = (tiposVia['Urbanización'] || 0) + 1;
        else if (ubicacion.match(/^Av\./i)) tiposVia['Avenida'] = (tiposVia['Avenida'] || 0) + 1;
        else if (ubicacion.match(/^Calle/i)) tiposVia['Calle'] = (tiposVia['Calle'] || 0) + 1;
        else if (ubicacion.match(/^Jr\./i)) tiposVia['Jirón'] = (tiposVia['Jirón'] || 0) + 1;
        else if (ubicacion.match(/^Psje\./i)) tiposVia['Pasaje'] = (tiposVia['Pasaje'] || 0) + 1;
        else if (ubicacion.match(/^APV/i)) tiposVia['APV'] = (tiposVia['APV'] || 0) + 1;
        else if (ubicacion.match(/^Prolongación/i)) tiposVia['Prolongación'] = (tiposVia['Prolongación'] || 0) + 1;
    } else {
        totalGenerico++;
    }
}

const total = lines.length - 1; // Menos header

console.log('═══════════════════════════════════════════════════════════════');
console.log('                  ANÁLISIS DE UBICACIONES                      ');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log(`📈 RESUMEN GENERAL:`);
console.log(`   Total de avisos: ${total.toLocaleString()}`);
console.log(`   Con ubicación específica: ${totalConDetalle.toLocaleString()} (${((totalConDetalle / total) * 100).toFixed(1)}%)`);
console.log(`   Ubicación genérica: ${totalGenerico.toLocaleString()} (${((totalGenerico / total) * 100).toFixed(1)}%)\n`);

console.log(`📍 TOP 10 UBICACIONES MÁS COMUNES:`);
const topUbicaciones = Object.entries(ubicaciones)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

topUbicaciones.forEach(([ubicacion, count], index) => {
    const displayUbicacion = ubicacion.length > 50 ? ubicacion.substring(0, 47) + '...' : ubicacion;
    console.log(`   ${index + 1}. ${displayUbicacion.padEnd(50)} (${count.toLocaleString()})`);
});

console.log(`\n🏘️  DISTRIBUCIÓN POR DISTRITO:`);
const topDistritos = Object.entries(distritos)
    .sort((a, b) => b[1] - a[1]);

topDistritos.forEach(([distrito, count]) => {
    const porcentaje = ((count / totalConDetalle) * 100).toFixed(1);
    console.log(`   ${distrito.padEnd(20)} ${count.toLocaleString().padStart(6)} (${porcentaje}%)`);
});

console.log(`\n🛣️  TIPOS DE VÍA DETECTADOS:`);
const topTiposVia = Object.entries(tiposVia)
    .sort((a, b) => b[1] - a[1]);

topTiposVia.forEach(([tipo, count]) => {
    const porcentaje = ((count / totalConDetalle) * 100).toFixed(1);
    console.log(`   ${tipo.padEnd(20)} ${count.toLocaleString().padStart(6)} (${porcentaje}%)`);
});

console.log(`\n📋 EJEMPLOS DE UBICACIONES EXTRAÍDAS:\n`);

// Mostrar 15 ejemplos variados
const ejemplos: Array<{ titulo: string; ubicacion: string }> = [];
for (let i = 1; i < Math.min(500, lines.length); i += 30) {
    const parts = parsearLinea(lines[i]);
    const titulo = parts[2] || '';
    const ubicacion = parts[5] || '';

    if (ubicacion !== 'Cusco, Perú') {
        ejemplos.push({
            titulo: titulo.substring(0, 45),
            ubicacion: ubicacion.substring(0, 60)
        });
    }

    if (ejemplos.length >= 15) break;
}

ejemplos.forEach((ej, index) => {
    console.log(`${(index + 1).toString().padStart(2)}. ${ej.titulo}...`);
    console.log(`    📍 ${ej.ubicacion}\n`);
});

console.log('═══════════════════════════════════════════════════════════════');
console.log(`✅ Mejora lograda: ${((totalConDetalle / total) * 100).toFixed(1)}% de avisos con ubicación específica`);
console.log('═══════════════════════════════════════════════════════════════\n');
