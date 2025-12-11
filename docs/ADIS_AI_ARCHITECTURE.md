# 🤖 ADIS AI - Architecture Documentation

> **Vision**: Transform Buscadis from a static classifieds marketplace into an AI-first, conversational platform that actively assists users in buying and selling through natural language and visual intelligence.

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Core Philosophy: RAG vs Fine-Tuning](#core-philosophy)
3. [Technical Architecture](#technical-architecture)
4. [The "Generative UI" Experience](#generative-ui)
5. [Multi-Channel Strategy](#multi-channel)
6. [Implementation Roadmap](#roadmap)
7. [Cost Optimization](#cost-optimization)
8. [Security & Privacy](#security)

---

## 🎯 Executive Summary

### The Problem
Traditional marketplaces force users to:
- Fill lengthy forms to publish listings
- Use keyword search (fails with synonyms, typos)
- Browse through irrelevant results

### The Solution: ADIS AI
- **Conversational Publishing**: "I want to sell my bike" → AI asks smart questions → Auto-fills listing
- **Semantic Search**: "busco chamba en cocina" understands "trabajo de cocinero"
- **Visual Intelligence**: Upload photo → AI identifies item, suggests price
- **Proactive Assistance**: AI remembers preferences, notifies about relevant new listings

### Key Differentiators
| Feature | Traditional Marketplaces | ADIS AI |
|---------|-------------------------|---------|
| Search | Keyword-only | Semantic + Keyword (Hybrid) |
| Publish | Manual forms | Conversational wizard |
| Images | Upload-only | AI analyzes & auto-fills |
| UI | Static lists | Dynamic components (Generative UI) |
| Personalization | Saved searches | Proactive recommendations |

---

## 🧠 Core Philosophy: RAG vs Fine-Tuning

### Why NOT Fine-Tuning?

**Fine-Tuning** = Teaching the LLM to memorize your data.

❌ **Problems**:
- Your listings change **daily** (new ads, expired ads)
- Re-training is **expensive** (~$100+ per run)
- Re-training is **slow** (hours to days)
- Hallucinates outdated information

### Why RAG (Retrieval-Augmented Generation)?

**RAG** = Teaching the LLM to use a **search engine** to find current data.

✅ **Benefits**:
- Works with **dynamic data** (new listings are instantly searchable)
- **Zero re-training** (just update the database)
- **Factual** (always retrieves real listings, no hallucinations)
- **Cost-effective** (~$0.001 per search)

### How RAG Works (Simple Analogy)

Imagine the LLM is a **smart librarian**:

1. **Without RAG** (Fine-Tuning):
   - You: "Are there cooking jobs?"
   - LLM: "Last time I checked (3 months ago), there were 5 cooking jobs..." ❌ (Outdated)

2. **With RAG**:
   - You: "Are there cooking jobs?"
   - LLM: "Let me check the database..." (searches) "Yes! I found 3 cooking jobs posted this week. Here they are..." ✅

---

## 🏗️ Technical Architecture

### The Stack

```
┌─────────────────────────────────────────────────┐
│            Frontend (Next.js 14)                │
│  ┌────────────┐  ┌─────────────────────────┐   │
│  │  Web App   │  │  Vercel AI SDK (UI)     │   │
│  │  (React)   │  │  - streamUI             │   │
│  └────────────┘  │  - Generative Components│   │
│                  └─────────────────────────┘   │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│         Backend (Next.js API Routes)            │
│  ┌──────────────────────────────────────────┐  │
│  │  Vercel AI SDK (Core)                    │  │
│  │  - OpenAI GPT-4o (Reasoning + Vision)    │  │
│  │  - GPT-4o-mini (Fast routing)            │  │
│  │  - Tool Calling (Function execution)     │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│      Database (Supabase PostgreSQL)             │
│  ┌──────────────────────────────────────────┐  │
│  │  pgvector (Semantic Search)              │  │
│  │  - Embeddings (1536-dim vectors)         │  │
│  │  - Cosine Similarity                     │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  Full-Text Search (Keyword Search)       │  │
│  │  - tsvector (Spanish tokenization)       │  │
│  │  - GIN index                             │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  Hybrid Search Function                  │  │
│  │  = 70% Semantic + 30% Keyword            │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Data Flow: Search Example

```
User: "Busco trabajo de cocinero en Cusco"
  │
  ▼
[Router Agent] (GPT-4o-mini)
  │ → Classifies intent: "search"
  ▼
[Embedding Generator] (OpenAI text-embedding-3-small)
  │ → Converts query to vector: [0.12, -0.54, ...]
  ▼
[Hybrid Search Function] (Supabase)
  │ → Semantic: Find vectors close to query vector
  │ → Keyword: Find "cocinero" OR "cocina" in text
  │ → Combine: Weighted ranking
  ▼
[Results] (JSON)
  │ → 3 job listings
  ▼
[Synthesis Agent] (GPT-4o)
  │ → Reads results + context
  │ → Generates natural response
  │ → Decides UI component to render
  ▼
[Generative UI] (React)
  │ → Renders <JobListingCards /> component
  ▼
User sees: Interactive cards with "Apply" buttons
```

---

## 🎨 The "Generative UI" Experience

### What is Generative UI?

Instead of the AI responding with **text**, it responds with **React components**.

#### Old Way (Boring Chatbot)
```
User: "Show me apartments in Cusco"
AI: "Here are 3 apartments:
1. Departamento en Wanchaq - S/ 800
2. Casa en San Sebastián - S/ 1200
3. ..."
```
❌ Plain text, hard to interact with

#### New Way (Generative UI)
```
User: "Show me apartments in Cusco"
AI: [Renders <PropertyCarousel /> component]
```
✅ User sees:
- Image carousel
- Interactive map
- "Contact Owner" button
- Price filters (sliders)

### Implementation with Vercel AI SDK

```typescript
// actions/chat.tsx (Server Action)
import { streamUI } from 'ai/rsc';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export async function chat(userMessage: string) {
  const result = await streamUI({
    model: openai('gpt-4o'),
    messages: [
      { role: 'user', content: userMessage }
    ],
    tools: {
      search_marketplace: {
        description: 'Search for listings in the marketplace',
        parameters: z.object({
          query: z.string(),
          category: z.enum(['empleos', 'inmuebles', 'vehiculos', ...]),
          location: z.string().optional(),
        }),
        generate: async function* ({ query, category, location }) {
          // Yield skeleton first (instant feedback)
          yield <SearchingSkeleton />;

          // Perform hybrid search
          const results = await hybridSearch(query, category, location);

          // Render actual results
          return <ListingGrid items={results} />;
        },
      },
    },
  });

  return result.value;
}
```

### Component Registry

We create a set of **AI-renderable components**:

| Component | When Used | Props |
|-----------|-----------|-------|
| `<ListingGrid />` | Search results | `{ items: Adiso[] }` |
| `<PropertyCarousel />` | Real estate results | `{ properties: Adiso[] }` |
| `<JobCard />` | Job listings | `{ job: Adiso }` |
| `<PriceRangeSlider />` | User wants to filter price | `{ min, max, onChange }` |
| `<DraftListingWizard />` | User wants to publish | `{ prefillData }` |
| `<MapView />` | Location-based search | `{ markers: Location[] }` |

---

## 🤳 The "Snap & Sell" Module (Computer Vision)

### The Problem
Publishing a listing is **friction**:
- "What category is this?"
- "Write a title..."
- "Write a description..."
- "What price should I ask?"

Users **abandon** the form.

### The Solution: Visual Intelligence

```
User: [Uploads photo of Nike shoes]
  │
  ▼
[GPT-4o Vision API]
  │ → Analyzes image
  │ → Identifies: Brand, Model, Condition, Color
  ▼
[Structured Output] (Zod Schema)
  {
    "title": "Nike Air Jordan 1 High - Chicago",
    "category": "productos",
    "condition": "usado_bueno",
    "detected_tags": ["zapatillas", "nike", "jordan"],
    "estimated_value": { min: 400, max: 600 }
  }
  │
  ▼
[Market Price Checker] (RAG Query)
  │ → Searches DB for similar "Nike Jordan" listings
  │ → Calculates average price: S/ 500
  ▼
[AI Response]
  "Veo unas Nike Air Jordan 1 High, modelo Chicago.
   Están en buen estado. En Buscadis se venden por S/ 400-600.
   ¿Las publicamos a S/ 500?"

  [Renders <DraftListingCard /> with pre-filled data]
```

### Implementation

```typescript
// actions/vision-analyze.ts
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const ItemSchema = z.object({
  title: z.string(),
  category: z.enum(['productos', 'vehiculos', ...]),
  condition: z.enum(['nuevo', 'como_nuevo', 'usado_bueno', 'usado_regular']),
  color: z.string(),
  brand: z.string().optional(),
  estimated_value: z.object({
    min: z.number(),
    max: z.number(),
  }),
});

export async function analyzeImage(imageUrl: string) {
  // Step 1: Vision Analysis
  const { object } = await generateObject({
    model: openai('gpt-4o'),
    schema: ItemSchema,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Analyze this item for a classifieds listing. Be accurate about condition.' },
          { type: 'image', image: imageUrl },
        ],
      },
    ],
  });

  // Step 2: Market Price Check (RAG)
  const similarListings = await hybridSearch(
    `${object.brand} ${object.title}`,
    object.category
  );

  const avgPrice = similarListings.reduce((sum, item) => sum + (item.precio || 0), 0) / similarListings.length;

  return {
    ...object,
    suggested_price: avgPrice,
    market_data: similarListings.slice(0, 3),
  };
}
```

---

## 🌐 Multi-Channel Strategy (Web vs WhatsApp)

### The Challenge
- **Web**: Can render rich React components
- **WhatsApp**: Text + simple buttons/lists only

### The Solution: Adapter Pattern

```typescript
// lib/response-adapter.ts
type Channel = 'web' | 'whatsapp';

interface AIResponse {
  type: 'search_results' | 'listing_wizard' | 'text';
  data: any;
}

export function renderResponse(response: AIResponse, channel: Channel) {
  if (channel === 'web') {
    return renderWebComponent(response);
  } else {
    return renderWhatsAppMessage(response);
  }
}

function renderWebComponent(response: AIResponse) {
  switch (response.type) {
    case 'search_results':
      return <ListingGrid items={response.data} />;
    case 'listing_wizard':
      return <DraftListingWizard prefill={response.data} />;
    default:
      return <TextBubble text={response.data} />;
  }
}

function renderWhatsAppMessage(response: AIResponse) {
  switch (response.type) {
    case 'search_results':
      // Map to WhatsApp List Message
      return {
        type: 'list',
        header: `Encontré ${response.data.length} resultados`,
        body: 'Selecciona una opción:',
        sections: [
          {
            title: 'Resultados',
            rows: response.data.map((item, i) => ({
              id: item.id,
              title: item.titulo.substring(0, 24),
              description: item.descripcion.substring(0, 72),
            })),
          },
        ],
      };
    case 'listing_wizard':
      // Map to Reply Buttons
      return {
        type: 'button',
        body: '¿Qué categoría es tu adiso?',
        buttons: [
          { id: 'empleos', title: 'Empleos' },
          { id: 'inmuebles', title: 'Inmuebles' },
          { id: 'vehiculos', title: 'Vehículos' },
        ],
      };
    default:
      return { type: 'text', body: response.data };
  }
}
```

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [x] SQL Migration (pgvector + hybrid search)
- [ ] Install dependencies (Vercel AI SDK, OpenAI)
- [ ] Create embedding generation service
- [ ] Test hybrid search function

### Phase 2: Core AI (Week 2)
- [ ] Implement semantic router
- [ ] Build search tool (hybrid query)
- [ ] Build vision analysis tool
- [ ] Create system prompts

### Phase 3: Generative UI (Week 3)
- [ ] Build component registry
- [ ] Implement streamUI in chat
- [ ] Create skeleton loaders
- [ ] Add glassmorphism styling

### Phase 4: Snap & Sell (Week 4)
- [ ] Image upload handler
- [ ] Vision analysis pipeline
- [ ] Market price checker
- [ ] Draft listing component

### Phase 5: Multi-Channel (Week 5)
- [ ] WhatsApp Cloud API integration
- [ ] Response adapter
- [ ] Webhook handler
- [ ] Message queue

### Phase 6: Optimization & Launch (Week 6)
- [ ] Cost monitoring dashboard
- [ ] A/B testing (hybrid weights)
- [ ] Analytics integration
- [ ] User feedback loop

---

## 💰 Cost Optimization

### The Problem: AI is Expensive

- GPT-4o: **$5 per 1M input tokens**, $15 per 1M output tokens
- text-embedding-3-small: **$0.02 per 1M tokens**

**Example without optimization**:
- 1000 searches/day
- Each search uses GPT-4o to read 500 tokens (context) + generates 200 tokens
- Cost: **~$4/day = $120/month** 😱

### The Solution: Semantic Router

```
           ┌─────────────────────┐
User Input │ "Buscar trabajo"    │
           └──────────┬──────────┘
                      │
                      ▼
           ┌─────────────────────┐
           │  Router (GPT-4o-mini)│  ← $0.15 per 1M tokens (33x cheaper!)
           │  Classifies intent   │
           └──────────┬──────────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
         ▼            ▼            ▼
    [Search]     [Publish]    [Chitchat]
         │            │            │
         ▼            ▼            ▼
  Use GPT-4o    Use GPT-4o   Reply directly
  (expensive)   (expensive)  (free!)
```

**Savings**:
- 70% of messages are **simple intent classification** → Use GPT-4o-mini
- 20% are **searches** → Only call GPT-4o for synthesis
- 10% are **chitchat** → Pre-defined responses (free!)
- **New cost: ~$1.50/day = $45/month** ✅ (60% savings)

### Additional Optimizations

1. **Embedding Cache**
   - Cache embeddings for common queries
   - "buscar trabajo" = `[0.12, -0.54, ...]` (stored)
   - Reuse for identical queries

2. **Streaming Responses**
   - Use `streamUI` instead of waiting for full response
   - User sees skeleton → partial results → final results
   - **Perceived speed**: 3x faster

3. **Batch Operations**
   - Generate embeddings for multiple listings at once
   - OpenAI batch API: **50% discount**

---

## 🔒 Security & Privacy

### Data Protection

1. **Embeddings are NOT reversible**
   - Vector `[0.12, -0.54, ...]` cannot be decoded back to original text
   - Safe to store in database

2. **Row-Level Security (RLS)**
   ```sql
   -- Users can only see their own conversation history
   CREATE POLICY "Users see own conversations"
   ON ai_conversations FOR SELECT
   USING (auth.uid() = user_id);
   ```

3. **Image Analysis Privacy**
   - Images sent to OpenAI Vision API are **NOT stored** by OpenAI (per their policy)
   - Option: Self-hosted vision models (LLaVA, Moondream) for sensitive data

### API Key Management

```env
# .env.local (NEVER commit to git)
OPENAI_API_KEY=sk-proj-...
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Backend only!
WHATSAPP_API_TOKEN=...
```

---

## 📊 Success Metrics

Track these KPIs to measure ADIS AI's impact:

| Metric | Before AI | Target with AI |
|--------|-----------|----------------|
| **Search Success Rate** | 40% | 75% |
| **Publish Completion Rate** | 25% | 60% |
| **Avg. Time to Publish** | 5 min | 1.5 min |
| **User Return Rate (7d)** | 15% | 40% |
| **Support Tickets** | 50/week | 20/week |

---

## 🎓 Glossary

- **RAG**: Retrieval-Augmented Generation (search-then-generate)
- **Embedding**: Numerical representation of text (vector)
- **pgvector**: PostgreSQL extension for vector storage
- **Hybrid Search**: Semantic + Keyword search combined
- **Generative UI**: AI-generated React components
- **Tool Calling**: LLM invokes functions (e.g., database query)
- **streamUI**: Vercel AI SDK feature for streaming components

---

## 📚 Further Reading

- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [Supabase pgvector Guide](https://supabase.com/docs/guides/ai)
- [RAG Best Practices](https://www.pinecone.io/learn/retrieval-augmented-generation/)

---

**Built with ❤️ for Buscadis by the ADIS AI Team**
