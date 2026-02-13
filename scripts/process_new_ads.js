const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, 'raw_ads_input.csv');
const OUTPUT_FILE = path.join(__dirname, '..', 'nuevos_anuncios_semanales_v2.csv');

// Configuración de fechas: últimos 14 días
const END_DATE = new Date('2025-12-20T23:59:59');
const START_DATE = new Date('2025-12-06T00:00:00');

function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function formatTime(date) {
    return date.toTimeString().split(' ')[0].substring(0, 5);
}

function cleanText(text) {
    return text ? text.trim() : '';
}

function processAds() {
    try {
        const data = fs.readFileSync(INPUT_FILE, 'utf8');
        const lines = data.split('\n');
        const ads = [];

        // Saltar header
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Parseo manual simple para Categoria,"Titulo...","Contacto..."
            // 1. Encontrar primera coma
            const firstComma = line.indexOf(',');
            if (firstComma === -1) continue;

            const categoria = line.substring(0, firstComma).trim();
            let rest = line.substring(firstComma + 1).trim();

            // Quitar comillas iniciales y finales y separar por ","
            // Formato esperado: "Titulo","Contacto"
            if (rest.startsWith('"')) rest = rest.substring(1);
            if (rest.endsWith('"')) rest = rest.substring(0, rest.length - 1);

            const parts = rest.split('","');
            if (parts.length < 2) continue;

            const tituloDescRaw = parts[0];
            const contactoUbicRaw = parts[1];

            // Separar Título y Descripción
            let titulo = tituloDescRaw;
            let descripcion = tituloDescRaw; // Dejar descripción completa

            const firstDot = tituloDescRaw.indexOf('.');
            if (firstDot !== -1 && firstDot < 100) {
                titulo = tituloDescRaw.substring(0, firstDot).trim();
            }

            // Separar Contacto y Ubicación
            let contacto = contactoUbicRaw;
            let ubicacion = "Cusco";

            if (contactoUbicRaw.includes(' / ')) {
                const contactParts = contactoUbicRaw.split(' / ');
                contacto = contactParts[0].trim();
                ubicacion = contactParts[1].trim();
            }

            // Generar fecha
            const dt = randomDate(START_DATE, END_DATE);

            ads.push({
                categoria: categoria.toLowerCase(),
                titulo: cleanText(titulo),
                descripcion: cleanText(descripcion),
                contacto: cleanText(contacto),
                ubicacion: cleanText(ubicacion),
                precio: 0,
                moneda: 'PEN',
                fecha_publicacion: formatDate(dt),
                hora_publicacion: formatTime(dt)
            });
        }

        // Generar CSV
        const header = 'categoria,titulo,descripcion,contacto,ubicacion,precio,moneda,fecha_publicacion,hora_publicacion\n';
        const rows = ads.map(ad =>
            `"${ad.categoria}","${ad.titulo.replace(/"/g, '""')}","${ad.descripcion.replace(/"/g, '""')}","${ad.contacto.replace(/"/g, '""')}","${ad.ubicacion.replace(/"/g, '""')}",${ad.precio},"${ad.moneda}","${ad.fecha_publicacion}","${ad.hora_publicacion}"`
        ).join('\n');

        fs.writeFileSync(OUTPUT_FILE, header + rows);
        console.log(`✅ ${ads.length} anuncios procesados y guardados en ${OUTPUT_FILE}`);

    } catch (error) {
        console.error('Error:', error);
    }
}

processAds();
