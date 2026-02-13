# Solución Error 400 en Supabase (Adisos)

El error `400 Bad Request` que estás experimentando ocurre porque la tabla `adisos` en Supabase **no tiene la columna `user_id`** (o está mal nombrada), pero la aplicación está intentando filtrar por ella (`.eq('usuario_id', ...)`).

Además, el problema de que te redirija a `localhost` al iniciar sesión en otros dispositivos es una configuración de **Redirect URLs** en Supabase.

He realizado los cambios en el código para estandarizar el uso de `user_id`, pero **necesitas ejecutar script SQL en Supabase** para aplicar los cambios en la base de datos.

## Paso 1: Ejecutar Script SQL en Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard).
2. Ve a la sección **SQL Editor**.
3. Abre el archivo `sql/supabase-add-userid-to-adisos.sql` que he creado en tu proyecto, o copia y pega el siguiente código:

```sql
-- ============================================
-- AGREGAR COLUMNA USER_ID A TABLA ADISOS
-- ============================================

-- 1. Agregar columna user_id si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'adisos' AND column_name = 'user_id') THEN
        ALTER TABLE adisos ADD COLUMN user_id UUID REFERENCES auth.users(id);
        CREATE INDEX idx_adisos_user_id ON adisos(user_id);
    END IF;
END $$;

-- 2. Actualizar políticas RLS para permitir gestión propia
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios adisos" ON adisos;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios adisos" ON adisos;

CREATE POLICY "Usuarios pueden actualizar sus propios adisos"
ON adisos FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propios adisos"
ON adisos FOR DELETE TO authenticated
USING (auth.uid() = user_id);
```

4. Haz clic en **Run**.

## Paso 2: Configurar Redirect URLs (Solución "me lleva a localhost")

El problema de que te redirija a localhost en otros dispositivos es porque Supabase usa `Site URL` por defecto para los enlaces de magia/auth.

1. Ve a **Authentication** -> **URL Configuration** en Supabase Dashboard.
2. En **Site URL**, asegura que esté tu dominio de producción: `https://adis.lat` (NO localhost).
3. En **Redirect URLs**, añade todas las URLs permitidas:
   - `http://localhost:3000/**`
   - `https://adis.lat/**`
   - `https://www.adis.lat/**`
   - `https://adis.lat`

Esto asegurará que cuando inicies sesión desde el móvil o laptop, te redirija al dominio correcto y no a localhost.

## Resumen de Cambios en Código

He actualizado:
- `types/index.ts`: Agregado `user_id` y `usuario_id` a la interfaz `Adiso`.
- `lib/supabase.ts`: Mapeado correctamente `user_id` para lectura y escritura en la BD.
- `app/mi-negocio/page.tsx`: Corregido el filtro `.eq('user_id', ...)` para usar la columna estándar.

Una vez apliques el SQL, el error 400 debería desaparecer y podrás ver tus productos en "Mi Negocio".
