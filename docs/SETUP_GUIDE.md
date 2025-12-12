# 🚀 ADIS AI - Setup & Deployment Guide

This guide will walk you through setting up the complete ADIS AI system from scratch.

---

## ⚡ Quick Start (5 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# 3. Run Supabase migration
# (Go to Supabase Dashboard → SQL Editor → Run the migration)

# 4. Generate embeddings for existing listings
npm run generate-embeddings

# 5. Start development server
npm run dev
```

---

## 📋 Prerequisites

- **Node.js**: v18 or higher
- **Supabase Account**: [supabase.com](https://supabase.com)
- **OpenAI API Key**: [platform.openai.com](https://platform.openai.com)
- **Git**: For version control

---

## 🔧 Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

This will install:
- ✅ Vercel AI SDK (`ai`, `@ai-sdk/openai`)
- ✅ OpenAI SDK (`openai`)
- ✅ Framer Motion (for animations)
- ✅ Zod (for schema validation)
- ✅ Existing dependencies (Next.js, Supabase, etc.)

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI (NEW - required for ADIS AI)
OPENAI_API_KEY=sk-proj-...

# Optional: WhatsApp (for multi-channel support)
WHATSAPP_API_TOKEN=your-whatsapp-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_VERIFY_TOKEN=your-verify-token
```

#### How to Get API Keys

**OpenAI API Key:**
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up / Log in
3. Navigate to API Keys
4. Create new secret key
5. Copy and paste into `.env.local`

**Supabase Keys:**
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Settings → API
4. Copy `URL`, `anon key`, and `service_role key`

### 3. Run Database Migration

#### Option A: Via Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `supabase/migrations/001_adis_ai_vector_search.sql`
5. Paste into the editor
6. Click **Run**

#### Option B: Via Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migration
supabase db push
```

#### ✅ Verify Migration

Run this query in SQL Editor to confirm:

```sql
-- Check if pgvector is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check if embedding column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'adisos' AND column_name = 'embedding';

-- Check if hybrid search function exists
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'match_adisos_hybrid';
```

### 4. Generate Embeddings for Existing Listings

**IMPORTANT:** Your existing `adisos` don't have embeddings yet. You need to generate them.

#### Option A: Via Script (Batch Processing)

Create a script `scripts/generate-embeddings.ts`:

```bash
npx tsx scripts/generate-embeddings.ts
```

(The script file is in the next section)

#### Option B: Manually via API Route

```bash
# Generate embeddings for all listings without embeddings
curl -X POST http://localhost:3000/api/admin/generate-embeddings

# Or visit in browser:
http://localhost:3000/api/admin/generate-embeddings
```

**Note:** This will cost approximately:
- 1000 listings × 100 tokens avg = 100,000 tokens
- Cost: ~$0.002 USD (very cheap!)

### 5. Test the System

#### Test 1: Hybrid Search

```bash
# Test via API
curl -X POST http://localhost:3000/api/test-search \
  -H "Content-Type: application/json" \
  -d '{"query": "trabajo de cocinero en cusco"}'
```

#### Test 2: Vision Analysis (Snap & Sell)

```bash
# Test via API (requires public image URL)
curl -X POST http://localhost:3000/api/test-vision \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "https://example.com/product.jpg"}'
```

#### Test 3: Chat Interface

```bash
npm run dev
# Visit http://localhost:3000
# Click the AI chat button
# Try: "Busco departamento en Cusco"
```

---

## 📁 Project Structure

```
/home/user/adis.lat/
├── actions/
│   ├── ai-chat.tsx          # Main AI chat with streamUI
│   ├── ai-search.ts         # Hybrid search action
│   └── ai-vision.ts         # Computer vision (Snap & Sell)
├── components/
│   ├── ai/
│   │   ├── ListingCard.tsx        # Generative UI: Search results
│   │   ├── DraftListingCard.tsx   # Generative UI: Snap & Sell
│   │   └── SkeletonComponents.tsx # Loading states
│   └── ChatbotIA.tsx        # (OLD - will be replaced)
├── lib/
│   ├── ai/
│   │   ├── openai-client.ts # OpenAI configuration
│   │   └── embeddings.ts    # Embedding generation
│   └── supabase.ts          # (existing)
├── supabase/
│   └── migrations/
│       └── 001_adis_ai_vector_search.sql  # Database migration
├── docs/
│   ├── ADIS_AI_ARCHITECTURE.md  # Full architecture docs
│   └── SETUP_GUIDE.md          # This file
├── scripts/
│   └── generate-embeddings.ts  # Batch embedding generation
├── .env.local               # Environment variables (create this)
└── package.json             # Dependencies
```

---

## 🛠️ Development Workflow

### Adding New Listings

When a new listing is created, you should generate its embedding:

```typescript
// In your create listing function:
import { generateAndStoreEmbedding } from '@/lib/ai/embeddings';

// After creating the adiso:
await generateAndStoreEmbedding(newAdiso.id);
```

### Monitoring Costs

Track your OpenAI API usage:

1. Go to [platform.openai.com/usage](https://platform.openai.com/usage)
2. Monitor daily usage
3. Set up billing alerts (Settings → Limits)

**Expected Costs (per month for 10,000 searches):**
- Embeddings: ~$2
- Search synthesis: ~$10
- Vision analysis: ~$20 (if used heavily)
- **Total: ~$30-40/month**

(Much cheaper than hiring customer support! 😄)

### Performance Optimization

**1. Cache Embeddings**

```typescript
// Cache common search queries
const queryCache = new Map<string, number[]>();

export async function getCachedEmbedding(text: string) {
  if (queryCache.has(text)) {
    return queryCache.get(text)!;
  }
  const embedding = await generateEmbedding(text);
  queryCache.set(text, embedding);
  return embedding;
}
```

**2. Batch Operations**

Use `generateEmbeddingsBatch()` instead of calling `generateEmbedding()` in a loop.

**3. Index Tuning**

For larger datasets (>100k listings), consider updating the IVFFlat index:

```sql
-- Drop old index
DROP INDEX idx_adisos_embedding;

-- Create new index with more lists (for large datasets)
CREATE INDEX idx_adisos_embedding
ON adisos USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 1000);  -- Adjust based on dataset size (rows / 1000)
```

---

## 🚀 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables in Vercel Dashboard
# (Vercel Dashboard → Settings → Environment Variables)
```

### Deploy to Other Platforms

ADIS AI works on any platform that supports Next.js:
- ✅ Vercel (recommended)
- ✅ Netlify
- ✅ Railway
- ✅ AWS Amplify
- ✅ Google Cloud Run
- ✅ Self-hosted (Docker)

---

## 🐛 Troubleshooting

### Error: "pgvector extension not found"

**Solution:** Enable the extension:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Error: "OpenAI API key not set"

**Solution:** Check `.env.local`:
```bash
# Verify file exists
cat .env.local | grep OPENAI_API_KEY

# Should output:
# OPENAI_API_KEY=sk-proj-...
```

### Error: "RPC function match_adisos_hybrid does not exist"

**Solution:** Re-run the migration SQL.

### Slow Search Performance

**Solution:**
1. Check if indexes exist:
   ```sql
   SELECT indexname FROM pg_indexes WHERE tablename = 'adisos';
   ```
2. Rebuild indexes if missing:
   ```sql
   REINDEX TABLE adisos;
   ```

### High OpenAI Costs

**Solution:**
1. Reduce `match_count` parameter (fewer results = cheaper)
2. Use GPT-4o-mini for more tasks
3. Implement query caching
4. Set usage limits in OpenAI dashboard

---

## 📊 Monitoring & Analytics

### Track AI Performance

Create a dashboard to monitor:
- Search queries per day
- Search success rate (results found > 0)
- Average similarity score
- Vision analysis requests
- Cost per operation

Query example:
```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_searches,
  AVG(results_count) as avg_results,
  COUNT(CASE WHEN results_count > 0 THEN 1 END) as successful_searches
FROM ai_search_logs
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 30;
```

---

## 🎓 Next Steps

1. ✅ Complete setup (you're here!)
2. 📱 Integrate WhatsApp (see `docs/WHATSAPP_INTEGRATION.md`)
3. 🎨 Customize UI components to match your brand
4. 📈 Set up analytics dashboard
5. 🧪 A/B test different hybrid search weights
6. 🌍 Add multi-language support (English, Quechua)

---

## 🆘 Support

- **Documentation:** [docs/ADIS_AI_ARCHITECTURE.md](./ADIS_AI_ARCHITECTURE.md)
- **Issues:** Report bugs via GitHub Issues
- **Community:** Join our Discord (link TBD)

---

**Built with ❤️ for Buscadis**

Happy coding! 🚀
