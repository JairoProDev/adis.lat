/**
 * Script para verificar anuncios cargados en Supabase
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('🔍 Verificando anuncios cargados...\n');
  
  // Anuncios históricos de Rueda de Negocios
  const { data: historicos, error: errorHistoricos } = await supabase
    .from('adisos')
    .select('id, titulo, categoria, es_historico, fuente_original, edicion_numero, distrito')
    .eq('fuente_original', 'rueda_negocios')
    .limit(20);
  
  if (errorHistoricos) {
    console.error('❌ Error:', errorHistoricos.message);
    return;
  }
  
  console.log(`📊 Total anuncios históricos encontrados: ${historicos?.length || 0}\n`);
  
  if (historicos && historicos.length > 0) {
    console.log('📝 Ejemplos de anuncios cargados:\n');
    historicos.slice(0, 5).forEach((adiso, i) => {
      console.log(`${i + 1}. ${adiso.titulo?.substring(0, 60)}...`);
      console.log(`   Categoría: ${adiso.categoria} | Distrito: ${adiso.distrito || 'N/A'} | Edición: ${adiso.edicion_numero || 'N/A'}`);
      console.log('');
    });
  }
  
  // Estadísticas
  const { count: total } = await supabase
    .from('adisos')
    .select('*', { count: 'exact', head: true })
    .eq('fuente_original', 'rueda_negocios');
  
  console.log(`📈 Total en BD: ${total || 0} anuncios históricos`);
}

main().catch(console.error);



