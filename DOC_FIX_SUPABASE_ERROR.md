# PASOS OBLIGATORIOS PARA ARREGLAR LOS ERRORES

Para que la subida de productos y el perfil funcionen perfectamente (sin error 500 ni 406), **debes ejecutar este último script SQL en Supabase**.

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard).
2. Entra a tu proyecto -> **SQL Editor**.
3. Copia y pega el contenido del archivo `sql/fix_all_errors.sql` que he creado (está abajo también).
4. Haz clic en **RUN**.

```sql
-- ============================================
-- SQL SCRIPT PARA ARREGLAR TODOS LOS ERRORES
-- ============================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  nombre TEXT,
  apellido TEXT,
  avatar_url TEXT,
  rol TEXT DEFAULT 'usuario',
  telefono TEXT,
  ubicacion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Todos pueden ver perfiles" ON profiles;
CREATE POLICY "Todos pueden ver perfiles" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuarios editan su propio perfil" ON profiles;
CREATE POLICY "Usuarios editan su propio perfil" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuarios crean su perfil" ON profiles;
CREATE POLICY "Usuarios crean su perfil" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ARREGLAR ADISOS
ALTER TABLE adisos ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

ALTER TABLE adisos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Todos pueden ver adisos" ON adisos;
CREATE POLICY "Todos pueden ver adisos" ON adisos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Todos pueden crear adisos" ON adisos;
CREATE POLICY "Todos pueden crear adisos" ON adisos FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Usuarios editan sus propios adisos" ON adisos;
CREATE POLICY "Usuarios editan sus propios adisos" ON adisos FOR UPDATE USING (auth.uid() = user_id);

SELECT 'Todo listo. Tablas profiles y adisos configuradas.' as mensaje;
```

5. **Recarga tu aplicación web** y prueba subir un producto. ¡Debería funcionar sin errores!

Nota: He corregido también el error de las imágenes (invalid position) en el código.
