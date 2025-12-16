# Plan de Mejora del Chatbot - Opción con IA (OpenAI)

## Opción 2: Usar OpenAI GPT para NLU (Mejor Precisión)

### Ventajas
✅ Entiende lenguaje natural complejo
✅ Extrae intenciones y entidades automáticamente
✅ Maneja sinónimos y contexto
✅ Mejora continua sin código

### Desventajas
❌ Costo por uso (~$0.002 por consulta)
❌ Latencia adicional (1-2 segundos)
❌ Dependencia de servicio externo

### Implementación

#### 1. Crear Función de Análisis con OpenAI

```typescript
// lib/chatbot-nlu.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface IntencionBusqueda {
  intencion: 'buscar' | 'publicar' | 'otro';
  terminos: string[];
  categoria?: Categoria;
  ubicacion?: string;
  filtros?: {
    precioMin?: number;
    precioMax?: number;
    habitaciones?: number;
  };
}

export async function analizarMensaje(mensaje: string): Promise<IntencionBusqueda> {
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `Eres un asistente que analiza consultas de búsqueda de anuncios clasificados.
Extrae:
- intencion: 'buscar' o 'publicar' u 'otro'
- terminos: palabras clave importantes (sin palabras de relleno)
- categoria: empleos, inmuebles, vehiculos, servicios, productos, eventos, negocios, comunidad (si se menciona)
- ubicacion: ciudad o zona mencionada
- filtros: precio, habitaciones, etc.

Responde SOLO con JSON válido.`
      },
      {
        role: "user",
        content: mensaje
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 200
  });

  const resultado = JSON.parse(completion.choices[0].message.content || '{}');
  return resultado;
}
```

#### 2. Integrar en el Endpoint

```typescript
// app/api/chatbot/procesar/route.ts
import { analizarMensaje } from '@/lib/chatbot-nlu';

export async function POST(request: NextRequest) {
  const { mensaje } = await request.json();
  
  // Usar OpenAI para analizar
  const analisis = await analizarMensaje(mensaje);
  
  if (analisis.intencion === 'buscar') {
    // Buscar con los términos y filtros extraídos
    const resultados = await buscarConFiltros({
      terminos: analisis.terminos,
      categoria: analisis.categoria,
      ubicacion: analisis.ubicacion,
      filtros: analisis.filtros
    });
    
    return NextResponse.json({
      intencion: 'buscar',
      respuesta: generarRespuestaBusqueda(resultados, analisis),
      resultados
    });
  }
  
  // ... resto del código
}
```

#### 3. Búsqueda Mejorada con Filtros

```typescript
async function buscarConFiltros(params: {
  terminos: string[];
  categoria?: Categoria;
  ubicacion?: string;
  filtros?: any;
}) {
  let query = supabase
    .from('adisos')
    .select('*')
    .eq('esta_activo', true);
  
  if (params.categoria) {
    query = query.eq('categoria', params.categoria);
  }
  
  if (params.ubicacion) {
    query = query.ilike('ubicacion', `%${params.ubicacion}%`);
  }
  
  // Buscar términos en título y descripción
  if (params.terminos.length > 0) {
    const busqueda = params.terminos.join(' | ');
    query = query.textSearch('titulo_descripcion_fts', busqueda, {
      type: 'websearch',
      config: 'spanish'
    });
  }
  
  const { data } = await query.limit(10);
  return data || [];
}
```

### Costos Estimados

- **Modelo**: GPT-3.5-turbo
- **Costo**: ~$0.002 por consulta
- **100 consultas/día**: $0.20/día = $6/mes
- **1000 consultas/día**: $2/día = $60/mes

### Alternativa: Usar Modelo Local (Gratis)

Si quieres evitar costos, puedes usar un modelo local como:
- **Ollama** con Llama 3.1
- **Transformers.js** en el navegador
- **BERT** para clasificación

Pero requiere más setup y recursos del servidor.

## Opción 3: Híbrida (Recomendada)

Combinar ambas:

1. **Reglas básicas** para casos comunes (gratis, rápido)
2. **OpenAI** solo para casos complejos o ambiguos

```typescript
async function procesarMensaje(mensaje: string) {
  // Intentar con reglas básicas primero
  const analisisBasico = extraerTerminosBusqueda(mensaje);
  
  // Si es claro y simple, usar búsqueda directa
  if (analisisBasico.confianza > 0.8) {
    return buscarConFiltros(analisisBasico);
  }
  
  // Si es ambiguo, usar OpenAI
  const analisisIA = await analizarMensaje(mensaje);
  return buscarConFiltros(analisisIA);
}
```

### Ventajas del Enfoque Híbrido
✅ Bajo costo (solo usa IA cuando es necesario)
✅ Rápido para casos simples
✅ Preciso para casos complejos
✅ Escalable

## Recomendación Final

**Para empezar**: Implementa la **Opción 1** (mejora rápida sin IA)
- Costo: $0
- Tiempo: 1-2 horas
- Mejora: 60-70% de precisión

**Si funciona bien**: Agrega **Opción 3** (híbrida)
- Costo: ~$10-20/mes
- Tiempo: 2-3 horas adicionales
- Mejora: 90-95% de precisión

¿Quieres que implemente la Opción 1 ahora?
