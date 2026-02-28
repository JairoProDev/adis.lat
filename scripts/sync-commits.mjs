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

    // Obtener los últimos 100 commits con cuerpo completo
    // Formato: hash | fecha_iso | cuerpo_completo
    let logs = [];
    try {
        // Usamos un delimitador único para separar commits ya que el cuerpo puede tener múltiples líneas
        const separator = '---COMIT_END---';
        const rawOutput = execSync(`git log -n 50 --pretty=format:"%h|%ad|%B${separator}" --date=iso`)
            .toString();
        logs = rawOutput.split(separator).filter(l => l.trim() !== '');
    } catch (e) {
        console.error('❌ Error al ejecutar git log. ¿Estás en un repositorio git?');
        return;
    }

    const newEntries = [];
    const titlesSeen = new Set(currentProgress.map(e => e.title.toLowerCase()));

    logs.forEach(commitRaw => {
        const firstPipe = commitRaw.indexOf('|');
        const secondPipe = commitRaw.indexOf('|', firstPipe + 1);

        if (firstPipe === -1 || secondPipe === -1) return;

        const hash = commitRaw.substring(0, firstPipe).trim();
        const dateStr = commitRaw.substring(firstPipe + 1, secondPipe).trim();
        const fullBody = commitRaw.substring(secondPipe + 1).trim();

        const lines = fullBody.split('\n');
        const subject = lines[0].trim();

        // Ignorar mensajes de merge o commits automáticos
        if (subject.includes('Merge branch') || subject.includes('Merge pull request')) return;

        // Limpiar el título quitando prefijos convencionales
        let title = subject.replace(/^(feat|fix|ui|improvement|chore|style|refactor|docs|perf|test|build|ci)(\(.*\))?:\s*/i, '');
        title = title.charAt(0).toUpperCase() + title.slice(1);

        // Si el título ya existe en el progreso, ignorar
        if (titlesSeen.has(title.toLowerCase())) return;

        // Parsear fecha y hora
        const dateObj = new Date(dateStr);
        const date = dateObj.toISOString().split('T')[0];
        const time = dateObj.toTimeString().split(' ')[0].substring(0, 5);

        // --- PARSEO DEL CUERPO ---
        let description = subject;
        let userBenefits = [];
        let technicalDetails = [`Commit Hash: ${hash}`];
        let currentSection = 'desc';

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const lineLower = line.toLowerCase();
            if (lineLower.startsWith('description:') || lineLower.startsWith('descripción:')) {
                currentSection = 'desc';
                description = line.split(':')[1]?.trim() || '';
                continue;
            } else if (lineLower.startsWith('benefits:') || lineLower.startsWith('beneficios:')) {
                currentSection = 'benefits';
                continue;
            } else if (lineLower.startsWith('tech:') || lineLower.startsWith('técnico:') || lineLower.startsWith('tecnico:')) {
                currentSection = 'tech';
                continue;
            }

            if (currentSection === 'desc') {
                description += (description ? ' ' : '') + line;
            } else if (currentSection === 'benefits') {
                if (line.startsWith('-') || line.startsWith('*')) {
                    userBenefits.push(line.substring(1).trim());
                } else {
                    userBenefits.push(line);
                }
            } else if (currentSection === 'tech') {
                if (line.startsWith('-') || line.startsWith('*')) {
                    technicalDetails.push(line.substring(1).trim());
                } else {
                    technicalDetails.push(line);
                }
            }
        }

        // Si no se detectaron beneficios, poner un default amigable
        if (userBenefits.length === 0) userBenefits = ["Mejoras constantes en la plataforma"];

        // Inferir tipo e impacto
        let type = 'improvement';
        let impact = 'minor';
        const msgLower = subject.toLowerCase();

        if (msgLower.startsWith('feat')) {
            type = 'feature';
            impact = 'major';
        } else if (msgLower.startsWith('fix')) {
            type = 'fix';
            impact = 'patch';
        } else if (msgLower.startsWith('ui')) {
            type = 'ui';
            impact = 'minor';
        }

        newEntries.push({
            version: `${hash}`,
            date,
            time,
            type,
            title,
            description,
            userBenefits,
            technicalDetails,
            impact
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
