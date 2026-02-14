# 🏆 ADIS.LAT BUSINESS PAGE MASTERPLAN
## La Plataforma TODO-EN-UNO que Reemplaza Todo

> **Visión**: Cada negocio en LATAM tendrá su página profesional en Adis.lat GRATIS, con tecnología superior a WordPress, más audiencia que redes sociales, y mejor conversión que cualquier e-commerce.

---

## 🎯 PROBLEMA QUE RESOLVEMOS

### ❌ LO QUE LOS NEGOCIOS SUFREN HOY:

1. **Presencia Digital Costosa**:
   - Dominio: $12-20 USD/año
   - Hosting: $5-30 USD/mes
   - Diseñador web: $300-5,000 USD
   - Webmaster mensual: $50-500 USD
   - WordPress/plugins: $0-200 USD/mes
   - No-code tools (Wix, Squarespace): $15-50 USD/mes

   **TOTAL: $500-6,000 USD al año** 💸

2. **Complejidad Técnica**:
   - Aprender WordPress
   - Configurar hosting
   - Instalar plugins
   - Actualizar constantemente
   - Problemas de seguridad
   - Performance lento

3. **Cero Audiencia Inicial**:
   - Tu página nueva = 0 visitantes
   - Tienes que pagar ads
   - SEO tarda meses
   - Redes sociales = alcance limitado

4. **Múltiples Herramientas Desconectadas**:
   - Página web en un lado
   - WhatsApp Business aparte
   - Redes sociales separadas
   - Catálogo en Excel/PDF
   - Analytics disperso

### ✅ NUESTRA SOLUCIÓN (ADIS.LAT):

```
🎁 GRATIS + 🤖 IA + 👥 AUDIENCIA + 📊 TODO INTEGRADO
```

**1. Página Profesional GRATIS**
- `adis.lat/negocio/tu-slug`
- Zero setup técnico
- IA crea todo por ti
- Responsive automático
- SEO optimizado desde día 1

**2. Audiencia Incluida**
- Apareces en búsqueda de Adis.lat
- Tus productos se ven en el marketplace
- Usuarios activos buscando lo que vendes
- Sistema de recomendaciones IA

**3. All-in-One Platform**
- Catálogo de productos
- E-commerce integrado
- WhatsApp Business integration
- Analytics completo
- CRM básico
- Marketing automation

**4. Superior a Competencia**
- Más rápido que WordPress
- Más fácil que Wix
- Más barato que Shopify (gratis!)
- Más audiencia que tu web propia

---

## 🏗️ ARQUITECTURA DE LA PÁGINA DE NEGOCIO

### ESTRUCTURA BASE

```
adis.lat/negocio/[slug-del-negocio]
│
├── 🏠 Home / Hero Section
├── 📦 Catálogo de Productos
├── 🛒 Checkout Flow
├── 📱 Botón de WhatsApp Flotante
├── 📍 Ubicación + Horarios
├── ⭐ Reseñas/Testimonios
├── 📝 Sobre Nosotros
├── 📞 Contacto
└── 🔗 Redes Sociales
```

### MÓDULOS PRINCIPALES

#### 1. **HERO SECTION** (Primera Impresión)
- Logo prominente
- Banner/cover image
- Tagline/descripción breve
- CTA principal (Ver catálogo, Pedir ahora)
- Badges sociales (Instagram, Facebook, etc.)
- Ubicación quick-view
- Horario de atención (abierto/cerrado en tiempo real)

#### 2. **CATÁLOGO INTELIGENTE** (Ya implementado ✅)
- Grid/lista de productos
- Filtros por categoría
- Búsqueda en tiempo real
- Ordenar por precio, popularidad, nuevo
- [AI-powered] Recomendaciones personalizadas

#### 3. **CHECKOUT FLOW** (WhatsApp Integration)
```
Usuario ve producto
  ↓
Añade al carrito
  ↓
Revisa orden
  ↓
Click "Pedir por WhatsApp"
  ↓
WhatsApp se abre con mensaje pre-llenado:
  "Hola! Quiero ordenar:
   - Producto 1 (cantidad, variante)
   - Producto 2 (cantidad, variante)
   
   Total: S/ XXX
   
   Nombre: [campo]
   Dirección de entrega: [campo]"
  ↓
Negocio confirma por WhatsApp
```

#### 4. **SOCIAL PROOF**
- Contador de productos activos
- "X personas vieron esto hoy"
- Reseñas de clientes (opcional)
- Badge "Verificado por Adis.lat"
- Tiempo en la plataforma

#### 5. **SECCIÓN DE UBICACIÓN**
- Mapa integrado (Google Maps embed)
- Dirección completa
- Horarios detallados
  - Lunes: 9:00 AM - 6:00 PM
  - Martes: 9:00 AM - 6:00 PM
  - Estado: "Abierto ahora" / "Cerrado - Abre mañana a las 9:00 AM"
- Botón "Cómo llegar"

#### 6. **SOBRE NOSOTROS**
- Historia del negocio (generada por IA si no existe)
- Misión/visión
- Equipo (opcional)
- Galería de fotos del local

#### 7. **CONTACTO MULTICHANNEL**
- WhatsApp (principal)
- Teléfono (click-to-call en móvil)
- Email
- Facebook Messenger
- Instagram DM
- Formulario de contacto

---

## 🎨 DISEÑO & TEMAS

### SISTEMA DE TEMAS

El negocio elige entre:

1. **Tema Moderno** (Default)
   - Clean, minimalista
   - Mucho espacio en blanco
   - Typography clara
   - Ideal para: tech, moda, servicios profesionales

2. **Tema Vibrante**
   - Colores llamativos
   - Gradientes
   - Bold typography
   - Ideal para: comida, eventos, productos juveniles

3. **Tema Clásico**
   - Elegante, sobrio
   - Serif fonts
   - Paleta neutral
   - Ideal para: joyería, abogados, medicina

4. **Tema Dark**
   - Fondo oscuro
   - Acentos neón
   - Futurista
   - Ideal para: gaming, tech, night clubs

### PERSONALIZACIÓN CON IA

```typescript
// IA extrae del logo y productos
const brandColors = await extractBrandColors(businessLogo, productImages);

// IA sugiere tema óptimo
const suggestedTheme = await suggestTheme({
  industry: "Pizzería",
  products: [...],
  targetAudience: "Familias, jóvenes"
});

// Usuario puede:
- Auto-aplicar sugerencia IA
- Customizar colores manualmente
- Elegir fuentes
- Ajustar espaciado
```

---

## 🚀 FEATURES AVANZADOS

### 1. **E-COMMERCE COMPLETO** (Más allá del catálogo)

#### a) Carrito de Compras
```tsx
// Estado global del carrito
interface Cart {
  items: CartItem[];
  total: number;
  subtotal: number;
  delivery_fee?: number;
  discount?: number;
}

interface CartItem {
  product_id: string;
  quantity: number;
  variant?: string; // ej: "Talla M", "Color Rojo"
  unit_price: number;
  subtotal: number;
  notes?: string; // "Sin cebolla", "Extra queso"
}
```

#### b) Opciones de Pago (Futuro)
- WhatsApp (default - manual)
- Yape/Plin QR (automático)
- Transferencia bancaria
- Contra-entrega
- [Premium] POS integration (Izipay, Culqi, Mercado Pago)

#### c) Gestión de Pedidos
```
Cliente hace pedido
  ↓
[DB] Se crea en `orders` table
  ↓
Negocio recibe notificación (WhatsApp + Dashboard)
  ↓
Negocio actualiza estado:
  - Pendiente
  - Confirmado
  - En preparación
  - En camino (con tracking link)
  - Entregado
  ↓
Cliente ve estado en tiempo real
```

### 2. **SISTEMA DE RESERVAS** (Para servicios)

Para restaurantes, salones de belleza, médicos, etc.:

```tsx
<ReservationWidget
  businessId="abc123"
  slots={[
    { time: "10:00 AM", available: true },
    { time: "11:00 AM", available: false },
    { time: "12:00 PM", available: true }
  ]}
  onReserve={(slot) => createReservation(slot)}
/>
```

Features:
- Calendario interactivo
- Selección de servicio
- Selección de fecha/hora
- Confirmación automática vía WhatsApp/Email
- Recordatorios automáticos

### 3. **CLUB DE LEALTAD / PUNTOS**

```typescript
interface LoyaltyProgram {
  name: string; // "Club PizzaAtlántica"
  points_per_purchase: number; // 10 puntos por cada S/ 100
  rewards: LoyaltyReward[];
  customers: LoyaltyCustomer[];
}

interface LoyaltyCustomer {
  phone: string;
  points: number;
  purchases_count: number;
  total_spent: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
}
```

Gamificación:
- "Compra 10 pizzas, la 11va gratis"
- "Acumula 500 puntos = 10% descuento"
- Tiers con beneficios incrementales
- Referidos (invita amigo = 50 puntos)

### 4. **ANALYTICS PODEROSO**

Dashboard del negocio muestra:

```
📊 ÚLTIMO MES:

┌─────────────────────────────────────┐
│ 🔍 Vistas de página:    12,450       │
│ 👁️  Productos vistos:    3,200       │
│ 💬 Clicks a WhatsApp:      340       │
│ 🛒 Pedidos generados:       87       │
│ 💰 Conversión:            25.6%      │
│ 💵 Ingresos estimados:  S/ 8,450     │
└─────────────────────────────────────┘

📈 PRODUCTOS TOP:
1. Pizza Margarita      (+45% vs. mes pasado)
2. Lasagna Bolognesa    (-12% vs. mes pasado)
3. Tiramisu             (Nuevo)

🕐 HORARIOS PICO:
- Viernes 7-9 PM: +300% tráfico
- Sábado 12-2 PM: +250% tráfico

💡 INSIGHTS IA:
- "Tus pizzas vegetarianas tienen 0 vistas. 
   Considera mejorar fotos o descripción."
- "Los viernes recibes 2x más consultas. 
   Considera promoción especial."
```

### 5. **MODO MULTI-SUCURSAL**

Para negocios con varias ubicaciones:

```
KFC Perú tiene:
├── adis.lat/kfc-miraflores
├── adis.lat/kfc-san-isidro
└── adis.lat/kfc-surco

Cada sucursal:
- Catálogo compartido (central)
- Horarios propios
- WhatsApp propio
- Inventario propio (opcional)
- Analytics propios
```

### 6. **MARKETING AUTOMATION**

Campañas automáticas:

```typescript
// Carrito abandonado
if (user.addedToCart && !user.purchased) {
  after(2hours).send({
    channel: 'whatsapp',
    message: "¡Hola! Vimos que dejaste productos en tu carrito. ¿Completamos tu pedido? 🛒"
  });
}

// Cliente frecuente
if (customer.purchases >= 5) {
  send({
    channel: 'whatsapp',
    message: "¡Gracias por tu preferencia! 🎉 Como agradecimiento, aquí tienes 15% OFF en tu próxima compra: CODIGO15"
  });
}

// Producto en oferta
if (product.discount > 20%) {
  sendTo(interestedUsers, {
    message: "¡OFERTA! {producto} ahora con {descuento}% OFF. Solo hoy 🔥"
  });
}
```

### 7. **INTEGRACIONES**

#### WhatsApp Business API
- Catálogo sincronizado bidireccional
- Auto-respuestas
- Chatbot básico con IA
- Mensajería masiva (dentro de políticas)

#### Redes Sociales
- Publicar producto → auto-post a Instagram/Facebook
- Sincronizar catálogo con Facebook Shop
- Instagram Shopping tags

#### Google My Business
- Sincronizar info del negocio
- Productos aparecen en Google Shopping

#### Delivery Apps (Futuro Premium)
- Rappi, PedidosYa integration
- Automáticamente sincronizar menú

---

## 🎯 USER JOURNEYS

### JOURNEY 1: NUEVO NEGOCIO SE REGISTRA

```
Día 1:
1. Usuario crea cuenta en Adis.lat
2. Click "Crear mi página de negocio"
3. IA pregunta:
   - ¿Qué vendes? (industria)
   - Nombre del negocio
   - Ubicación
   - WhatsApp de contacto
4. IA genera:
   - Slug: adis.lat/pizzatlantica
   - Tema sugerido: "Vibrante"
   - Colores de marca (de logo si sube)
   - Descripción inicial
5. Usuario sube logo (IA lo mejora)
6. Usuario importa catálogo con IA (PDF/fotos)
7. ✨ ¡Página lista en 10 minutos!
8. Usuario comparte link en WhatsApp/Instagram

Día 2:
- Primeras 50 vistas (de Adis.lat marketplace)
- 3 consultas por WhatsApp
- 1ra venta 🎉

Semana 1:
- 300 vistas
- 25 consultas
- 8 ventas
- S/ 680 facturado

Mes 1:
- Usuario se obsesiona con analytics
- Sube más productos
- Optimiza descripciones con IA
- Invita a otros negocios (referral)
```

### JOURNEY 2: CLIENTE COMPRA

```
1. Cliente busca "pizza delivery miraflores" en Google
2. Aparece resultado de Adis.lat
3. Entra a adis.lat/pizzatlantica
4. Ve hero con oferta del día
5. Scroll → Catálogo de pizzas
6. Click en "Pizza Margarita"
7. Modal con detalles + variantes:
   - Tamaño: Personal / Mediana / Grande
   - Masa: Tradicional / Delgada / Rellena
   - Extras: +Queso, +Pepperoni
8. Añade al carrito (2x Medianas)
9. Sigue navegando, añade 1 bebida
10. Click "Revisar pedido"
11. Ve resumen:
    - 2x Pizza Margarita Mediana: S/ 60
    - 1x Inca Kola 1.5L: S/ 8
    - Delivery: S/ 5
    - Total: S/ 73
12. Llena form:
    - Nombre
    - Dirección
    - Instrucciones especiales
13. Click "Pedir por WhatsApp"
14. WhatsApp abre con mensaje pre-llenado
15. Envía a negocio
16. Negocio confirma en 2 min
✅ Pedido completado
```

---

## 💎 FEATURES PREMIUM (MONETIZACIÓN)

### TIER GRATIS (80% de negocios)
- ✅ Página profesional
- ✅ Hasta 50 productos
- ✅ Catálogo con IA
- ✅ WhatsApp integration
- ✅ Analytics básico
- ✅ Tema predefinido
- ✅ Aparece en marketplace
- ⚠️ Branding "Powered by Adis.lat"

### TIER PRO - S/ 29/mes (15% de negocios)
- ✅ Todo lo de Gratis +
- ✅ Productos ilimitados
- ✅ Sin branding Adis.lat (white-label)
- ✅ Dominio custom (tudominio.com apunta a adis.lat)
- ✅ Analytics avanzado
- ✅ Email marketing (500 emails/mes)
- ✅ Reservas/citas
- ✅ Club de lealtad
- ✅ Prioridad en búsqueda
- ✅ Soporte prioritario

### TIER ENTERPRISE - S/ 99/mes (5% de negocios)
- ✅ Todo lo de Pro +
- ✅ Multi-sucursal
- ✅ API access
- ✅ Integraciones premium (POS, delivery apps)
- ✅ WhatsApp Business API
- ✅ Campañas automáticas ilimitadas
- ✅ Manager dedicado
- ✅ Custom features

### COMISIÓN POR VENTA (Alternativa)
- 2-5% por venta generada vía plataforma
- Se cobra cuando negocio activa pagos digitales

---

## 🛠️ TECH STACK ACTUALIZADO

### FRONTEND
```typescript
- Next.js 14+ (App Router)
- React Server Components
- TailwindCSS + CSS Variables
- Framer Motion (animaciones)
- Zustand (state management)
- React Query (data fetching)
```

### BACKEND
```typescript
- Next.js API Routes
- Supabase (DB + Auth + Storage + Realtime)
- Edge Functions (serverless)
- Vercel (hosting)
```

### AI & AUTOMATION
```typescript
- Gemini 2.0 Flash (content generation, extraction)
- OpenAI GPT-4o-mini (fallback, chat)
- Replicate (image enhancement)
- Resend (emails)
```

### INTEGRATIONS
```typescript
- WhatsApp Business API (Meta/Twilio)
- Google Maps API
- Google My Business API
- Facebook/Instagram Graph API
- Yape/Plin SDK
- Payment gateways (Culqi, Izipay)
```

---

## 📊 DATABASE SCHEMA ACTUALIZADO

### NUEVAS TABLAS NECESARIAS

```sql
-- Carrito de compras (session-based)
CREATE TABLE shopping_carts (
  id UUID PRIMARY KEY,
  session_id TEXT,
  user_id UUID REFERENCES auth.users(id),
  business_profile_id UUID REFERENCES business_profiles(id),
  items JSONB, -- Array de cart items
  total DECIMAL(10,2),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  expires_at TIMESTAMP
);

-- Pedidos
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  business_profile_id UUID,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  customer_address TEXT,
  items JSONB,
  subtotal DECIMAL(10,2),
  delivery_fee DECIMAL(10,2),
  discount DECIMAL(10,2),
  total DECIMAL(10,2),
  status TEXT, -- pending, confirmed, preparing, delivering, completed, cancelled
  payment_method TEXT,
  payment_status TEXT,
  special_instructions TEXT,
  estimated_delivery TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Clientes del negocio (loyalty)
CREATE TABLE business_customers (
  id UUID PRIMARY KEY,
  business_profile_id UUID,
  phone TEXT,
  name TEXT,
  email TEXT,
  loyalty_points INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  tier TEXT, -- bronze, silver, gold, platinum
  created_at TIMESTAMP,
  last_purchase_at TIMESTAMP
);

-- Reservas/citas
CREATE TABLE reservations (
  id UUID PRIMARY KEY,
  business_profile_id UUID,
  customer_name TEXT,
  customer_phone TEXT,
  service TEXT,
  date DATE,
  time TIME,
  duration_minutes INTEGER,
  status TEXT, -- pending, confirmed, completed, cancelled
  notes TEXT,
  created_at TIMESTAMP
);

-- Horarios del negocio
CREATE TABLE business_hours (
  id UUID PRIMARY KEY,
  business_profile_id UUID,
  day_of_week INTEGER, -- 0=Sunday, 6=Saturday
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMP
);

-- Reseñas/valoraciones
CREATE TABLE business_reviews (
  id UUID PRIMARY KEY,
  business_profile_id UUID,
  customer_name TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  order_id UUID REFERENCES orders(id),
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP
);
```

---

## 🎨 COMPONENTES UI A CREAR

```
components/business-page/
├── Hero/
│   ├── HeroModern.tsx
│   ├── HeroVibrant.tsx
│   ├── HeroClassic.tsx
│   └── HeroDark.tsx
├── ProductGrid/
│   ├── GridView.tsx
│   ├── ListView.tsx
│   ├── ProductCard.tsx
│   └── ProductModal.tsx
├── Cart/
│   ├── CartDrawer.tsx
│   ├── CartItem.tsx
│   └── CheckoutForm.tsx
├── Location/
│   ├── MapEmbed.tsx
│   ├── BusinessHours.tsx
│   └── HowToGet.tsx
├── Contact/
│   ├── WhatsAppButton.tsx (floating)
│   ├── ContactForm.tsx
│   └── SocialLinks.tsx
├── Reviews/
│   ├── ReviewsList.tsx
│   ├── ReviewCard.tsx
│   └── AddReviewModal.tsx
├── Reservation/
│   ├── ReservationWidget.tsx
│   └── Calendar.tsx
└── Analytics/
    ├── DashboardStats.tsx
    ├── ProductPerformance.tsx
    └── InsightsPanel.tsx
```

---

## 📅 ROADMAP DE IMPLEMENTACIÓN

### FASE 1: FOUNDATION (SEMANA 1-2) ✅ PARCIALMENTE HECHO
- [x] DB schema (catalog)
- [x] AI infrastructure (Gemini, Replicate)
- [x] Catalog import wizard
- [x] Product CRUD APIs
- [ ] Business hours table + UI
- [ ] Temas básicos (4 variantes)
- [ ] Preview de página pública

### FASE 2: E-COMMERCE (SEMANA 3-4)
- [ ] Shopping cart (client-side state)
- [ ] Checkout flow
- [ ] Orders table + API
- [ ] WhatsApp message generation
- [ ] Order tracking para negocio
- [ ] Order status updates

### FASE 3: FEATURES AVANZADOS (SEMANA 5-6)
- [ ] Reservations system
- [ ] Business reviews
- [ ] Loyalty program
- [ ] Email notifications (Resend)
- [ ] Analytics dashboard mejorado

### FASE 4: INTEGRACIONES (SEMANA 7-8)
- [ ] WhatsApp Business API
- [ ] Google Maps embed
- [ ] Facebook/Instagram sync
- [ ] Yape/Plin QR codes
- [ ] Google My Business

### FASE 5: PREMIUM FEATURES (SEMANA 9-10)
- [ ] Custom domains
- [ ] Multi-branch support
- [ ] Email marketing
- [ ] Advanced automation
- [ ] API for developers

### FASE 6: POLISH & LAUNCH (SEMANA 11-12)
- [ ] Onboarding tour
- [ ] Templates gallery
- [ ] SEO optimization
- [ ] Performance optimization
- [ ] Beta testing
- [ ] Public launch 🚀

---

## 🎯 SUCCESS METRICS

### Para Negocios:
- Tiempo de setup: < 15 minutos
- Primera venta: < 7 días
- Retención mes 3: > 70%
- NPS: > 50

### Para Plataforma:
- Growth: +500 negocios/mes
- GMV (Gross Merchandise Value): $500K/mes a fin de año 1
- Conversion free→pro: 10-15%
- Revenue: $15K MRR a fin de año 1

---

## 🚀 COMPETITIVE ADVANTAGES

| Feature | WordPress | Wix | Shopify | **Adis.lat** |
|---------|-----------|-----|---------|--------------|
| **Precio** | $5-100/mes | $16-45/mes | $29-299/mes | **GRATIS** |
| **Setup Time** | 2-4 horas | 1-2 horas | 1-2 horas | **10 min** |
| **IA Integration** | ❌ | Limitada | Limitada | **✅ Full** |
| **Audiencia Incluida** | ❌ | ❌ | ❌ | **✅ Marketplace** |
| **WhatsApp Native** | Plugin | Plugin | App | **✅ Nativo** |
| **Catálogo IA** | ❌ | ❌ | ❌ | **✅ Único** |
| **Learning Curve** | Alto | Medio | Medio | **Cero** |
| **LATAM Focus** | ❌ | ❌ | ❌ | **✅ 100%** |

---

**🔥 PRÓXIMO PASO: IMPLEMENTAR TODO ESTO** 

¿Empezamos con el Hero Section y temas visuales, o prefieres que enfoque en el e-commerce (carrito + checkout)?
