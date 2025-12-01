# 📚 GUÍA COMPLETA: Procesamiento de PDFs de Rueda de Negocios

## 🎯 Resumen del Proceso

1. **Paso 1**: Extraer texto de todos los PDFs (automático, sin IA)
2. **Paso 2**: Generar prompts divididos para 3 LLMs
3. **Paso 3**: Procesar con ChatGPT, Claude y Gemini en paralelo
4. **Paso 4**: Consolidar respuestas de los 3 LLMs
5. **Paso 5**: Cargar a la base de datos

---

## 📋 Prerequisitos

### Tu estructura actual:
```
~/Desktop/Magazines/
├── R2538-del20al26-Junio/          # 32 carpetas con PDFs partidos
│   ├── R2538-del20al26-Junio-1.pdf
│   ├── R2538-del20al26-Junio-2.pdf
│   └── ... (16 páginas)
├── R2539-del27al30-Junio/
│   └── ...
├── R2587-del16al18-Diciembre.pdf   # 52 PDFs completos
├── R2588-del19al25-Diciembre.pdf
└── ... (+ ~50 PDFs más por descargar)
```

### LLMs disponibles:
- ✅ ChatGPT 5 High (versión de pago)
- ✅ Claude Opus 4.5 (versión de pago)
- ✅ Gemini 3 Pro (versión de pago)

---

## 🚀 PASO 1: Extraer Texto de PDFs

### Opción A: Procesar TODO el directorio Magazines (recomendado)

```bash
cd /home/jairoprodev/proyectos/adis.lat

# Procesar TODAS las carpetas y PDFs del directorio Magazines
npx ts-node scripts/extraer-texto-pdfs.ts --todo ~/Desktop/Magazines --salida ./output/texto-extraido
```

Este comando:
- Escanea el directorio `~/Desktop/Magazines`
- Procesa las 32 carpetas con PDFs partidos
- Procesa los 52 PDFs completos
- Guarda el resultado en `./output/texto-extraido/texto-extraido.json`

### Opción B: Procesar por partes

Si prefieres procesar por partes (por si hay errores):

```bash
# Solo una carpeta específica
npx ts-node scripts/extraer-texto-pdfs.ts --carpeta ~/Desktop/Magazines/R2538-del20al26-Junio

# Solo un PDF específico
npx ts-node scripts/extraer-texto-pdfs.ts --pdf ~/Desktop/Magazines/R2587-del16al18-Diciembre.pdf
```

### Resultado esperado:

```
./output/texto-extraido/
└── texto-extraido.json  # ~20-50 MB dependiendo del contenido
```

El JSON tendrá esta estructura:
```json
{
  "fechaExtraccion": "2025-12-01T...",
  "totalEdiciones": 84,
  "totalPaginas": 1344,
  "totalCaracteres": 15000000,
  "ediciones": [
    {
      "info": {
        "numeroEdicion": "2538",
        "fechaPublicacion": "2024-06-20"
      },
      "paginas": [
        {
          "edicion": "2538",
          "pagina": 1,
          "texto": "... contenido de la página ...",
          "caracteres": 5000
        }
      ]
    }
  ]
}
```

---

## 🎨 PASO 2: Generar Prompts para LLMs

Una vez extraído el texto, genera los prompts divididos:

```bash
npx ts-node scripts/generar-prompts-llm.ts ./output/texto-extraido/texto-extraido.json ./output/prompts
```

Esto creará:

```
./output/prompts/
├── INSTRUCCIONES.md       # Guía de uso
├── chatgpt/               # ~450 prompts para ChatGPT
│   ├── INDICE.md
│   ├── R2538_pag01.txt
│   ├── R2538_pag02.txt
│   └── ...
├── claude/                # ~450 prompts para Claude
│   ├── INDICE.md
│   └── ...
├── gemini/                # ~450 prompts para Gemini
│   ├── INDICE.md
│   └── ...
└── respuestas/            # Aquí guardarás las respuestas
    ├── chatgpt/
    ├── claude/
    └── gemini/
```

---

## 🤖 PASO 3: Procesar con los 3 LLMs en Paralelo

### División del trabajo:
- **ChatGPT**: Procesa carpeta `chatgpt/`
- **Claude**: Procesa carpeta `claude/`
- **Gemini**: Procesa carpeta `gemini/`

### Proceso para ChatGPT (GPT-5 High):

1. Abre https://chat.openai.com
2. Para cada archivo `.txt` en `output/prompts/chatgpt/`:
   - Abre el archivo
   - Copia TODO el contenido
   - Pégalo en ChatGPT
   - Espera la respuesta JSON
   - Copia la respuesta
   - Guárdala en `output/prompts/respuestas/chatgpt/R2538_pag01.json` (mismo nombre, extensión .json)

### Proceso para Claude (Opus 4.5):

1. Abre https://claude.ai
2. Para cada archivo `.txt` en `output/prompts/claude/`:
   - Mismo proceso que ChatGPT
   - Guarda en `output/prompts/respuestas/claude/`

### Proceso para Gemini (3 Pro):

1. Abre https://gemini.google.com
2. Para cada archivo `.txt` en `output/prompts/gemini/`:
   - Mismo proceso
   - Guarda en `output/prompts/respuestas/gemini/`

### Tips para acelerar:

1. **Abre los 3 LLMs en pestañas diferentes** y procesa en paralelo
2. **Usa múltiples ventanas** si tu navegador lo permite
3. **Procesa en batches**: Algunos LLMs permiten procesar varios prompts seguidos
4. **Usa la API si tienes acceso**: Es más rápido que copiar/pegar

### Ejemplo de respuesta esperada de cada LLM:

```json
{
  "edicion": "2538",
  "pagina": 1,
  "fecha_publicacion": "2024-06-20",
  "anuncios": [
    {
      "titulo": "ALQUILO DEPARTAMENTO AMPLIO",
      "descripcion": "De 3 dormitorios, sala - comedor, 2 baños...",
      "categoria": "inmuebles",
      "contactos": [
        {"tipo": "telefono", "valor": "992619842", "principal": true},
        {"tipo": "telefono", "valor": "987792972", "principal": false}
      ],
      "ubicacion": "Wanchaq, Cusco, Cusco",
      "tamaño_visual": "mediano",
      "precio": null
    }
  ]
}
```

---

## 📦 PASO 4: Consolidar Respuestas

Una vez que tengas TODAS las respuestas JSON guardadas:

```bash
npx ts-node scripts/consolidar-respuestas.ts ./output/prompts ./output/anuncios-consolidados.json
```

Esto:
- Lee todas las respuestas de `chatgpt/`, `claude/`, `gemini/`
- Valida y normaliza los datos
- Elimina duplicados
- Genera un archivo consolidado listo para cargar

### Resultado:

```json
{
  "fechaConsolidacion": "2025-12-01T...",
  "totalAnuncios": 45000,
  "porCategoria": {
    "empleos": 12000,
    "inmuebles": 8000,
    "servicios": 15000,
    ...
  },
  "anuncios": [
    {
      "id": "rn-2538-1-0-abc123",
      "titulo": "...",
      "descripcion": "...",
      "es_historico": true,
      "esta_activo": false,
      ...
    }
  ]
}
```

---

## 💾 PASO 5: Cargar a la Base de Datos

Primero, ejecuta las migraciones SQL en Supabase (si no lo has hecho):

```sql
-- En Supabase SQL Editor, ejecuta:
-- 1. supabase-eliminar-pruebas.sql (elimina los 29 anuncios de prueba)
-- 2. supabase-anuncios-historicos.sql (agrega campos necesarios)
```

Luego, carga los anuncios:

```bash
npx ts-node scripts/cargar-anuncios-masivo.ts ./output/anuncios-consolidados.json
```

---

## 📊 Estimación de Tiempo

| Paso | Tiempo estimado |
|------|-----------------|
| Extraer texto | 5-15 minutos |
| Generar prompts | 1-2 minutos |
| Procesar con LLMs | 4-8 horas (paralelo) |
| Consolidar | 2-5 minutos |
| Cargar a BD | 10-30 minutos |

**Total: ~5-9 horas** (la mayoría es copiar/pegar a los LLMs)

### Para acelerar el proceso:

1. **Usa las APIs** de los LLMs si tienes acceso
2. **Procesa en batches grandes** (5-10 páginas por mensaje)
3. **Usa 3 dispositivos** o pestañas para procesar en paralelo

---

## 🔧 Troubleshooting

### Error: "pdf-parse no está instalado"
```bash
npm install pdf-parse
```

### Error: "Cannot find module 'ts-node'"
```bash
npm install -D ts-node
```

### Error al extraer texto de un PDF
- Verifica que el PDF no esté corrupto
- Prueba abrirlo manualmente
- Si es un PDF escaneado (imagen), necesitarás OCR

### LLM no devuelve JSON válido
- Vuelve a intentar el prompt
- Agrega al final: "Responde SOLO con JSON válido"
- Verifica que el texto no esté truncado

### Anuncios duplicados
- El script de consolidación maneja duplicados automáticamente
- Si aún hay duplicados, revisa las respuestas manualmente

---

## 📁 Estructura Final de Archivos

```
/home/jairoprodev/proyectos/adis.lat/
├── scripts/
│   ├── extraer-texto-pdfs.ts       # Extrae texto
│   ├── generar-prompts-llm.ts      # Genera prompts
│   ├── consolidar-respuestas.ts    # Consolida respuestas
│   ├── cargar-anuncios-masivo.ts   # Carga a BD
│   └── GUIA-PROCESO-COMPLETO.md    # Esta guía
├── output/
│   ├── texto-extraido/
│   │   └── texto-extraido.json
│   ├── prompts/
│   │   ├── chatgpt/
│   │   ├── claude/
│   │   ├── gemini/
│   │   └── respuestas/
│   └── anuncios-consolidados.json
└── ...
```

---

## ✅ Checklist

- [ ] Descargar los ~50 PDFs restantes
- [ ] Ejecutar extracción de texto
- [ ] Generar prompts para LLMs
- [ ] Procesar con ChatGPT (~450 páginas)
- [ ] Procesar con Claude (~450 páginas)
- [ ] Procesar con Gemini (~450 páginas)
- [ ] Consolidar todas las respuestas
- [ ] Ejecutar migraciones SQL
- [ ] Cargar anuncios a la base de datos
- [ ] Verificar en la plataforma

---

## 🎉 Resultado Final

Una vez completado, tendrás:
- **~45,000+ anuncios históricos** en tu plataforma
- Organizados por **categoría**, **fecha** y **ubicación**
- Con **scroll infinito** para navegación fluida
- Listos para **búsqueda semántica** con el chatbot
- Disponibles vía **API** para otras plataformas

¡Éxito! 🚀

