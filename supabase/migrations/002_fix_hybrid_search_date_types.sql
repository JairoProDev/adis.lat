-- ============================================
-- FIX: Hybrid Search Date Type Mismatch
-- ============================================
-- Issue: fecha_publicacion and hora_publicacion are date/time types
-- but the function declares them as text in RETURNS TABLE
-- Solution: Cast ALL columns to correct types in the SELECT statement
-- ============================================

-- First, drop the existing function if it exists
DROP FUNCTION IF EXISTS match_adisos_hybrid(vector(1536), text, float, int, text, text, boolean);

-- Recreate with proper type casting
CREATE OR REPLACE FUNCTION match_adisos_hybrid(
  query_embedding vector(1536),
  query_text text,
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10,
  filter_category text DEFAULT NULL,
  filter_location text DEFAULT NULL,
  only_active boolean DEFAULT true
)
RETURNS TABLE (
  id text,
  categoria text,
  titulo text,
  descripcion text,
  contacto text,
  ubicacion text,
  fecha_publicacion text,
  hora_publicacion text,
  imagenes_urls jsonb,
  similarity_score float,
  keyword_rank float,
  hybrid_score float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH vector_search AS (
    -- Semantic search using cosine similarity
    SELECT
      a.id,
      a.categoria,
      a.titulo,
      a.descripcion,
      a.contacto,
      a.ubicacion,
      a.fecha_publicacion::text,  -- ✅ Cast to text
      a.hora_publicacion::text,    -- ✅ Cast to text
      a.imagenes_urls,
      1 - (a.embedding <=> query_embedding) AS similarity_score
    FROM adisos a
    WHERE
      (only_active = false OR a.esta_activo = true)
      AND (filter_category IS NULL OR a.categoria = filter_category)
      AND (filter_location IS NULL OR a.ubicacion ILIKE '%' || filter_location || '%')
      AND a.embedding IS NOT NULL
  ),
  keyword_search AS (
    -- Full-Text Search using ts_rank
    SELECT
      a.id,
      ts_rank(a.search_vector, plainto_tsquery('spanish', query_text)) AS keyword_rank
    FROM adisos a
    WHERE
      (only_active = false OR a.esta_activo = true)
      AND (filter_category IS NULL OR a.categoria = filter_category)
      AND (filter_location IS NULL OR a.ubicacion ILIKE '%' || filter_location || '%')
      AND a.search_vector @@ plainto_tsquery('spanish', query_text)
  ),
  combined AS (
    -- Combine both searches with weighted scoring
    SELECT
      COALESCE(v.id, k.id) as id,
      v.categoria,
      v.titulo,
      v.descripcion,
      v.contacto,
      v.ubicacion,
      v.fecha_publicacion,
      v.hora_publicacion,
      v.imagenes_urls,
      COALESCE(v.similarity_score, 0) as similarity_score,
      COALESCE(k.keyword_rank, 0) as keyword_rank,
      -- Hybrid score: 70% semantic + 30% keyword
      (COALESCE(v.similarity_score, 0) * 0.7 + COALESCE(k.keyword_rank, 0) * 0.3) as hybrid_score
    FROM vector_search v
    FULL OUTER JOIN keyword_search k ON v.id = k.id
  )
  SELECT
    c.id::text,
    c.categoria::text,
    c.titulo::text,
    c.descripcion::text,
    c.contacto::text,
    c.ubicacion::text,
    c.fecha_publicacion::text,  -- ✅ Cast to text
    c.hora_publicacion::text,    -- ✅ Cast to text
    c.imagenes_urls,             -- Already JSONB
    c.similarity_score::float,
    c.keyword_rank::float,
    c.hybrid_score::float
  FROM combined c
  WHERE c.hybrid_score > match_threshold
  ORDER BY c.hybrid_score DESC
  LIMIT match_count;
END;
$$;
