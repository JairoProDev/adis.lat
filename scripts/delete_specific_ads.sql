-- Eliminar anuncios específicos solicitados
DELETE FROM adisos 
WHERE id IN (
    '-Zc95n1tgA',
    '27lGrCA7Kh',
    'jZbkoSLMWx'
);

-- Verificación (debería retornar 0 si se eliminaron correctamente)
SELECT id, titulo FROM adisos WHERE id IN ('-Zc95n1tgA', '27lGrCA7Kh', 'jZbkoSLMWx');
