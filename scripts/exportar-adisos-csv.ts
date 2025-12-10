
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { Adiso, Categoria, ContactoMultiple } from '@/types';
import { extraerNumerosTelefono, extraerEmails, esWhatsApp, limpiarContactosDeDescripcion } from '@/lib/limpiar-contactos';
import { adisoToDb } from '@/lib/supabase';
import { generarIdUnico } from '@/lib/utils'; // Keep generating IDs locally so they are consistent in the CSV

// Cargar variables (aunque no usaremos Supabase API, puede que necesitemos algo de config, por ahora no crítico)
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Configuración
const CARPETAS_BASE = '/home/jairoprodev/proyectos/adisos-processing/procesamiento/04-anuncios-separados';

// Mapeo de meses (Reutilizado)
const MESES: { [key: string]: string } = {
    'Ene': '01', 'Feb': '02', 'Mar': '03', 'Abr': '04', 'May': '05', 'Jun': '06',
    'Jul': '07', 'Ago': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dic': '12',
    'Jan': '01', 'Apr': '04', 'Aug': '08', 'Dec': '12'
};

// --- LOGICA DE PARSEO Y LIMPIEZA (Idéntica al script anterior) ---

function parsearLineaAdiso(linea: string): { titulo: string; descripcion: string } | null {
    if (!linea || linea.trim().length === 0) return null;
    const sinNumero = linea.replace(/^\d+\.\s*/, '').trim();
    if (sinNumero.length === 0) return null;

    const indiceSeparador = sinNumero.indexOf(':');
    if (indiceSeparador === -1) {
        const palabras = sinNumero.split(/\s+/);
        if (palabras.length < 3) return null;
        const titulo = palabras.slice(0, Math.min(10, palabras.length - 5)).join(' ');
        const descripcion = palabras.slice(Math.min(10, palabras.length - 5)).join(' ');
        return { titulo: titulo.trim(), descripcion: descripcion.trim() };
    }
    const titulo = sinNumero.substring(0, indiceSeparador).trim();
    const descripcion = sinNumero.substring(indiceSeparador + 1).trim();
    if (!titulo || !descripcion || titulo.length < 3 || descripcion.length < 10) return null;
    return { titulo, descripcion };
}

function detectingCategoria(titulo: string, descripcion: string): Categoria {
    const texto = `${titulo} ${descripcion}`.toLowerCase();

    // Empleos
    if (texto.match(/\b(empleo|trabajo|busco|requiero|necesito|personal|asesor|vendedor|operador|mozo|chef|cocinero|recepcionista|practicante|auxiliar|administrador|gerente|contador|abogado|médico|enfermera|profesor|maestro|barista|housekeeping|limpieza)\b/)) return 'empleos';

    // Inmuebles
    if (texto.match(/\b(casa|departamento|terreno|alquiler|alquilo|alquila|vendo|venta|inmueble|propiedad|local|oficina|tienda|hostal|hotel|habitación|dormitorio|garaje|cochera|sótano)\b/)) return 'inmuebles';

    // Vehículos
    if (texto.match(/\b(auto|carro|vehículo|moto|camioneta|vendo|compra|remato|remate|toyota|nissan|hyundai|kia)\b/)) return 'vehiculos';

    // Eventos
    if (texto.match(/\b(evento|fiesta|celebración|concierto|show|espectáculo|festival)\b/)) return 'eventos';

    // Negocios
    if (texto.match(/\b(negocio|empresa|franquicia|socio|inversión|oportunidad|traspaso)\b/)) return 'negocios';

    // Productos
    if (texto.match(/\b(vendo|venta|producto|artículo|equipo|maquinaria|mueble|electrodoméstico|laptop|celular|ropa|zapatos)\b/)) return 'productos';

    return 'servicios';
}

function parsearFechaDesdeCarpeta(carpeta: string, anioDefault: number): string {
    const match = carpeta.match(/-([A-Za-z]+)(\d+)-/);
    if (match) {
        const mesStr = match[1];
        const diaStr = match[2];
        const mesKey = Object.keys(MESES).find(k => k.toLowerCase() === mesStr.toLowerCase());
        if (mesKey && diaStr) {
            const mes = MESES[mesKey];
            const dia = diaStr.padStart(2, '0');
            return `${anioDefault}-${mes}-${dia}`;
        }
    }
    return `${anioDefault}-01-01`;
}

function crearAdisoHistorico(
    titulo: string, descripcion: string, contactos: ContactoMultiple[],
    carpeta: string, archivo: string, numeroLinea: number,
    fechaPublicacion: string, horaPublicacion: string = '09:00'
): Adiso {
    const descripcionLimpia = limpiarContactosDeDescripcion(descripcion, contactos);
    const contactoPrincipal = contactos.find(c => c.principal)?.valor ||
        contactos.find(c => c.tipo === 'telefono' || c.tipo === 'whatsapp')?.valor ||
        contactos.find(c => c.tipo === 'email')?.valor ||
        contactos[0]?.valor || '';
    const categoria = detectingCategoria(titulo, descripcionLimpia);
    const edicionNumero = carpeta.match(/^R\d+/)?.[0] || carpeta;

    return {
        id: generarIdUnico(),
        categoria,
        titulo: titulo.substring(0, 100),
        descripcion: descripcionLimpia.substring(0, 2000),
        contacto: contactoPrincipal,
        ubicacion: 'Cusco, Perú',
        fechaPublicacion: fechaPublicacion,
        horaPublicacion: horaPublicacion,
        tamaño: 'miniatura',
        esHistorico: true,
        estaActivo: false,
        fuenteOriginal: 'rueda_negocios',
        edicionNumero: edicionNumero,
        fechaPublicacionOriginal: fechaPublicacion,
        contactosMultiples: contactos.length > 0 ? contactos : undefined
    };
}

function procesarArchivo(rutaArchivo: string, carpeta: string, archivo: string, fechaPublicacion: string): Adiso[] {
    const adisos: Adiso[] = [];
    try {
        const contenido = fs.readFileSync(rutaArchivo, 'utf-8');
        const lineas = contenido.split('\n');

        lineas.forEach((linea, indice) => {
            const lineaNumero = indice + 1;
            const parseado = parsearLineaAdiso(linea);
            if (!parseado) return;

            const { titulo, descripcion } = parseado;
            const numerosTelefono = extraerNumerosTelefono(descripcion);
            const emails = extraerEmails(descripcion);
            const contactos: ContactoMultiple[] = [];

            numerosTelefono.forEach((numero, index) => {
                const esWA = esWhatsApp(descripcion, numero);
                contactos.push({ tipo: esWA ? 'whatsapp' : 'telefono', valor: numero, principal: index === 0 });
            });
            emails.forEach((email, index) => {
                contactos.push({ tipo: 'email', valor: email, principal: contactos.length === 0 && index === 0 });
            });

            const adiso = crearAdisoHistorico(titulo, descripcion, contactos, carpeta, archivo, lineaNumero, fechaPublicacion);
            adisos.push(adiso);
        });
    } catch (error: any) {
        console.error(`  ❌ Error al procesar archivo ${archivo}:`, error.message);
    }
    return adisos;
}

// --- LOGICA DE EXPORTACIÓN A CSV ---

function escapeCsvValue(val: any): string {
    if (val === null || val === undefined) return '';
    const stringVal = String(val);
    // Si contiene comillas, comas o saltos de línea, hay que envolverlo en comillas y escapar las comillas internas
    if (stringVal.includes('"') || stringVal.includes(',') || stringVal.includes('\n') || stringVal.includes('\r')) {
        return `"${stringVal.replace(/"/g, '""')}"`;
    }
    return stringVal;
}

async function generarCsv(adisos: Adiso[], rutaSalida: string) {
    if (adisos.length === 0) {
        console.log('⚠️  No hay adisos para exportar.');
        return;
    }

    // Obtenemos los headers basados en el objeto DB generado
    const ejemploDb = adisoToDb(adisos[0]);
    const headers = Object.keys(ejemploDb); // e.g., ['id', 'titulo', 'descripcion', ...]

    const stream = fs.createWriteStream(rutaSalida, { encoding: 'utf8' });

    // Escribir BOM para Excel (opcional, ayuda con caracteres especiales en Windows)
    stream.write('\uFEFF');

    // Escribir Headers
    stream.write(headers.map(h => escapeCsvValue(h)).join(',') + '\n');

    // Escribir filas
    for (const adiso of adisos) {
        const dbObj = adisoToDb(adiso);
        const row = headers.map(header => {
            const val = dbObj[header];
            return escapeCsvValue(val);
        });
        stream.write(row.join(',') + '\n');
    }

    stream.end();
    console.log(`✅ Archivo CSV generado exitosamente: ${rutaSalida}`);
}

async function main() {
    const args = process.argv.slice(2);
    const carpetaArg = args.find(arg => arg.startsWith('--carpeta='));
    const carpetaEspecifica = carpetaArg ? carpetaArg.split('=')[1] : undefined;

    const anioArg = args.find(arg => arg.startsWith('--anio='));
    const anio = anioArg ? parseInt(anioArg.split('=')[1]) : new Date().getFullYear();

    const limitArg = args.find(arg => arg.startsWith('--limit='));
    const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 0;

    const todas = args.includes('--todas');

    if (!carpetaEspecifica && !todas) {
        console.log('❌ Debes especificar --carpeta=NOMBRE o --todas');
        process.exit(1);
    }

    // Buscar carpetas a procesar
    let carpetas: string[] = [];
    if (carpetaEspecifica) {
        carpetas = [carpetaEspecifica];
    } else if (todas) {
        if (!fs.existsSync(CARPETAS_BASE)) {
            console.error(`❌ Directorio base no encontrado: ${CARPETAS_BASE}`);
            process.exit(1);
        }
        carpetas = fs.readdirSync(CARPETAS_BASE, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name)
            .sort();
    }

    console.log(`🚀 Iniciando exportación a CSV...`);
    console.log(`📅 Año base: ${anio}`);
    console.log(`📂 Carpetas a procesar: ${carpetas.length}`);

    const todosLosAdisos: Adiso[] = [];

    for (const carpeta of carpetas) {
        const rutaCarpeta = path.join(CARPETAS_BASE, carpeta);
        if (!fs.existsSync(rutaCarpeta)) {
            console.warn(`⚠️ Carpeta no existe: ${rutaCarpeta}`);
            continue;
        }

        // Filtro de archivos
        const archivos = fs.readdirSync(rutaCarpeta).filter(f => f.endsWith('.txt')).sort();
        const archivosProcesar = limit > 0 ? archivos.slice(0, limit) : archivos;

        const fecha = parsearFechaDesdeCarpeta(carpeta, anio);
        console.log(`   Procesando ${carpeta} (${archivosProcesar.length} archivos) - Fecha: ${fecha}`);

        for (const archivo of archivosProcesar) {
            const rutaArchivo = path.join(rutaCarpeta, archivo);
            const procesados = procesarArchivo(rutaArchivo, carpeta, archivo, fecha);
            todosLosAdisos.push(...procesados);
        }
    }

    console.log(`\n📊 Total adisos procesados: ${todosLosAdisos.length}`);

    // Generar nombre de archivo único
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const nombreBase = carpetaEspecifica ? carpetaEspecifica : 'todas-las-carpetas';
    const outputFile = path.join(process.cwd(), `adisos_export_${nombreBase}_${anio}_${timestamp}.csv`);

    await generarCsv(todosLosAdisos, outputFile);
}

main().catch(console.error);
