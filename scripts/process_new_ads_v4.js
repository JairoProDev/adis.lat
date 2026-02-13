const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Leemos el archivo v3 que ya tiene los datos limpios
const INPUT_FILE = path.join(__dirname, '..', 'nuevos_anuncios_semanales_v3_CORREGIDO.csv');
const OUTPUT_FILE = path.join(__dirname, '..', 'nuevos_anuncios_semanales_v4_UUIDS.csv');

function processAds() {
    try {
        if (!fs.existsSync(INPUT_FILE)) {
            console.error('No se encontró el archivo de entrada:', INPUT_FILE);
            return;
        }

        const data = fs.readFileSync(INPUT_FILE, 'utf8');
        const lines = data.split('\n');
        const ads = [];
        let header = '';

        // Procesar líneas
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            if (i === 0) {
                // Mantener el header tal cual
                header = line;
                continue;
            }

            // Separar columnas respetando comillas
            // Nota: Este split es muy básico, asume que solo la descripción/titulo pueden tener comas dentro de comillas
            // Para ser más robustos regeneramos la línea reemplazando solo el ID.

            const firstCommaIndex = line.indexOf(',');
            if (firstCommaIndex === -1) continue;

            const restOfLine = line.substring(firstCommaIndex + 1);

            // Generar UUID v4 real
            const newId = crypto.randomUUID();

            ads.push(`${newId},${restOfLine}`);
        }

        const finalContent = header + '\n' + ads.join('\n');

        fs.writeFileSync(OUTPUT_FILE, finalContent);
        console.log(`✅ ${ads.length} anuncios procesados con UUIDs únicos en: ${OUTPUT_FILE}`);

    } catch (error) {
        console.error('Error:', error);
    }
}

processAds();
