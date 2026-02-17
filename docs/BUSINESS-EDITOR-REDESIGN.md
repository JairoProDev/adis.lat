# Rediseño Completo del Editor de Negocios

## 🎯 Objetivo
Crear una experiencia mágica, guiada y en tiempo real para que usuarios sin conocimientos técnicos puedan crear su página de negocio fácilmente.

## 🎨 Paleta de Colores (ESTRICTA)
- **Primario**: Turquesa `#53acc5` (--brand-blue)
- **Secundario**: Amarillo `#ffc24a` (--brand-yellow)
- **Texto**: Grises naturales (nunca negro puro)
  - Principal: `#1e293b` 
  - Secundario: `#64748b`
  - Terciario: `#94a3b8`
- **Fondos**: Blancos y grises muy claros
  - Primario: `#ffffff`
  - Secundario: `#f8fafc`
- **❌ PROHIBIDO**: Negro `#000000` en botones principales
- **❌ PROHIBIDO**: Colores fuera de paleta (rosado, morado, azul oscuro)

## 🌟 Experiencia Nueva: Vista Unificada con Chatbot

### Concepto Principal
**Una sola vista** donde el usuario ve su página en tiempo real y un chatbot lo guía paso a paso.

### Componentes Principales

#### 1. **Chatbot Guiado (Abajo)**
- Posición: Parte inferior de la pantalla
- Tamaño: Altura variable, máximo 40% del viewport
- Comportamiento:
  - Minimizable a un botón flotante
  - Conversación paso a paso
  - Preguntas simples en español
  - Opciones visuales + campos libres
  - Aplica cambios en tiempo real mientras responde

**Flujo del Chatbot:**
```
1. "¡Hola! 👋 Vamos a crear tu página juntos. ¿Cómo se llama tu negocio?"
   → Campo de texto libre

2. "Genial, [Nombre del Negocio]! 🎉 ¿Cómo quieres que tus clientes te encuentren?"
   → Muestra: adis.lat/[sugerencia-automatica]
   → Permite editar solo la parte final

3. "Cuéntame brevemente sobre tu negocio en una o dos líneas"
   → Campo de texto

4. "¿Tienes un logo? Súbelo aquí o salta este paso"
   → Botón de subir imagen
   → Opción "Lo haré después"

5. "¿Quieres agregar una foto de portada?"
   → Botón de subir imagen
   → Opción "Lo haré después"

6. "Perfecto! ¿De qué color quieres tu página?"
   → Selector visual de colores predefinidos

7. "¿Cómo pueden contactarte tus clientes?"
   → Opciones: WhatsApp, Email, Teléfono, Dirección
   → Botones para seleccionar y llenar

8. "¡Casi listo! ¿Tienes productos para mostrar?"
   → "Sí, agregar ahora" → Flujo simplificado
   → "Lo haré después"

9. "¡Tu página está lista! 🎉 Puedes publicarla o seguir editando"
   → Botón "Publicar"
   → "Seguir editando"
```

#### 2. **Vista en Tiempo Real (Centro)**
- Muestra la página tal como se verá
- Cada elemento editable tiene un **lapicito pequeño** en esquina superior derecha
- Al hacer clic en lapicito:
  - Se abre mini-editor inline
  - Cambios se aplican inmediatamente
- Modo "Edición": Todos los lapicitos visibles
- Modo "Vista previa": Sin lapicitos

#### 3. **Elementos Editables con Lapicito**
Cada uno de estos tiene un ícono de lápiz al hacer hover/estar en modo edición:
- Logo
- Banner
- Nombre del negocio  
- Descripción
- Color de tema
- Información de contacto
- Horarios
- Redes sociales
- Productos del catálogo
- Barra de anuncios

#### 4. **Catálogo Simplificado**
**UN SOLO FLUJO** para agregar productos:

```
[BOTÓN GRANDE turquesa]
"+ Agregar Producto"

Al hacer clic →
┌─────────────────────────────────────┐
│ Chatbot pregunta:                   │
│ "¿Cómo quieres agregarlo?"         │
│                                     │
│ [📸 Foto Rápida]                   │
│ Solo toma/sube una foto y el      │
│ nombre. Listo.                     │
│                                     │
│ [📝 Con toda la info]              │
│ Precio, descripción, stock, etc.   │
│                                     │
│ [🤖 Subir archivo]                 │
│ Excel/CSV y la IA lo procesa       │
└─────────────────────────────────────┘
```

**Solo colores turquesa y amarillo**, nunca rosado/morado.

## 📋 Terminología Simplificada

### ❌ Términos Prohibidos
- "Slug"
- "URL"  
- "Schema"
- "Deploy"
- "Build"
- Cualquier término en inglés técnico

### ✅ Términos Permitidos
- "Nombre de usuario" (en lugar de slug)
- "Dirección web" o "Link" (en lugar de URL)
- "Guardar" (en lugar de save)
- "Publicar" (en lugar de publish)
- Siempre en español simple

## 🛠️ Implementación Técnica

### Archivos a Crear
1. `components/business/ChatbotGuide.tsx` - Chatbot principal
2. `components/business/EditableElement.tsx` - Wrapper para elementos editables
3. `components/business/UnifiedBusinessView.tsx` - Vista unificada nueva
4. `components/business/SimpleCatalogAdd.tsx` - Flujo único para catálogo

### Archivos a Modificar
1. `app/mi-negocio/page.tsx` - Reemplazar completamente
2. `app/globals.css` - Actualizar variables de color
3. `components/business/FormularioCatalogo.tsx` - Eliminar o hacer opcional

### Variables CSS a Actualizar
```css
:root {
  --brand-blue: #53acc5;      /* Turquesa */
  --brand-yellow: #ffc24a;    /* Amarillo */
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-tertiary: #94a3b8;
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --border-color: #e2e8f0;
}
```

## 🎭 Flujo de Usuario

### Primer Ingreso (Sin página creada)
1. Usuario llega a `/mi-negocio`
2. Ve una pantalla limpia con el chatbot abajo
3. Chatbot: "¡Hola! 👋 Vamos a crear tu página juntos..."
4. Mientras responde, ve su página formándose arriba
5. Al finalizar: Página completa, puede publicar o seguir editando

### Usuario Existente (Con página)
1. Usuario llega a `/mi-negocio`
2. Ve su página con un botón "Editar" (esquina superior derecha)
3. Al hacer clic:
   - Aparecen todos los lapicitos
   - Chatbot minimizado abajo por si necesita ayuda
4. Puede editar cualquier elemento directamente
5. Cambios se guardan automáticamente

## ✨ Detalles de Experiencia

### Micro-interacciones
- ✅ Animaciones suaves al aplicar cambios
- ✅ Feedback inmediato visual
- ✅ Confeti al publicar por primera vez
- ✅ Progreso visible durante creación
- ✅ Mensajes de éxito claros y celebratorios

### Manejo de Errores
- Sin jerga técnica
- Mensajes amigables: "Ups, algo salió mal. ¿Intentamos de nuevo?"
- Sugerencias claras de qué hacer

### Accesibilidad
- Tamaños de fuente legibles
- Contraste adecuado
- Compatible con mobile desde el inicio
- Touch targets de mínimo 44px

## 📱 Responsive

### Mobile
- Chatbot: Ocupa máximo 50% de pantalla
- Vista previa: 50% superior
- Botones grandes, fáciles de tocar

### Desktop
- Chatbot: Dock inferior, ~ 30% altura
- Vista previa: Centro, 70% altura
- Sidebar opcional con acceso rápido (no obligatorio)

## 🚀 Prioridad de Implementación

### Fase 1 (Inmediata) - ESTA SESIÓN
1. ✅ Actualizar paleta de colores
2. ✅ Crear ChatbotGuide básico
3. ✅ Crear UnifiedBusinessView
4. ✅ Simplificar catálogo a un solo flujo
5. ✅ Eliminar terminología técnica

### Fase 2 (Siguiente sesión si es necesario)
1. Implementar EditableElement con lapicitos
2. Pulir animaciones y micro-interacciones
3. Testing exhaustivo del flujo completo

## 🎯 Métricas de Éxito
- Usuario crea página completa en < 3 minutos
- 0 preguntas de confusión sobre términos técnicos
- 100% de cambios aplicados en tiempo real
- Feedback positivo sobre "experiencia mágica"
