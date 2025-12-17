-- Tabla para perfiles de negocio (Digital Store / Linktree / Bento)
-- Relacionada 1:1 con auth.users, pero separada para no ensuciar profiles
CREATE TABLE IF NOT EXISTS business_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL, -- URL amigable: adis.lat/negocio/mi-tienda
  
  -- Información Básica
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  
  -- Personalización
  theme_color TEXT DEFAULT '#000000', -- Color primario
  theme_mode TEXT DEFAULT 'light', -- 'light' | 'dark' | 'system'
  layout_style TEXT DEFAULT 'standard', -- 'standard' | 'bento' | 'minimal'
  
  -- Información de Contacto (Estructurada)
  contact_email TEXT,
  contact_phone TEXT,
  contact_whatsapp TEXT,
  contact_address TEXT,
  contact_maps_url TEXT,
  
  -- Horarios (JSONB para flexibilidad)
  -- Estructura: { "lunes": { "open": "09:00", "close": "18:00", "closed": false }, ... }
  business_hours JSONB DEFAULT '{}',
  
  -- Redes Sociales (JSONB)
  -- Estructura: [{ "network": "facebook", "url": "...", "label": "Facebook" }, ...]
  social_links JSONB DEFAULT '[]',
  
  -- Enlaces Personalizados (Linktree/Bento)
  -- Estructura: [{ "type": "link|image|video", "url": "...", "label": "...", "icon": "..." }, ...]
  custom_blocks JSONB DEFAULT '[]',
  
  -- Configuración
  is_published BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_user_business UNIQUE (user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_business_profiles_slug ON business_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON business_profiles(user_id);

-- RLS (Row Level Security)
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas
-- 1. Cualquiera puede ver perfiles publicados
CREATE POLICY "Perfiles publicados son visibles para todos" 
ON business_profiles FOR SELECT 
USING (true);

-- 2. Usuarios pueden ver su propio perfil (incluso si no está publicado)
CREATE POLICY "Usuarios pueden ver su propio perfil de negocio" 
ON business_profiles FOR SELECT 
USING (auth.uid() = user_id);

-- 3. Usuarios pueden crear su propio perfil
CREATE POLICY "Usuarios pueden crear su perfil de negocio" 
ON business_profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 4. Usuarios pueden actualizar su propio perfil
CREATE POLICY "Usuarios pueden actualizar su perfil de negocio" 
ON business_profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- 5. Usuarios pueden eliminar su propio perfil
CREATE POLICY "Usuarios pueden eliminar su perfil de negocio" 
ON business_profiles FOR DELETE 
USING (auth.uid() = user_id);
