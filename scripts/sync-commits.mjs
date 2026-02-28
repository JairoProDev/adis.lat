import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

/**
 * Script para automatizar el registro de progreso basado en Git commits.
 * Lee los últimos commits y los integra en data/progreso.json
 */

const DATA_PATH = './data/progreso.json';

function sync() {
    console.log('🔄 Sincronizando commits con el registro de progreso...');

    // Asegurar que el directorio de datos existe
    if (!fs.existsSync('./data')) {
        fs.mkdirSync('./data');
    }

    // Leer datos actuales
    let currentProgress = [];
    if (fs.existsSync(DATA_PATH)) {
        try {
            currentProgress = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
        } catch (e) {
            console.error('⚠️ Error al leer progreso.json, iniciando nuevo.');
        }
    }

    // Obtener los últimos 100 commits
    // Formato: hash | fecha_iso | mensaje
    let logs = [];
    try {
        logs = execSync('git log -n 100 --pretty=format:"%h|%ad|%s" --date=iso')
            .toString()
            .split('\n');
    } catch (e) {
        console.error('❌ Error al ejecutar git log. ¿Estás en un repositorio git?');
        return;
    }

    const newEntries = [];
    const titlesSeen = new Set(currentProgress.map(e => e.title.toLowerCase()));

    logs.forEach(line => {
        const parts = line.split('|');
        if (parts.length < 3) return;

        const hash = parts[0];
        const dateStr = parts[1];
        const fullMessage = parts.slice(2).join('|');

        // Ignorar mensajes de merge o commits automáticos
        if (fullMessage.includes('Merge branch') || fullMessage.includes('Merge pull request')) return;

        // Limpiar el título quitando prefijos convencionales
        let title = fullMessage.replace(/^(feat|fix|ui|improvement|improvement|chore|style|refactor|docs|perf|test|build|ci)(\(.*\))?:\s*/i, '');
        title = title.charAt(0).toUpperCase() + title.slice(1);

        // Si el título ya existe en el progreso, ignorar
        if (titlesSeen.has(title.toLowerCase())) return;

        // Parsear fecha y hora
        const dateObj = new Date(dateStr);
        const date = dateObj.toISOString().split('T')[0];
        const time = dateObj.toTimeString().split(' ')[0].substring(0, 5);

        // Inferir tipo e impacto
        let type = 'improvement';
        let impact = 'minor';
        const msgLower = fullMessage.toLowerCase();

        if (msgLower.startsWith('feat')) {
            type = 'feature';
            impact = 'major';
        } else if (msgLower.startsWith('fix')) {
            type = 'fix';
            impact = 'patch';
        } else if (msgLower.startsWith('ui')) {
            type = 'ui';
            impact = 'minor';
        } else if (msgLower.startsWith('chore') || msgLower.startsWith('build')) {
            type = 'improvement';
            impact = 'patch';
        }

        newEntries.push({
            version: `${hash}`,
            date,
            time,
            type: type,
            title,
            description: fullMessage,
            userBenefits: ["Mejora automática detectada"],
            technicalDetails: [
                `Commit Hash: ${hash}`,
                `Fecha commit: ${dateStr}`
            ],
            impact: impact
        });

        titlesSeen.add(title.toLowerCase());
    });

    if (newEntries.length === 0) {
        console.log('✅ El progreso ya está al día.');
        return;
    }

    // Unir y ordenar
    const updatedProgress = [...newEntries, ...currentProgress].sort((a, b) => {
        const da = new Date(`${a.date}T${a.time}`).getTime();
        const db = new Date(`${b.date}T${b.time}`).getTime();
        return db - da; // Descendente
    });

    fs.writeFileSync(DATA_PATH, JSON.stringify(updatedProgress, null, 2));
    console.log(`🚀 Sincronización exitosa: +${newEntries.length} nuevos hitos agregados.`);
}

sync();
