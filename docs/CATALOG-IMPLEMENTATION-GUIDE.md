# 🚀 CATALOG AI - IMPLEMENTATION GUIDE

## Status: MVP READY FOR TESTING

---

## ✅ WHAT'S BEEN BUILT

### 1. **Database Schema** ✅
- **File**: `sql/create_catalog_ai_schema.sql`
- **Features**:
  - Product variants (colors, sizes, etc.)
  - Dynamic attributes per category
  - Multi-source image tracking
  - Import session tracking
  - Duplicate candidate management
  - Full-text search ready
  - Row Level Security (RLS) policies

### 2. **AI-Powered Excel Importer** ✅
- **Endpoint**: `POST /api/catalog/import/excel`
- **Capabilities**:
  - Auto-detect column meanings (AI)
  - Normalize messy product data
  - Detect duplicates (SKU + fuzzy matching)
  - Extract attributes from text
  - Batch processing
  - Error handling & logging

### 3. **Core AI Libraries** ✅

#### a) `ExcelParser` (`lib/ai/excel-parser.ts`)
- Parse Excel (.xlsx, .xls) and CSV files
- Handle quoted fields, empty rows
- Auto-detect file type

#### b) `ProductNormalizer` (`lib/ai/product-normalizer.ts`)
- AI column mapping (GPT-4)
- Fallback keyword detection
- Extract category/brand from title
- Type-safe value parsing

#### c) `DuplicateDetector` (`lib/ai/duplicate-detector.ts`)
- Multi-strategy detection:
  - Exact SKU matching (100%)
  - Fuzzy title matching (Levenshtein)
  - Brand comparison
  - Attribute similarity
- Weighted scoring (0.0 - 1.0)
- Threshold-based decisions

#### d) `ProductImageManager` (`lib/ai/image-manager.ts`)
- Web search (Bing Visual Search)
- AI generation (DALL-E 3) for generics
- Download & re-host to Supabase
- Image optimization (Sharp)
- Category placeholders

---

## 📦 DEPENDENCIES TO INSTALL

Run this command to install required packages:

```bash
npm install xlsx openai fastest-levenshtein sharp @supabase/ssr
```

### Package breakdown:
- `xlsx`: Excel/CSV parsing
- `openai`: GPT-4 for AI features
- `fastest-levenshtein`: Fast fuzzy string matching
- `sharp`: Image processing & optimization
- `@supabase/ssr`: Server-side Supabase client

---

## 🔐 ENVIRONMENT VARIABLES

Add these to your `.env.local`:

```env
# OpenAI (para AI features)
OPENAI_API_KEY=sk-...

# Bing Search (para image search)
BING_SEARCH_API_KEY=your-bing-key

# Supabase (ya deberías tenerlo)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### How to get API keys:

1. **OpenAI**: https://platform.openai.com/api-keys
   - Create account → API Keys → Create new
   - Cost: ~$0.01 per 100 products (GPT-4o-mini)

2. **Bing Visual Search**: https://portal.azure.com
   - Create "Bing Search v7" resource
   - Free tier: 1,000 searches/month
   - Alternative: Google Custom Search (similar pricing)

---

## 🗄️ DATABASE SETUP

### Step 1: Run the schema migration

In Supabase SQL Editor, execute:

```sql
-- File: sql/create_catalog_ai_schema.sql
-- This creates all tables, indexes, triggers, and RLS policies
```

### Step 2: Create Supabase Storage bucket

```sql
-- In Supabase Dashboard → Storage → New Bucket
-- Name: catalog-images
-- Public: Yes (for product images)
```

Or via SQL:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('catalog-images', 'catalog-images', true);

-- Allow public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'catalog-images' );

-- Allow authenticated users to upload
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'catalog-images' AND auth.role() = 'authenticated' );
```

---

## 🧪 TESTING THE IMPORT

### Test with Postman/Insomnia:

```http
POST /api/catalog/import/excel
Content-Type: multipart/form-data

file: [your-excel-file.xlsx]
```

### Test with cURL:

```bash
curl -X POST http://localhost:3000/api/catalog/import/excel \
  -H "Cookie: your-supabase-auth-cookie" \
  -F "file=@catalogo-ferreteria.xlsx"
```

### Expected Response:

```json
{
  "success": true,
  "sessionId": "uuid-here",
  "stats": {
    "totalRows": 150,
    "productsToCreate": 140,
    "duplicatesFound": 10,
    "errors": 0
  },
  "columnMapping": {
    "Nombre Producto": "title",
    "Precio S/": "price",
    "Código": "sku",
    "Marca": "brand",
    "Diámetro": "attributes.diameter"
  },
  "needsReview": true,
  "duplicates": [
    {
      "newProduct": { "title": "TUBO PVC 2\"", "price": 15.50 },
      "existingProduct": { "title": "Tubería PVC 2 pulgadas", "price": 15.00 },
      "score": 0.87,
      "reasons": ["title_high_similarity", "brand_match"]
    }
  ]
}
```

---

## 🎨 NEXT STEPS: BUILD THE UI

### 1. Import Page (`/mi-negocio/catalogo/import`)

Create a drag-and-drop file uploader:

```tsx
// app/mi-negocio/catalogo/import/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ImportPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [results, setResults] = useState<any>(null);

    const handleUpload = async () => {
        if (!file) return;
        
        setUploading(true);
        
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/catalog/import/excel', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        setResults(data);
        setUploading(false);
    };

    return (
        <div className="p-8">
            <h1>Importar Catálogo</h1>
            
            {/* File Dropzone */}
            <div className="border-2 border-dashed p-8 text-center">
                <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <button onClick={handleUpload} disabled={uploading}>
                    {uploading ? '🤖 Procesando...' : 'Subir Catálogo'}
                </button>
            </div>
            
            {/* Results */}
            {results && (
                <div className="mt-8">
                    <h2>Resultados</h2>
                    <p>Total productos: {results.stats.totalRows}</p>
                    <p>Para crear: {results.stats.productsToCreate}</p>
                    <p>Duplicados: {results.stats.duplicatesFound}</p>
                    
                    {results.needsReview && (
                        <button>Revisar Duplicados</button>
                    )}
                </div>
            )}
        </div>
    );
}
```

### 2. Duplicate Review Page

Show side-by-side comparison:

```tsx
// app/mi-negocio/catalogo/duplicates/[sessionId]/page.tsx
// Fetch duplicate_candidates from DB
// Display: New Product | Existing Product | Actions
// Actions: Merge / Keep Both / Skip
```

### 3. Product Editor Enhancement

Add support for:
- Variants management
- Dynamic attributes based on category
- Multiple image upload

---

## 📊 USAGE COST ESTIMATES

Based on 500 products in a single import:

| Service | Usage | Cost |
|---------|-------|------|
| OpenAI GPT-4o-mini | Column mapping + normalization | ~$2 |
| Bing Visual Search | 500 searches × 3 images each | ~$10 |
| Supabase Storage | 1,500 images × 200KB | ~$0.50 |
| **Total per import** | | **~$12.50** |

**Client saves**: 20+ hours of manual work ($400+ at $20/hr)

---

## 🔄 WORKFLOW EXAMPLE

### Distribuidora Ferretera Real Use Case:

1. **Cliente recibe catálogo de proveedor** (PDF)
   - 50 páginas, 200 productos

2. **Extrae datos a Excel** (manual o AI)
   - Nombre, Código, Precio, Marca

3. **Sube Excel a plataforma**
   ```
   POST /api/catalog/import/excel
   ```

4. **IA procesa**:
   - Detecta columnas ✅
   - Normaliza nombres ✅
   - Encuentra 15 duplicados ✅
   - Descarga imágenes de web ✅

5. **Cliente revisa duplicados**:
   - "TUBO PVC 2\"" vs "Tubería PVC 2 pulgadas"
   - Decisión: **Merge** (actualizar precio)

6. **185 productos nuevos creados**
   - 15 actualizados
   - Total catalogados: 200

7. **Tiempo total: 10 minutos**
   - vs. 5 horas manual tradicional

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Install dependencies: `npm install xlsx openai fastest-levenshtein sharp`
- [ ] Add API keys to `.env.local`
- [ ] Run database migration (`create_catalog_ai_schema.sql`)
- [ ] Create Supabase Storage bucket (`catalog-images`)
- [ ] Test import endpoint with sample Excel
- [ ] Build Import UI page
- [ ] Build Duplicate Review UI
- [ ] Test end-to-end flow
- [ ] Monitor costs in first week
- [ ] Collect user feedback

---

## 🎯 MVP vs ROADMAP

### ✅ MVP (Current)
- Excel import with AI
- Duplicate detection
- Web image search
- Basic normalization

### 🔜 V2 (Future - 2 weeks)
- PDF extraction with Vision AI
- Photo OCR (catálogos impresos)
- Bulk editing interface
- Auto-categorization

### 🔮 V3 (Future - 4 weeks)
- Multi-language support
- Pricing intelligence (suggest based on competition)
- Inventory sync with external systems
- Analytics dashboard

---

## 📞 SUPPORT

If you encounter issues:

1. Check `.env.local` has all API keys
2. Verify Supabase Storage bucket exists
3. Check browser console for errors
4. Test API endpoint directly (Postman)
5. Review import_sessions table for logs

---

**Status**: 🟢 READY TO TEST

**Next Action**: Install dependencies and test the import!

```bash
npm install xlsx openai fastest-levenshtein sharp @supabase/ssr
```
