/**
 * Script para Listar Revistas Disponibles
 * 
 * Busca carpetas y PDFs de revistas en el directorio especificado
 */

import * as fs from 'fs';
import * as path from 'path';

function listarRevistas(directorio: string): void {
  if (!fs.existsSync(directorio)) {
    console.error(`❌ El directorio no existe: ${directorio}`);
    console.log('\n💡 Rutas comunes:');
    console.log('   - ~/Desktop/Magazines');
    console.log('   - ~/OneDrive/Desktop/Magazines');
    console.log('   - ~/Documents/Magazines');
    return;
  }
  
  const items = fs.readdirSync(directorio, { withFileTypes: true });
  
  const carpetas = items
    .filter(item => item.isDirectory() && item.name.match(/^R\d+/i))
    .map(item => item.name)
    .sort();
  
  const pdfs = items
    .filter(item => item.isFile() && item.name.toLowerCase().endsWith('.pdf') && item.name.match(/^R\d+/i))
    .map(item => item.name)
    .sort();
  
  console.log('📚 REVISTAS DISPONIBLES');
  console.log('='.repeat(60));
  console.log(`\n📁 Carpetas (PDFs partidos): ${carpetas.length}`);
  for (const carpeta of carpetas) {
    const ruta = path.join(directorio, carpeta);
    const archivos = fs.readdirSync(ruta).filter(f => f.endsWith('.pdf')).length;
    console.log(`   - ${carpeta} (${archivos} PDFs)`);
  }
  
  console.log(`\n📄 PDFs completos: ${pdfs.length}`);
  for (const pdf of pdfs) {
    const ruta = path.join(directorio, pdf);
    const stats = fs.statSync(ruta);
    const tamañoMB = (stats.size / (1024 * 1024)).toFixed(1);
    console.log(`   - ${pdf} (${tamañoMB} MB)`);
  }
  
  console.log(`\n📊 Total: ${carpetas.length} carpetas + ${pdfs.length} PDFs = ${carpetas.length + pdfs.length} revistas`);
  
  if (carpetas.length > 0 || pdfs.length > 0) {
    console.log('\n💡 Para procesar una revista:');
    if (carpetas.length > 0) {
      console.log(`   npx ts-node scripts/procesar-revista-completa.ts --carpeta "${directorio}/${carpetas[0]}"`);
    }
    if (pdfs.length > 0) {
      console.log(`   npx ts-node scripts/procesar-revista-completa.ts --pdf "${directorio}/${pdfs[0]}"`);
    }
  }
}

const args = process.argv.slice(2);
const directorio = args[0] || process.env.MAGAZINES_PATH || '~/Desktop/Magazines';

// Expandir ~
const dirExpandido = directorio.startsWith('~')
  ? path.join(process.env.HOME || '', directorio.substring(1))
  : directorio;

listarRevistas(dirExpandido);









