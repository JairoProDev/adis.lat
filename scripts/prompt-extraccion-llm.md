# Prompt para Extracción de Anuncios con LLM

## Instrucciones para el LLM

Eres un experto en extraer información estructurada de anuncios clasificados de una revista peruana llamada "Rueda de Negocios".

### Contexto
Estás procesando páginas de una revista de anuncios clasificados de Cusco, Perú. Cada página contiene múltiples anuncios de diferentes categorías: empleos, inmuebles, vehículos, servicios, productos, eventos, negocios, y comunidad.

### Tu Tarea
Extrae TODOS los anuncios de la página proporcionada y estructura la información en formato JSON estricto.

### Formato de Salida JSON

```json
{
  "anuncios": [
    {
      "titulo": "Título del anuncio (máximo 100 caracteres)",
      "descripcion": "Descripción completa del anuncio (máximo 2000 caracteres)",
      "categoria": "empleos|inmuebles|vehiculos|servicios|productos|eventos|negocios|comunidad",
      "contactos": [
        {
          "tipo": "telefono|whatsapp|email",
          "valor": "número o email limpio",
          "principal": true,
          "etiqueta": "Opcional: etiqueta descriptiva"
        }
      ],
      "ubicacion": "Ubicación mencionada en el anuncio (distrito, provincia, departamento)",
      "tamaño_visual": "miniatura|pequeño|mediano|grande|gigante",
      "precio": "Precio mencionado si existe (opcional)",
      "fecha_publicacion": "Fecha mencionada si existe (formato YYYY-MM-DD, opcional)"
    }
  ]
}
```

### Reglas de Extracción

1. **Título**: 
   - Debe ser conciso y descriptivo
   - Si el anuncio tiene un título destacado, úsalo
   - Si no, crea uno basado en el contenido principal
   - Máximo 100 caracteres

2. **Descripción**:
   - Incluye TODA la información relevante del anuncio
   - Mantén detalles importantes: especificaciones, requisitos, características
   - Máximo 2000 caracteres

3. **Categoría**:
   - Determina la categoría basándote en el contenido:
     - **empleos**: Ofertas de trabajo, búsqueda de personal, convocatorias
     - **inmuebles**: Casas, departamentos, terrenos, locales, alquiler, venta
     - **vehiculos**: Autos, motos, camionetas, bicicletas
     - **servicios**: Servicios profesionales, técnicos, personales
     - **productos**: Artículos en venta, equipos, maquinaria
     - **eventos**: Eventos, cursos, talleres, actividades
     - **negocios**: Traspasos, franquicias, oportunidades de negocio
     - **comunidad**: Anuncios comunitarios, adopciones, perdidos y encontrados

4. **Contactos**:
   - Extrae TODOS los números de teléfono, WhatsApp y emails mencionados
   - Normaliza números: elimina espacios, guiones, paréntesis
   - Si hay múltiples contactos, marca el principal como `principal: true`
   - Tipos:
     - `telefono`: Números de teléfono fijo o celular
     - `whatsapp`: Números mencionados como WhatsApp o con indicador WA
     - `email`: Direcciones de correo electrónico

5. **Ubicación**:
   - Extrae ubicación mencionada (distrito, provincia, departamento)
   - Si menciona "Cusco" sin más detalles, usa "Cusco, Cusco, Cusco"
   - Si menciona distritos como "Wanchaq", "San Sebastián", etc., inclúyelos

6. **Tamaño Visual**:
   - Basado en el tamaño del anuncio en la página:
     - `miniatura`: Anuncios muy pequeños (1-2 líneas)
     - `pequeño`: Anuncios pequeños (3-5 líneas)
     - `mediano`: Anuncios medianos (6-10 líneas, ocupan espacio moderado)
     - `grande`: Anuncios grandes (11-20 líneas, ocupan espacio considerable)
     - `gigante`: Anuncios muy grandes (más de 20 líneas, ocupan mucho espacio)

7. **Precio y Fecha**:
   - Extrae precios mencionados (S/., $, soles)
   - Extrae fechas si están mencionadas explícitamente

### Ejemplos de Anuncios Típicos

**Ejemplo 1 - Empleo:**
```
RESTAURANTE "FULLHOUSE" EN MACHUPICCHU
REQUIERE:
- 01 SUPERVISORA DE SALÓN CON INGLÉS FLUIDO Y EXPERIENCIA
Enviar CV a: fullhousecontabilidad@gmail.com
WhatsApp: 941360271
```

**Ejemplo 2 - Inmueble:**
```
ALQUILO DEPARTAMENTO AMPLIO
De 3 dormitorios, sala - comedor, 2 baños y lavandería. 
Ubicado en Av. Los incas, Residencial Camila 1512, altura ICPNA. 
Informes a los Cels. 992619842, 987792972.
```

**Ejemplo 3 - Servicio:**
```
VETERINARIOS DE LOS POBRES A DOMICILIO
Peluquería con baño S/25, desparasitación S/5, vacuna y desp. S/.30
Para la atención reservar: CUPO al WhatsApp 924349665
```

### Instrucciones Específicas

1. **NO inventes información**: Solo extrae lo que está explícitamente en el texto
2. **NO combines anuncios**: Cada anuncio debe ser un objeto separado
3. **Extrae TODO**: No omitas anuncios, incluso si son pequeños
4. **Mantén formato**: Respeta el formato JSON estricto
5. **Normaliza contactos**: Limpia números y emails (sin espacios, guiones)
6. **Categoriza correctamente**: Usa tu mejor criterio para la categoría

### Texto de la Página a Procesar

```
[TEXTO_DE_LA_PAGINA_AQUI]
```

### Respuesta Esperada

Proporciona SOLO el JSON válido, sin texto adicional antes o después.

