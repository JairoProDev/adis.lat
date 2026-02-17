-- ============================================================
-- AI-POWERED CATALOG SYSTEM - DATABASE SCHEMA
-- ============================================================

-- ============================================================
-- TABLA: catalog_products
-- Productos del catálogo (NO son adisos todavía)
-- ============================================================
CREATE TABLE IF NOT EXISTS catalog_products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_profile_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
  
  -- Información básica (extraída/generada por IA)
  title TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  barcode TEXT,
  
  -- Imágenes (URLs en Supabase Storage)
  -- [{ url, is_primary, ai_enhanced, original_url, enhancement_type }]
  images JSONB DEFAULT '[]',
  
  -- Precio
  price DECIMAL(10, 2),
  compare_at_price DECIMAL(10, 2), -- Precio anterior (descuentos)
  currency TEXT DEFAULT 'PEN',
  
  -- Categorización (IA puede sugerir)
  category TEXT,
  tags TEXT[], -- ["zapatos", "nike", "deportivos"]
  
  -- Atributos dinámicos (extraídos por IA)
  -- { color: "rojo", talla: "42", material: "cuero", marca: "Nike" }
  attributes JSONB DEFAULT '{}',
  
  -- Inventario (opcional)
  stock INTEGER,
  track_inventory BOOLEAN DEFAULT false,
  low_stock_alert INTEGER, -- Alerta cuando stock <= este número
  
  -- SEO (generado por IA)
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT[],
  
  -- Metadata de IA
  ai_metadata JSONB DEFAULT '{}', 
  -- { 
  --   extracted_from: "pdf|photo|excel",
  --   confidence_score: 0.95,
  --   auto_generated: ["title", "description"],
  --   enhanced_images: [0, 2],
  --   source_file_url: "...",
  --   processing_time_ms: 3450
  -- }
  
  -- Estado
  status TEXT DEFAULT 'draft', -- draft|published|archived
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  whatsapp_clicks INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================
-- TABLA: catalog_imports
-- Tracking de importaciones de archivos
-- ============================================================
CREATE TABLE IF NOT EXISTS catalog_imports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_profile_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
  
  -- Archivo fuente
  file_type TEXT NOT NULL, -- pdf|image|excel|multiple
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  
  -- Procesamiento
  status TEXT DEFAULT 'pending', -- pending|processing|completed|failed|cancelled
  progress INTEGER DEFAULT 0, -- 0-100
  current_step TEXT, -- 'uploading'|'extracting'|'enhancing'|'saving'
  
  -- Resultados
  products_found INTEGER DEFAULT 0,
  products_imported INTEGER DEFAULT 0,
  products_failed INTEGER DEFAULT 0,
  error_message TEXT,
  warnings TEXT[], -- Advertencias no críticas
  
  -- AI usage (para billing y analytics)
  ai_tokens_used INTEGER DEFAULT 0,
  ai_images_processed INTEGER DEFAULT 0,
  ai_cost_estimate DECIMAL(10, 4) DEFAULT 0,
  
  -- Opciones de procesamiento
  processing_options JSONB DEFAULT '{}',
  -- {
  --   auto_enhance_images: true,
  --   generate_descriptions: true,
  --   detect_price: true,
  --   remove_backgrounds: false,
  --   upscale_images: false
  -- }
  
  -- Metadata
  processing_metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================
-- TABLA: catalog_categories
-- Categorías del catálogo (generadas automáticamente o manuales)
-- ============================================================
CREATE TABLE IF NOT EXISTS catalog_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_profile_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Emoji or icon name
  color TEXT, -- Hex color for visual distinction
  
  -- Jerarquía (para subcategorías)
  parent_id UUID REFERENCES catalog_categories(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  
  -- IA Metadata
  ai_generated BOOLEAN DEFAULT false,
  product_count INTEGER DEFAULT 0, -- Desnormalizado para performance
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_category_slug UNIQUE (business_profile_id, slug)
);

-- ============================================================
-- TABLA: catalog_ai_jobs
-- Queue para procesamiento asíncrono de IA
-- ============================================================
CREATE TABLE IF NOT EXISTS catalog_ai_jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_profile_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
  
  job_type TEXT NOT NULL, -- 'enhance_image'|'generate_content'|'batch_process'
  status TEXT DEFAULT 'pending', -- pending|processing|completed|failed
  
  -- Input data
  input_data JSONB NOT NULL,
  -- {
  --   product_ids: [...],
  --   enhancement_type: 'upscale',
  --   options: {...}
  -- }
  
  -- Output data
  output_data JSONB,
  error_message TEXT,
  
  -- Metadata
  priority INTEGER DEFAULT 5, -- 1=highest, 10=lowest
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================
-- ÍNDICES
-- ============================================================

-- catalog_products
CREATE INDEX IF NOT EXISTS idx_catalog_products_business ON catalog_products(business_profile_id);
CREATE INDEX IF NOT EXISTS idx_catalog_products_category ON catalog_products(category);
CREATE INDEX IF NOT EXISTS idx_catalog_products_status ON catalog_products(status);
CREATE INDEX IF NOT EXISTS idx_catalog_products_featured ON catalog_products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_catalog_products_tags ON catalog_products USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_catalog_products_search ON catalog_products USING GIN(to_tsvector('spanish', title || ' ' || COALESCE(description, '')));

-- catalog_imports
CREATE INDEX IF NOT EXISTS idx_catalog_imports_business ON catalog_imports(business_profile_id);
CREATE INDEX IF NOT EXISTS idx_catalog_imports_status ON catalog_imports(status);
CREATE INDEX IF NOT EXISTS idx_catalog_imports_created ON catalog_imports(created_at DESC);

-- catalog_categories
CREATE INDEX IF NOT EXISTS idx_catalog_categories_business ON catalog_categories(business_profile_id);
CREATE INDEX IF NOT EXISTS idx_catalog_categories_parent ON catalog_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_catalog_categories_active ON catalog_categories(is_active) WHERE is_active = true;

-- catalog_ai_jobs
CREATE INDEX IF NOT EXISTS idx_catalog_ai_jobs_business ON catalog_ai_jobs(business_profile_id);
CREATE INDEX IF NOT EXISTS idx_catalog_ai_jobs_status ON catalog_ai_jobs(status) WHERE status IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS idx_catalog_ai_jobs_priority ON catalog_ai_jobs(priority, created_at);

-- ============================================================
-- FUNCIONES
-- ============================================================

-- Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_catalog_products_updated_at ON catalog_products;
CREATE TRIGGER update_catalog_products_updated_at BEFORE UPDATE ON catalog_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_catalog_categories_updated_at ON catalog_categories;
CREATE TRIGGER update_catalog_categories_updated_at BEFORE UPDATE ON catalog_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Actualizar product_count en categorías
CREATE OR REPLACE FUNCTION update_category_product_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update old category if exists
    IF OLD.category IS NOT NULL THEN
        UPDATE catalog_categories 
        SET product_count = (
            SELECT COUNT(*) 
            FROM catalog_products 
            WHERE category = OLD.category 
            AND status = 'published'
        )
        WHERE slug = OLD.category;
    END IF;
    
    -- Update new category if exists
    IF NEW.category IS NOT NULL THEN
        UPDATE catalog_categories 
        SET product_count = (
            SELECT COUNT(*) 
            FROM catalog_products 
            WHERE category = NEW.category 
            AND status = 'published'
        )
        WHERE slug = NEW.category;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_category_count_on_product_change ON catalog_products;
CREATE TRIGGER update_category_count_on_product_change 
AFTER INSERT OR UPDATE OF category, status OR DELETE ON catalog_products
    FOR EACH ROW EXECUTE FUNCTION update_category_product_count();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE catalog_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_ai_jobs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLÍTICAS DE SEGURIDAD
-- ============================================================

-- CATALOG_PRODUCTS

-- Ver productos publicados de cualquier negocio (para vista pública)
CREATE POLICY "Los productos publicados son visibles para todos"
ON catalog_products FOR SELECT
USING (status = 'published');

-- Ver todos los productos de tu propio negocio
CREATE POLICY "Propietarios pueden ver todos sus productos"
ON catalog_products FOR SELECT
USING (
  business_profile_id IN (
    SELECT id FROM business_profiles WHERE user_id = auth.uid()
  )
);

-- Crear productos en tu negocio
CREATE POLICY "Propietarios pueden crear productos"
ON catalog_products FOR INSERT
WITH CHECK (
  business_profile_id IN (
    SELECT id FROM business_profiles WHERE user_id = auth.uid()
  )
);

-- Actualizar productos de tu negocio
CREATE POLICY "Propietarios pueden actualizar sus productos"
ON catalog_products FOR UPDATE
USING (
  business_profile_id IN (
    SELECT id FROM business_profiles WHERE user_id = auth.uid()
  )
);

-- Eliminar productos de tu negocio
CREATE POLICY "Propietarios pueden eliminar sus productos"
ON catalog_products FOR DELETE
USING (
  business_profile_id IN (
    SELECT id FROM business_profiles WHERE user_id = auth.uid()
  )
);

-- CATALOG_IMPORTS

CREATE POLICY "Propietarios pueden ver sus importaciones"
ON catalog_imports FOR SELECT
USING (
  business_profile_id IN (
    SELECT id FROM business_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Propietarios pueden crear importaciones"
ON catalog_imports FOR INSERT
WITH CHECK (
  business_profile_id IN (
    SELECT id FROM business_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Propietarios pueden actualizar sus importaciones"
ON catalog_imports FOR UPDATE
USING (
  business_profile_id IN (
    SELECT id FROM business_profiles WHERE user_id = auth.uid()
  )
);

-- CATALOG_CATEGORIES

CREATE POLICY "Las categorías son visibles para todos"
ON catalog_categories FOR SELECT
USING (true);

CREATE POLICY "Propietarios pueden crear categorías"
ON catalog_categories FOR INSERT
WITH CHECK (
  business_profile_id IN (
    SELECT id FROM business_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Propietarios pueden actualizar sus categorías"
ON catalog_categories FOR UPDATE
USING (
  business_profile_id IN (
    SELECT id FROM business_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Propietarios pueden eliminar sus categorías"
ON catalog_categories FOR DELETE
USING (
  business_profile_id IN (
    SELECT id FROM business_profiles WHERE user_id = auth.uid()
  )
);

-- CATALOG_AI_JOBS

CREATE POLICY "Propietarios pueden ver sus jobs de IA"
ON catalog_ai_jobs FOR SELECT
USING (
  business_profile_id IN (
    SELECT id FROM business_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Propietarios pueden crear jobs de IA"
ON catalog_ai_jobs FOR INSERT
WITH CHECK (
  business_profile_id IN (
    SELECT id FROM business_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Propietarios pueden actualizar sus jobs de IA"
ON catalog_ai_jobs FOR UPDATE
USING (
  business_profile_id IN (
    SELECT id FROM business_profiles WHERE user_id = auth.uid()
  )
);

-- ============================================================
-- DATOS INICIALES
-- ============================================================

-- Categorías por defecto (se aplicarán a cada negocio cuando creen su primer producto)
-- Por ahora vacío, se generarán on-demand con IA

-- ============================================================
-- COMENTARIOS
-- ============================================================

COMMENT ON TABLE catalog_products IS 'Productos del catálogo digital (no son adisos promocionados todavía)';
COMMENT ON TABLE catalog_imports IS 'Historial de importaciones masivas con IA (PDF, imágenes, Excel)';
COMMENT ON TABLE catalog_categories IS 'Categorías del catálogo, generadas automáticamente por IA o creadas manualmente';
COMMENT ON TABLE catalog_ai_jobs IS 'Cola de trabajos de IA para procesamiento asíncrono (mejoras de imagen, generación de contenido, etc.)';

COMMENT ON COLUMN catalog_products.ai_metadata IS 'Metadata sobre cómo la IA procesó este producto';
COMMENT ON COLUMN catalog_products.images IS 'Array de objetos con URLs de imágenes y metadata de mejoras de IA';
COMMENT ON COLUMN catalog_imports.ai_cost_estimate IS 'Costo estimado en USD de procesamiento de IA para esta importación';
