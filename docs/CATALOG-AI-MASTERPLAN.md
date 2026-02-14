# 🏗️ CATALOG AI MASTERPLAN
## Sistema Inteligente de Gestión de Catálogos para Distribuidoras

---

## 📋 ANÁLISIS DEL PROBLEMA

### Caso Real: Distribuidora Ferretera
- **500+ productos** con múltiples variantes
- **Fuentes fragmentadas**: Excel, PDF, Canva, catálogos impresos
- **Inconsistencias**: productos duplicados, información incompleta
- **Desorganización**: cada proveedor trae su propio catálogo
- **Complejidad de atributos**: medidas, colores, voltaje, watts, etc.

### Desafíos Críticos
1. **Deduplicación inteligente** (ej: "Tubo PVC 2 pulgadas" vs "TUBO DE 2\"" vs "Tubería 2in")
2. **Variantes vs Productos separados** (¿Rojo/Azul/Verde son 3 productos o 1 con variantes?)
3. **Atributos dinámicos** (un cable tiene voltaje, una tubería no)
4. **Imágenes dispersas** (algunas en PDF, otras faltantes)
5. **Consolidación de fuentes** (merger de Excel + PDF + fotos sin perder datos)

---

## 🎯 SOLUCIÓN PROPUESTA

### Arquitectura en 5 Capas

```
┌─────────────────────────────────────────────────┐
│  1. INGESTA MULTI-FORMATO (AI-Powered)         │
│     Excel | PDF | Canva | Fotos | API          │
└─────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────┐
│  2. NORMALIZACIÓN & DEDUPLICACIÓN (AI)         │
│     - Text Embeddings                           │
│     - Fuzzy Matching                            │
│     - SKU Detection                             │
└─────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────┐
│  3. EXTRACCIÓN DE ATRIBUTOS (AI)               │
│     - Vision AI (imágenes)                      │
│     - NLP (descripciones)                       │
│     - Structured Data Extraction                │
└─────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────┐
│  4. GESTIÓN DE IMÁGENES (Hybrid)               │
│     1. Extracción de PDFs/Canva                │
│     2. Web Scraping (Google/Bing)              │
│     3. AI Generation (DALL-E/Stable Diffusion) │
│     4. Manual Upload (fallback)                │
└─────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────┐
│  5. CATÁLOGO UNIFICADO & PUBLICACIÓN           │
│     - Búsqueda semántica                        │
│     - Filtros dinámicos                         │
│     - Variantes consolidadas                    │
└─────────────────────────────────────────────────┘
```

---

## 🗄️ ARQUITECTURA DE BASE DE DATOS

### Schema Mejorado

```sql
-- PRODUCTO MAESTRO
CREATE TABLE catalog_products (
    id UUID PRIMARY KEY,
    business_profile_id UUID REFERENCES business_profiles(id),
    
    -- Identificación
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE,
    sku VARCHAR(100), -- Código del producto
    barcode VARCHAR(100),
    
    -- Clasificación
    category_id UUID REFERENCES product_categories(id),
    subcategory VARCHAR(100),
    brand VARCHAR(100),
    supplier VARCHAR(200),
    
    -- Descripción base
    description TEXT,
    short_description VARCHAR(500),
    
    -- Pricing
    base_price DECIMAL(10,2),
    compare_at_price DECIMAL(10,2),
    cost DECIMAL(10,2), -- Para calcular margen
    
    -- Estado
    status VARCHAR(20) DEFAULT 'draft',
    stock_status VARCHAR(20),
    is_featured BOOLEAN DEFAULT false,
    
    -- Metadata de ingesta
    import_source VARCHAR(50), -- 'excel', 'pdf', 'canva', 'photo', 'manual'
    import_source_file VARCHAR(500),
    import_confidence DECIMAL(3,2), -- 0.00 - 1.00
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Full-text search
    search_vector TSVECTOR
);

-- VARIANTES DE PRODUCTO
CREATE TABLE product_variants (
    id UUID PRIMARY KEY,
    product_id UUID REFERENCES catalog_products(id) ON DELETE CASCADE,
    
    -- Identificadores
    variant_title VARCHAR(200), -- "Rojo - Grande"
    sku VARCHAR(100),
    barcode VARCHAR(100),
    
    -- Atributos específicos de variante
    attributes JSONB, -- {"color": "rojo", "size": "grande", "voltage": "220V"}
    
    -- Pricing (puede override el del producto maestro)
    price DECIMAL(10,2),
    compare_at_price DECIMAL(10,2),
    cost DECIMAL(10,2),
    
    -- Inventario
    stock_quantity INTEGER DEFAULT 0,
    stock_status VARCHAR(20),
    
    -- Media
    image_urls TEXT[],
    primary_image_url TEXT,
    
    -- Orden de display
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CATEGORÍAS JERÁRQUICAS
CREATE TABLE product_categories (
    id UUID PRIMARY KEY,
    business_profile_id UUID REFERENCES business_profiles(id),
    
    parent_id UUID REFERENCES product_categories(id),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200),
    description TEXT,
    
    -- Template de atributos para esta categoría
    attribute_template JSONB,
    -- Ej: {"diameter": "number", "length": "number", "material": "select"}
    
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ATRIBUTOS DINÁMICOS
CREATE TABLE product_attributes (
    id UUID PRIMARY KEY,
    product_id UUID REFERENCES catalog_products(id) ON DELETE CASCADE,
    
    attribute_key VARCHAR(100) NOT NULL, -- "diameter", "voltage", etc.
    attribute_value TEXT NOT NULL,
    attribute_type VARCHAR(20), -- 'text', 'number', 'select', 'multiselect'
    attribute_unit VARCHAR(20), -- 'm', 'cm', 'V', 'W', etc.
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(product_id, attribute_key)
);

-- IMÁGENES DEL PRODUCTO
CREATE TABLE product_images (
    id UUID PRIMARY KEY,
    product_id UUID REFERENCES catalog_products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    
    url TEXT NOT NULL,
    alt_text VARCHAR(500),
    
    -- Metadata de origen
    source VARCHAR(50), -- 'upload', 'extracted', 'web_search', 'ai_generated'
    source_url TEXT, -- URL original si vino de web
    
    -- Estado de procesamiento
    is_processed BOOLEAN DEFAULT false,
    is_primary BOOLEAN DEFAULT false,
    
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRACKING DE IMPORTS
CREATE TABLE import_sessions (
    id UUID PRIMARY KEY,
    business_profile_id UUID REFERENCES business_profiles(id),
    
    source_type VARCHAR(50), -- 'excel', 'pdf', 'canva', 'photo'
    source_file_name VARCHAR(500),
    source_file_url TEXT,
    
    status VARCHAR(20), -- 'processing', 'completed', 'failed', 'review_needed'
    
    -- Estadísticas
    total_rows INTEGER,
    products_created INTEGER DEFAULT 0,
    products_updated INTEGER DEFAULT 0,
    duplicates_found INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    
    -- Resultados detallados
    processing_log JSONB,
    duplicate_candidates JSONB, -- Para revisión manual
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- DUPLICADOS DETECTADOS (Para revisión)
CREATE TABLE duplicate_candidates (
    id UUID PRIMARY KEY,
    import_session_id UUID REFERENCES import_sessions(id),
    
    new_product_data JSONB, -- El producto entrante
    existing_product_id UUID REFERENCES catalog_products(id),
    
    similarity_score DECIMAL(3,2), -- 0.00 - 1.00
    match_reasons JSONB, -- ["title_match", "sku_match", "description_similar"]
    
    resolution VARCHAR(20), -- 'merge', 'keep_both', 'skip_new', 'pending'
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🤖 PIPELINE DE IA - COMPONENTES

### 1. INGESTA MULTI-FORMATO

#### A. Excel/CSV Parser
```typescript
// API Endpoint: POST /api/catalog/import/excel
async function importFromExcel(file: File, businessId: string) {
    // 1. Parse Excel
    const rows = parseExcel(file);
    
    // 2. AI Column Mapping (detectar qué columna es qué)
    const columnMapping = await detectColumns(rows[0]);
    // Detecta: "Nombre Producto" → title, "Precio S/" → price, etc.
    
    // 3. Normalizar cada fila
    const products = [];
    for (const row of rows.slice(1)) {
        const normalized = await normalizeProduct(row, columnMapping);
        products.push(normalized);
    }
    
    // 4. Deduplication check
    const withDuplicates = await checkDuplicates(products, businessId);
    
    return {
        sessionId: uuid(),
        products: withDuplicates,
        needsReview: withDuplicates.filter(p => p.duplicateScore > 0.7).length
    };
}
```

#### B. PDF Extractor (Vision + Text)
```typescript
// API Endpoint: POST /api/catalog/import/pdf
async function importFromPDF(file: File, businessId: string) {
    // 1. Extract text + images
    const pdfData = await extractPDFContent(file);
    
    // 2. Detect tables usando Vision AI
    const tables = await detectTables(pdfData.pages);
    
    // 3. Extract product images
    const images = await extractProductImages(pdfData.images);
    
    // 4. Parse tables con AI
    const products = await parseProductTables(tables);
    
    // 5. Match images to products
    const productsWithImages = await matchImagesToProducts(products, images);
    
    return productsWithImages;
}
```

#### C. Photo OCR (Catálogos impresos)
```typescript
// API Endpoint: POST /api/catalog/import/photo
async function importFromPhoto(photo: File, businessId: string) {
    // 1. OCR + Vision AI
    const ocrResult = await processImageWithVision(photo);
    
    // 2. Structured extraction
    const extracted = await extractStructuredData(ocrResult);
    // Prompt: "Extract product catalog data: name, price, specs"
    
    // 3. Normalize
    const products = await normalizeProducts(extracted);
    
    return products;
}
```

### 2. NORMALIZACIÓN & DEDUPLICACIÓN

```typescript
async function checkDuplicates(newProduct: Product, businessId: string) {
    // 1. Buscar por SKU exacto
    if (newProduct.sku) {
        const skuMatch = await db.query(
            'SELECT * FROM catalog_products WHERE sku = $1',
            [newProduct.sku]
        );
        if (skuMatch.length > 0) {
            return { isDuplicate: true, match: skuMatch[0], score: 1.0, reason: 'sku' };
        }
    }
    
    // 2. Text embeddings similarity
    const embedding = await generateEmbedding(newProduct.title);
    const similar = await db.query(`
        SELECT *, 
               1 - (embedding <=> $1::vector) as similarity
        FROM catalog_products
        WHERE business_profile_id = $2
          AND 1 - (embedding <=> $1::vector) > 0.7
        ORDER BY similarity DESC
        LIMIT 5
    `, [embedding, businessId]);
    
    // 3. Fuzzy matching en título
    for (const candidate of similar) {
        const fuzzyScore = fuzzyMatch(newProduct.title, candidate.title);
        
        if (fuzzyScore > 0.85) {
            return {
                isDuplicate: true,
                match: candidate,
                score: fuzzyScore,
                reason: 'title_fuzzy'
            };
        }
    }
    
    return { isDuplicate: false, score: 0 };
}
```

### 3. EXTRACCIÓN DE ATRIBUTOS

```typescript
async function extractAttributes(product: Product, categoryTemplate: any) {
    const prompt = `
Producto: ${product.title}
Descripción: ${product.description}
Categoría: ${product.category}

Extrae los siguientes atributos si están disponibles:
${JSON.stringify(categoryTemplate, null, 2)}

Devuelve JSON con valores encontrados.
`;
    
    const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
    });
    
    return JSON.parse(response.choices[0].message.content);
}

// Ejemplo para "Tubería":
// Input: "TUBO PVC 2 PULGADAS CLASE 10 - 6 METROS"
// Output: {
//   "diameter": "2",
//   "diameter_unit": "pulgadas",
//   "material": "PVC",
//   "class": "10",
//   "length": "6",
//   "length_unit": "metros"
// }
```

### 4. GESTIÓN DE IMÁGENES - ESTRATEGIA HÍBRIDA

```typescript
async function getProductImages(product: Product): Promise<string[]> {
    const images: string[] = [];
    
    // 1. PRIORIDAD 1: Imágenes extraídas de la fuente original
    if (product.importSource === 'pdf' && product.extractedImages) {
        images.push(...product.extractedImages);
    }
    
    // 2. PRIORIDAD 2: Búsqueda web automatizada
    if (images.length === 0) {
        const webImages = await searchProductImages({
            query: `${product.brand} ${product.title}`,
            category: product.category
        });
        images.push(...webImages.slice(0, 3));
    }
    
    // 3. PRIORIDAD 3: Generación con IA (solo para productos genéricos)
    if (images.length === 0 && isGenericProduct(product)) {
        const aiImage = await generateProductImage({
            description: product.description,
            style: 'product photography, white background'
        });
        images.push(aiImage);
    }
    
    // 4. FALLBACK: Placeholder con categoría
    if (images.length === 0) {
        images.push(getCategoryPlaceholder(product.category));
    }
    
    return images;
}

async function searchProductImages(query: string): Promise<string[]> {
    // Opción A: Google Custom Search API
    const googleResults = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${query}&searchType=image&num=5`
    );
    
    // Opción B: Bing Visual Search (más barato)
    const bingResults = await fetch(
        `https://api.bing.microsoft.com/v7.0/images/search?q=${query}&count=5`,
        { headers: { 'Ocp-Apim-Subscription-Key': BING_API_KEY } }
    );
    
    // Descargar y re-hostear en Supabase Storage
    const images = await downloadAndUpload(results);
    return images;
}
```

---

## 🎨 UI/UX - DASHBOARD DE GESTIÓN

### Flujo de Usuario

```
1. IMPORTACIÓN
   ┌──────────────────────────────────┐
   │  Subir Archivo                   │
   │  [Excel] [PDF] [📷 Foto]         │
   └──────────────────────────────────┘
              ↓
   ┌──────────────────────────────────┐
   │  🤖 IA Procesando...             │
   │  ▓▓▓▓▓▓▓▓░░░░ 65%               │
   │  • Extrayendo datos              │
   │  • Detectando duplicados         │
   │  • Buscando imágenes             │
   └──────────────────────────────────┘
              ↓
2. REVISIÓN DE DUPLICADOS
   ┌──────────────────────────────────┐
   │  ⚠️ 12 duplicados detectados     │
   │                                  │
   │  Nuevo: TUBO PVC 2"              │
   │  Similar a: Tubería PVC 2 pulg   │
   │  Confianza: 87%                  │
   │                                  │
   │  [Combinar] [Mantener ambos]    │
   └──────────────────────────────────┘
              ↓
3. EDICIÓN & ENRIQUECIMIENTO
   ┌──────────────────────────────────┐
   │  📦 Tubo PVC 2 Pulgadas          │
   │                                  │
   │  Variantes:                      │
   │  • 3 metros  [Stock: 50]         │
   │  • 6 metros  [Stock: 30]         │
   │                                  │
   │  Atributos:                      │
   │  • Diámetro: 2 pulgadas          │
   │  • Material: PVC                 │
   │  • Clase: 10                     │
   │                                  │
   │  [✨ Completar con IA]           │
   └──────────────────────────────────┘
              ↓
4. PUBLICACIÓN
   ┌──────────────────────────────────┐
   │  ✅ 245 productos listos         │
   │                                  │
   │  [Publicar Todo] [Vista Previa] │
   └──────────────────────────────────┘
```

---

## 🚀 IMPLEMENTACIÓN - FASES

### FASE 1: FUNDACIÓN (Semana 1-2)
- [ ] Migrar schema de DB a la versión extendida
- [ ] API endpoints base (CRUD de productos y variantes)
- [ ] UI básica de gestión de catálogo

### FASE 2: INGESTA EXCEL (Semana 3)
- [ ] Parser de Excel/CSV
- [ ] AI Column Mapping
- [ ] Normalización básica
- [ ] Deduplicación por SKU

### FASE 3: DEDUPLICACIÓN AVANZADA (Semana 4)
- [ ] Text embeddings (OpenAI/Anthropic)
- [ ] Fuzzy matching
- [ ] UI de resolución de duplicados

### FASE 4: PDF EXTRACTION (Semana 5)
- [ ] PDF parser
- [ ] Vision AI para tablas
- [ ] Extracción de imágenes

### FASE 5: PHOTO OCR (Semana 6)
- [ ] Mobile upload flow
- [ ] OCR + Vision AI
- [ ] Structured extraction

### FASE 6: IMÁGENES (Semana 7-8)
- [ ] Extracción desde PDFs
- [ ] Web search integration
- [ ] AI image generation (opcional)
- [ ] Download & re-hosting pipeline

### FASE 7: ATRIBUTOS DINÁMICOS (Semana 9)
- [ ] Category templates
- [ ] AI attribute extraction
- [ ] Filtros dinámicos en frontend

### FASE 8: VARIANTES (Semana 10)
- [ ] Detección automática de variantes
- [ ] UI de gestión de variantes
- [ ] Display en catálogo público

---

## 💰 COSTOS & ROI

### Costos Estimados (por 500 productos)

| Servicio | Uso | Costo |
|----------|-----|-------|
| OpenAI GPT-4 | Normalización (500 productos × 1K tokens) | ~$5 |
| OpenAI Embeddings | Deduplication (500 × 1.5K tokens) | ~$0.50 |
| Vision AI (Google) | PDF/Photo processing (100 páginas) | ~$15 |
| Web Image Search | Bing (500 búsquedas × 3 imgs) | ~$10 |
| Supabase Storage | 1500 imágenes × 200KB | ~$1 |
| **TOTAL** | **Una-vez por importación** | **~$31.50** |

### ROI para el Cliente
- **Tiempo ahorrado**: 40 horas de trabajo manual → $800 (a $20/hr)
- **Reducción de errores**: Menos duplicados, mejor organización
- **Ventas incrementales**: Catálogo profesional aumenta conversión ~15%

---

## 🎯 PRIORIZACIÓN - MVP vs COMPLETO

### MVP (Lo que construimos AHORA - 2 semanas)
1. ✅ Schema de DB extendido
2. ✅ Import desde Excel con AI column mapping
3. ✅ Deduplicación por SKU + título similar
4. ✅ UI de revisión de duplicados
5. ✅ Búsqueda web de imágenes (Bing)
6. ✅ Variantes básicas (manual)

### V2 (Siguiente iteración - 2 semanas)
1. PDF extraction con Vision AI
2. Atributos dinámicos por categoría
3. AI image generation como fallback
4. Búsqueda semántica en catálogo

### V3 (Futuro - 2 semanas)
1. Photo OCR para catálogos impresos
2. Detección automática de variantes
3. Sugerencias de pricing basadas en competencia
4. Analytics de performance por producto

---

## 📊 MÉTRICAS DE ÉXITO

1. **Tasa de deduplicación correcta**: > 90%
2. **Tiempo de importación**: < 5 min para 100 productos
3. **Cobertura de imágenes**: > 80% de productos con imagen
4. **Satisfacción del usuario**: 4.5+/5 en usabilidad

---

## 🔧 STACK TECNOLÓGICO

- **Backend**: Next.js API Routes + Supabase (PostgreSQL + Storage)
- **AI**: OpenAI GPT-4 + Embeddings + Vision
- **Image Search**: Bing Visual Search API
- **PDF Processing**: pdf.js + Tesseract OCR
- **Excel Parsing**: xlsx library
- **Similarity**: pgvector + fuzzball.js

---

**Status**: 📝 PLAN COMPLETO - LISTO PARA EJECUCIÓN
**Next**: Ejecutar FASE 1 (Schema + APIs Base)
