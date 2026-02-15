-- ============================================================
-- CATALOG AI - EXTENDED SCHEMA
-- Sistema Inteligente de Gestión de Catálogos
-- ============================================================

-- Drop existing constraints and tables if re-creating
-- (Comment out in production, only for development)
-- DROP TABLE IF EXISTS duplicate_candidates CASCADE;
-- DROP TABLE IF EXISTS import_sessions CASCADE;
-- DROP TABLE IF EXISTS product_images CASCADE;
-- DROP TABLE IF EXISTS product_attributes CASCADE;
-- DROP TABLE IF EXISTS product_categories CASCADE;
-- DROP TABLE IF EXISTS product_variants CASCADE;

-- ============================================================
-- 1. PRODUCT CATEGORIES (Jerárquicas)
-- ============================================================
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_profile_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
    
    parent_id UUID REFERENCES product_categories(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200),
    description TEXT,
    
    -- Template de atributos para productos en esta categoría
    -- Ejemplo: {"diameter": {"type": "number", "unit": "cm", "required": true}}
    attribute_template JSONB DEFAULT '{}'::jsonb,
    
    -- Display
    icon VARCHAR(50), -- Emoji o icon name
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(business_profile_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_categories_business ON product_categories(business_profile_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON product_categories(parent_id);

-- ============================================================
-- 2. PRODUCT VARIANTS (Create from scratch)
-- ============================================================
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES catalog_products(id) ON DELETE CASCADE,
    
    -- Identificadores
    variant_title VARCHAR(200), -- "Rojo - Grande"
    sku VARCHAR(100),
    barcode VARCHAR(100),
    
    -- Atributos específicos de variante
    attributes JSONB DEFAULT '{}'::jsonb,
    
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

CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_attributes ON product_variants USING GIN(attributes);

-- ============================================================
-- 3. PRODUCT ATTRIBUTES (Dynamic)
-- ============================================================
CREATE TABLE IF NOT EXISTS product_attributes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES catalog_products(id) ON DELETE CASCADE,
    
    attribute_key VARCHAR(100) NOT NULL,
    attribute_value TEXT NOT NULL,
    attribute_type VARCHAR(20) DEFAULT 'text', -- 'text', 'number', 'select', 'multiselect'
    attribute_unit VARCHAR(20), -- 'm', 'cm', 'V', 'W', etc.
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(product_id, attribute_key)
);

CREATE INDEX IF NOT EXISTS idx_attributes_product ON product_attributes(product_id);
CREATE INDEX IF NOT EXISTS idx_attributes_key ON product_attributes(attribute_key);

-- ============================================================
-- 4. PRODUCT IMAGES (Multi-source)
-- ============================================================
CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES catalog_products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    
    url TEXT NOT NULL,
    alt_text VARCHAR(500),
    width INTEGER,
    height INTEGER,
    
    -- Metadata de origen
    source VARCHAR(50) DEFAULT 'manual', -- 'upload', 'extracted', 'web_search', 'ai_generated'
    source_url TEXT, -- URL original si vino de web
    
    -- Procesamiento
    is_processed BOOLEAN DEFAULT false,
    is_primary BOOLEAN DEFAULT false,
    
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CHECK (product_id IS NOT NULL OR variant_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_images_variant ON product_images(variant_id);
CREATE INDEX IF NOT EXISTS idx_images_primary ON product_images(is_primary) WHERE is_primary = true;

-- ============================================================
-- 5. IMPORT SESSIONS (Tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS import_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_profile_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
    
    source_type VARCHAR(50) NOT NULL, -- 'excel', 'pdf', 'canva', 'photo', 'api'
    source_file_name VARCHAR(500),
    source_file_url TEXT,
    
    status VARCHAR(20) DEFAULT 'processing', -- 'processing', 'completed', 'failed', 'review_needed'
    
    -- Estadísticas
    total_rows INTEGER DEFAULT 0,
    products_created INTEGER DEFAULT 0,
    products_updated INTEGER DEFAULT 0,
    products_skipped INTEGER DEFAULT 0,
    duplicates_found INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    
    -- Resultados detallados
    processing_log JSONB DEFAULT '[]'::jsonb,
    error_details JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_import_sessions_business ON import_sessions(business_profile_id);
CREATE INDEX IF NOT EXISTS idx_import_sessions_status ON import_sessions(status);

-- ============================================================
-- 6. DUPLICATE CANDIDATES (Para revisión manual)
-- ============================================================
CREATE TABLE IF NOT EXISTS duplicate_candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    import_session_id UUID REFERENCES import_sessions(id) ON DELETE CASCADE,
    
    -- Datos del producto nuevo (pendiente)
    new_product_data JSONB NOT NULL,
    
    -- Referencia al producto existente
    existing_product_id UUID REFERENCES catalog_products(id) ON DELETE CASCADE,
    
    -- Scoring
    similarity_score DECIMAL(3,2), -- 0.00 - 1.00
    match_reasons JSONB DEFAULT '[]'::jsonb, -- ["title_match", "sku_match", "description_similar"]
    
    -- Resolución
    resolution VARCHAR(20) DEFAULT 'pending', -- 'merge', 'keep_both', 'skip_new', 'pending'
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    merge_strategy JSONB, -- Configuración de cómo se hizo el merge
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_duplicates_session ON duplicate_candidates(import_session_id);
CREATE INDEX IF NOT EXISTS idx_duplicates_resolution ON duplicate_candidates(resolution) WHERE resolution = 'pending';

-- ============================================================
-- 7. EXTEND catalog_products (Add missing fields)
-- ============================================================
ALTER TABLE catalog_products
ADD COLUMN IF NOT EXISTS barcode VARCHAR(100),
ADD COLUMN IF NOT EXISTS brand VARCHAR(100),
ADD COLUMN IF NOT EXISTS supplier VARCHAR(200),
ADD COLUMN IF NOT EXISTS short_description VARCHAR(500),
ADD COLUMN IF NOT EXISTS cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS import_source VARCHAR(50),
ADD COLUMN IF NOT EXISTS import_source_file VARCHAR(500),
ADD COLUMN IF NOT EXISTS import_confidence DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

-- Índices para búsqueda
CREATE INDEX IF NOT EXISTS idx_products_barcode ON catalog_products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_brand ON catalog_products(brand);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON catalog_products(supplier);
CREATE INDEX IF NOT EXISTS idx_products_import_source ON catalog_products(import_source);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_products_search ON catalog_products USING GIN(search_vector);

-- Trigger para actualizar search_vector automáticamente
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('spanish', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('spanish', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('spanish', COALESCE(NEW.brand, '')), 'C') ||
        setweight(to_tsvector('spanish', COALESCE(NEW.category, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_product_search_vector ON catalog_products;
CREATE TRIGGER trigger_update_product_search_vector
    BEFORE INSERT OR UPDATE ON catalog_products
    FOR EACH ROW
    EXECUTE FUNCTION update_product_search_vector();

-- ============================================================
-- 8. HELPER FUNCTIONS
-- ============================================================

-- Function to get all variants for a product with images
CREATE OR REPLACE FUNCTION get_product_with_variants(product_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'product', row_to_json(p.*),
        'variants', COALESCE(
            (SELECT json_agg(row_to_json(v.*))
             FROM product_variants v
             WHERE v.product_id = product_uuid),
            '[]'::json
        ),
        'images', COALESCE(
            (SELECT json_agg(row_to_json(i.*))
             FROM product_images i
             WHERE i.product_id = product_uuid
             ORDER BY i.sort_order, i.created_at),
            '[]'::json
        ),
        'attributes', COALESCE(
            (SELECT json_object_agg(a.attribute_key, 
                json_build_object(
                    'value', a.attribute_value,
                    'type', a.attribute_type,
                    'unit', a.attribute_unit
                ))
             FROM product_attributes a
             WHERE a.product_id = product_uuid),
            '{}'::json
        )
    ) INTO result
    FROM catalog_products p
    WHERE p.id = product_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 9. SAMPLE DATA (Category Templates)
-- ============================================================

-- Insertar categorías base con templates (ejemplo)
INSERT INTO product_categories (name, slug, attribute_template, icon, sort_order)
VALUES
    ('Tuberías', 'tuberias', '{
        "diameter": {"type": "number", "unit": "pulgadas", "required": true},
        "length": {"type": "number", "unit": "metros", "required": false},
        "material": {"type": "select", "options": ["PVC", "CPVC", "Cobre", "Acero"], "required": true},
        "class": {"type": "text", "required": false},
        "color": {"type": "select", "options": ["Blanco", "Gris", "Naranja"], "required": false}
    }'::jsonb, '🔧', 1),
    
    ('Cables Eléctricos', 'cables', '{
        "caliber": {"type": "text", "required": true},
        "voltage": {"type": "number", "unit": "V", "required": true},
        "length": {"type": "number", "unit": "metros", "required": false},
        "color": {"type": "select", "options": ["Negro", "Rojo", "Azul", "Verde", "Amarillo"], "required": false},
        "insulation_type": {"type": "text", "required": false}
    }'::jsonb, '⚡', 2),
    
    ('Pegamentos', 'pegamentos', '{
        "volume": {"type": "number", "unit": "ml", "required": true},
        "application_type": {"type": "text", "required": false},
        "drying_time": {"type": "text", "unit": "horas", "required": false},
        "surface_types": {"type": "multiselect", "options": ["Madera", "Metal", "Plástico", "Cerámica"], "required": false}
    }'::jsonb, '🧪', 3),
    
    ('Accesorios Eléctricos', 'accesorios-electricos', '{
        "type": {"type": "select", "options": ["Tomacorriente", "Interruptor", "Caja de luz", "Tapa"], "required": true},
        "voltage": {"type": "number", "unit": "V", "required": false},
        "color": {"type": "select", "options": ["Blanco", "Marfil", "Gris"], "required": false}
    }'::jsonb, '💡', 4)
ON CONFLICT DO NOTHING;

-- ============================================================
-- PERMISOS RLS (Row Level Security)
-- ============================================================

-- Enable RLS on new tables
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE duplicate_candidates ENABLE ROW LEVEL SECURITY;

-- Policies para product_categories
DROP POLICY IF EXISTS "Users can view categories of their business" ON product_categories;
CREATE POLICY "Users can view categories of their business"
    ON product_categories FOR SELECT
    USING (
        business_profile_id IN (
            SELECT id FROM business_profiles WHERE user_id = auth.uid()
        )
        OR business_profile_id IS NULL -- Categorías globales
    );

DROP POLICY IF EXISTS "Users can create categories for their business" ON product_categories;
CREATE POLICY "Users can create categories for their business"
    ON product_categories FOR INSERT
    WITH CHECK (
        business_profile_id IN (
            SELECT id FROM business_profiles WHERE user_id = auth.uid()
        )
    );

-- Policies para product_attributes (heredan del producto)
DROP POLICY IF EXISTS "Users can view attributes of their products" ON product_attributes;
CREATE POLICY "Users can view attributes of their products"
    ON product_attributes FOR SELECT
    USING (
        product_id IN (
            SELECT id FROM catalog_products WHERE business_profile_id IN (
                SELECT id FROM business_profiles WHERE user_id = auth.uid()
            )
        )
    );

-- Policies para product_images
DROP POLICY IF EXISTS "Users can view images of their products" ON product_images;
CREATE POLICY "Users can view images of their products"
    ON product_images FOR SELECT
    USING (
        product_id IN (
            SELECT id FROM catalog_products WHERE business_profile_id IN (
                SELECT id FROM business_profiles WHERE user_id = auth.uid()
            )
        )
    );

-- Policies para import_sessions
DROP POLICY IF EXISTS "Users can view their import sessions" ON import_sessions;
CREATE POLICY "Users can view their import sessions"
    ON import_sessions FOR SELECT
    USING (
        business_profile_id IN (
            SELECT id FROM business_profiles WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create import sessions for their business" ON import_sessions;
CREATE POLICY "Users can create import sessions for their business"
    ON import_sessions FOR INSERT
    WITH CHECK (
        business_profile_id IN (
            SELECT id FROM business_profiles WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update their import sessions" ON import_sessions;
CREATE POLICY "Users can update their import sessions"
    ON import_sessions FOR UPDATE
    USING (
        business_profile_id IN (
            SELECT id FROM business_profiles WHERE user_id = auth.uid()
        )
    );

-- Policies para duplicate_candidates
DROP POLICY IF EXISTS "Users can view duplicate candidates" ON duplicate_candidates;
CREATE POLICY "Users can view duplicate candidates"
    ON duplicate_candidates FOR SELECT
    USING (
        import_session_id IN (
            SELECT id FROM import_sessions WHERE business_profile_id IN (
                SELECT id FROM business_profiles WHERE user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can create duplicate candidates" ON duplicate_candidates;
CREATE POLICY "Users can create duplicate candidates"
    ON duplicate_candidates FOR INSERT
    WITH CHECK (
        import_session_id IN (
            SELECT id FROM import_sessions WHERE business_profile_id IN (
                SELECT id FROM business_profiles WHERE user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can update duplicate candidates" ON duplicate_candidates;
CREATE POLICY "Users can update duplicate candidates"
    ON duplicate_candidates FOR UPDATE
    USING (
        import_session_id IN (
            SELECT id FROM import_sessions WHERE business_profile_id IN (
                SELECT id FROM business_profiles WHERE user_id = auth.uid()
            )
        )
    );

-- ============================================================
-- ÍNDICES DE PERFORMANCE
-- ============================================================

-- Composite indexes para queries comunes
CREATE INDEX IF NOT EXISTS idx_products_business_status 
    ON catalog_products(business_profile_id, status);

CREATE INDEX IF NOT EXISTS idx_products_business_category 
    ON catalog_products(business_profile_id, category);

CREATE INDEX IF NOT EXISTS idx_variants_product_status 
    ON product_variants(product_id, stock_status);

-- ============================================================
-- TRIGGERS ADICIONALES
-- ============================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_category_timestamp ON product_categories;
CREATE TRIGGER trigger_update_category_timestamp
    BEFORE UPDATE ON product_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_attribute_timestamp ON product_attributes;
CREATE TRIGGER trigger_update_attribute_timestamp
    BEFORE UPDATE ON product_attributes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- COMENTARIOS (Para documentación)
-- ============================================================

COMMENT ON TABLE product_categories IS 'Categorías jerárquicas con templates de atributos dinámicos';
COMMENT ON TABLE product_variants IS 'Variantes de productos (colores, tamaños, etc.)';
COMMENT ON TABLE product_attributes IS 'Atributos dinámicos por producto';
COMMENT ON TABLE product_images IS 'Imágenes multi-fuente con tracking de origen';
COMMENT ON TABLE import_sessions IS 'Sesiones de importación con estadísticas';
COMMENT ON TABLE duplicate_candidates IS 'Duplicados detectados para revisión manual';

-- ============================================================
-- ANALYTICS VIEWS (Opcional)
-- ============================================================

CREATE OR REPLACE VIEW v_import_stats AS
SELECT 
    business_profile_id,
    COUNT(*) as total_imports,
    SUM(products_created) as total_created,
    SUM(products_updated) as total_updated,
    SUM(duplicates_found) as total_duplicates,
    AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds
FROM import_sessions
WHERE status = 'completed'
GROUP BY business_profile_id;

COMMENT ON VIEW v_import_stats IS 'Estadísticas agregadas de importaciones por negocio';

-- ============================================================
-- DONE
-- ============================================================
-- Schema listo para Catalog AI MVP
-- Next: Implementar APIs de importación
