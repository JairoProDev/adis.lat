import * as fs from 'fs';

const csvPath = process.argv[2] || 'adisos_export_R2538-Jun20-26_2024_2025-12-15T22-37-37-842Z.csv';
const content = fs.readFileSync(csvPath, 'utf-8');
const lines = content.split('\n');

console.log('=== MUESTRA DE UBICACIONES EXTRAÍDAS ===\n');

// Saltar header
for (let i = 1; i < Math.min(20, lines.length); i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Parsear CSV simple (asumiendo que ubicacion está en columna 6)
    const match = line.match(/^([^,]+),([^,]+),([^,]+),([^,]+),([^,]+),("(?:[^"]|"")*"|[^,]*)/);

    if (match) {
        const titulo = match[3].replace(/^"|"$/g, '').substring(0, 50);
        let ubicacion = match[6].replace(/^"|"$/g, '').replace(/""/g, '"');

        console.log(`${i}. ${titulo}...`);
        console.log(`   📍 ${ubicacion}\n`);
    }
}
