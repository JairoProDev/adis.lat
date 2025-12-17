-- Actualizar todos los adisos a tamaño 'pequeño'
-- Esto corregirá los anuncios históricos que se subieron como 'miniatura'
-- y estandarizará temporalmente todos los anuncios.

UPDATE adisos
SET tamaño = 'pequeño';
