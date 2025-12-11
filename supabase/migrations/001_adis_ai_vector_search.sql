-- ============================================
-- ADIS AI: RAG-Powered Hybrid Search Migration
-- ============================================
-- This migration enables:
-- 1. Vector embeddings storage (pgvector)
-- 2. Full-Text Search (PostgreSQL tsvector)
-- 3. Hybrid Search function (Semantic + Keyword)
-- ============================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to adisos table
-- OpenAI text-embedding-3-small produces 1536-dimensional vectors
ALTER TABLE adisos
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Add Full-Text Search column (for hybrid search)
ALTER TABLE adisos
ADD COLUMN IF NOT EXISTS search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('spanish', coalesce(titulo, '')), 'A') ||
  setweight(to_tsvector('spanish', coalesce(descripcion, '')), 'B') ||
  setweight(to_tsvector('spanish', coalesce(categoria::text, '')), 'C')
) STORED;

-- Create GIN index for Full-Text Search (fast keyword search)
CREATE INDEX IF NOT EXISTS idx_adisos_search_vector
ON adisos USING GIN (search_vector);

-- Create IVFFlat index for vector similarity search (fast semantic search)
-- Note: IVFFlat is better for large datasets. For <100k rows, this is sufficient.
-- lists = rows / 1000 (rule of thumb)
CREATE INDEX IF NOT EXISTS idx_adisos_embedding
ON adisos USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- ============================================
-- HYBRID SEARCH FUNCTION (The Magic 🪄)
-- ============================================
-- This function combines:
-- - Semantic search (vector similarity)
-- - Keyword search (Full-Text Search)
-- - Category filtering
-- - Location proximity (future enhancement)
-- ============================================

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
      a.fecha_publicacion,
      a.hora_publicacion,
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
      -- Adjust weights based on your use case
      (COALESCE(v.similarity_score, 0) * 0.7 + COALESCE(k.keyword_rank, 0) * 0.3) as hybrid_score
    FROM vector_search v
    FULL OUTER JOIN keyword_search k ON v.id = k.id
  )
  SELECT
    c.id,
    c.categoria::text,
    c.titulo,
    c.descripcion,
    c.contacto,
    c.ubicacion,
    c.fecha_publicacion,
    c.hora_publicacion,
    c.imagenes_urls,
    c.similarity_score,
    c.keyword_rank,
    c.hybrid_score
  FROM combined c
  WHERE c.hybrid_score > match_threshold
  ORDER BY c.hybrid_score DESC
  LIMIT match_count;
END;
$$;

-- ============================================
-- VECTOR SIMILARITY SEARCH (Simple Version)
-- ============================================
-- Use this when you only need semantic search without keywords

CREATE OR REPLACE FUNCTION match_adisos_semantic(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id text,
  categoria text,
  titulo text,
  descripcion text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.categoria::text,
    a.titulo,
    a.descripcion,
    1 - (a.embedding <=> query_embedding) AS similarity
  FROM adisos a
  WHERE a.embedding IS NOT NULL
    AND 1 - (a.embedding <=> query_embedding) > match_threshold
  ORDER BY a.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================
-- EMBEDDING TRIGGER (Auto-generate on insert/update)
-- ============================================
-- Note: This is a placeholder. In production, embeddings should be generated
-- by your backend (Next.js API) using OpenAI's API, not in the database.
-- Uncomment if you set up a Supabase Edge Function for embeddings.

-- CREATE OR REPLACE FUNCTION generate_embedding_trigger()
-- RETURNS trigger
-- LANGUAGE plpgsql
-- AS $$
-- BEGIN
--   -- Call your Edge Function or external API here
--   -- NEW.embedding := call_openai_embeddings(NEW.titulo || ' ' || NEW.descripcion);
--   RETURN NEW;
-- END;
-- $$;
--
-- CREATE TRIGGER adisos_embedding_trigger
-- BEFORE INSERT OR UPDATE ON adisos
-- FOR EACH ROW
-- WHEN (NEW.titulo IS NOT NULL OR NEW.descripcion IS NOT NULL)
-- EXECUTE FUNCTION generate_embedding_trigger();

-- ============================================
-- ANALYTICS & METADATA TABLES
-- ============================================

-- Table for storing search queries and results (for analytics)
CREATE TABLE IF NOT EXISTS ai_search_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  query_text text NOT NULL,
  query_embedding vector(1536),
  results_count int,
  clicked_result_id text REFERENCES adisos(id) ON DELETE SET NULL,
  session_id text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_ai_search_logs_created_at ON ai_search_logs(created_at DESC);
CREATE INDEX idx_ai_search_logs_user_id ON ai_search_logs(user_id);

-- Table for AI conversation history (for context and memory)
CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_ai_conversations_session ON ai_conversations(session_id, created_at);
CREATE INDEX idx_ai_conversations_user ON ai_conversations(user_id, created_at DESC);

-- Table for AI-generated listings (Snap & Sell)
CREATE TABLE IF NOT EXISTS ai_generated_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  adiso_id text REFERENCES adisos(id) ON DELETE CASCADE,
  image_url text,
  vision_analysis jsonb, -- GPT-4o Vision output
  auto_filled_data jsonb, -- Extracted data (title, category, price, etc.)
  user_confirmed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_ai_generated_listings_user ON ai_generated_listings(user_id, created_at DESC);

-- ============================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE ai_search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generated_listings ENABLE ROW LEVEL SECURITY;

-- Search logs: Users can read their own logs, insert is public (for analytics)
CREATE POLICY "Users can view own search logs"
  ON ai_search_logs FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can insert search logs"
  ON ai_search_logs FOR INSERT
  WITH CHECK (true);

-- Conversations: Users can only access their own conversations
CREATE POLICY "Users can view own conversations"
  ON ai_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON ai_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- AI Generated Listings: Users can only access their own
CREATE POLICY "Users can view own AI listings"
  ON ai_generated_listings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI listings"
  ON ai_generated_listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI listings"
  ON ai_generated_listings FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Get recommended adisos based on user's search history
CREATE OR REPLACE FUNCTION get_user_recommendations(
  p_user_id uuid,
  p_limit int DEFAULT 10
)
RETURNS TABLE (
  id text,
  titulo text,
  categoria text,
  score float
)
LANGUAGE plpgsql
AS $$
DECLARE
  avg_embedding vector(1536);
BEGIN
  -- Calculate average embedding from user's search history
  SELECT avg(query_embedding) INTO avg_embedding
  FROM ai_search_logs
  WHERE user_id = p_user_id
    AND query_embedding IS NOT NULL
    AND created_at > now() - interval '30 days';

  IF avg_embedding IS NULL THEN
    -- No search history, return popular items
    RETURN QUERY
    SELECT a.id, a.titulo, a.categoria::text, 0.0 as score
    FROM adisos a
    WHERE a.esta_activo = true
    ORDER BY a.fecha_publicacion DESC
    LIMIT p_limit;
  ELSE
    -- Return items similar to user's interests
    RETURN QUERY
    SELECT
      a.id,
      a.titulo,
      a.categoria::text,
      1 - (a.embedding <=> avg_embedding) as score
    FROM adisos a
    WHERE a.embedding IS NOT NULL
      AND a.esta_activo = true
    ORDER BY a.embedding <=> avg_embedding
    LIMIT p_limit;
  END IF;
END;
$$;

-- ============================================
-- SAMPLE DATA & TESTING
-- ============================================

-- Function to test the hybrid search (uncomment to test)
-- SELECT * FROM match_adisos_hybrid(
--   query_embedding := (SELECT embedding FROM adisos LIMIT 1),
--   query_text := 'departamento cusco',
--   match_threshold := 0.1,
--   match_count := 5
-- );

-- ============================================
-- COMMENTS & DOCUMENTATION
-- ============================================

COMMENT ON FUNCTION match_adisos_hybrid IS
'Hybrid search combining semantic (vector) and keyword (FTS) search.
Returns results ranked by a weighted combination of both methods.
Use this for natural language queries like "busco trabajo de cocinero en cusco".';

COMMENT ON FUNCTION match_adisos_semantic IS
'Pure semantic search using vector embeddings.
Use this when you want to find conceptually similar items regardless of exact keywords.';

COMMENT ON TABLE ai_search_logs IS
'Stores all AI search queries for analytics and personalization.';

COMMENT ON TABLE ai_conversations IS
'Stores AI chat conversations for context and memory across sessions.';

COMMENT ON TABLE ai_generated_listings IS
'Stores AI-assisted listings created via "Snap & Sell" (image analysis).';
