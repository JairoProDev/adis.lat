/**
 * API: AI Image Enhancement for Catalog Products
 *
 * Capabilities:
 * - remove_bg: Removes background (Replicate RMBG)
 * - upscale: 4x upscaling (Replicate Real-ESRGAN)
 * - analyze: Analyze product details from image (Gemini Vision)
 * - detect_multi: Detect multiple products in one image (Gemini Vision)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import sharp from 'sharp';

export const runtime = 'nodejs';
export const maxDuration = 120;

async function authenticate(request: NextRequest) {
    const supabase = await createServerClient();
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    if (token) {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) return user;
    }
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

async function fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string }> {
    const resp = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!resp.ok) throw new Error(`Failed to fetch image: ${resp.status}`);
    const arrayBuffer = await resp.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = resp.headers.get('content-type') || 'image/jpeg';
    const base64 = buffer.toString('base64');
    return { base64, mimeType };
}

async function uploadToSupabase(buffer: Buffer, mimeType: string, prefix: string): Promise<string> {
    const supabase = await createServerClient();
    const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
    const filename = `enhanced/${prefix}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
        .from('catalog-images')
        .upload(filename, buffer, {
            contentType: mimeType,
            cacheControl: '31536000',
            upsert: false
        });
    if (error) throw new Error(`Storage upload failed: ${error.message}`);
    const { data: { publicUrl } } = supabase.storage
        .from('catalog-images')
        .getPublicUrl(filename);
    return publicUrl;
}

// ── Remove Background via Replicate ──────────────────────────────────────────

async function removeBackground(imageUrl: string): Promise<string> {
    const replicateToken = process.env.REPLICATE_API_TOKEN;
    if (!replicateToken) throw new Error('Replicate API no configurado');

    const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
            'Authorization': `Token ${replicateToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            version: '95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1',
            input: { image: imageUrl }
        })
    });

    const prediction = await response.json();
    const predictionId = prediction.id;

    // Poll for result
    for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const poll = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
            headers: { 'Authorization': `Token ${replicateToken}` }
        });
        const result = await poll.json();
        if (result.status === 'succeeded') {
            return result.output as string;
        }
        if (result.status === 'failed') {
            throw new Error('Background removal failed: ' + result.error);
        }
    }
    throw new Error('Background removal timed out');
}

// ── Upscale via Replicate ─────────────────────────────────────────────────────

async function upscaleImage(imageUrl: string): Promise<string> {
    const replicateToken = process.env.REPLICATE_API_TOKEN;
    if (!replicateToken) throw new Error('Replicate API no configurado');

    const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
            'Authorization': `Token ${replicateToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            version: '42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b',
            input: { image: imageUrl, scale: 2, face_enhance: false }
        })
    });

    const prediction = await response.json();
    const predictionId = prediction.id;

    for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const poll = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
            headers: { 'Authorization': `Token ${replicateToken}` }
        });
        const result = await poll.json();
        if (result.status === 'succeeded') {
            return result.output as string;
        }
        if (result.status === 'failed') {
            throw new Error('Upscale failed: ' + result.error);
        }
    }
    throw new Error('Upscale timed out');
}

// ── Sharpen/Optimize via Sharp (free, fast) ───────────────────────────────────

async function optimizeImage(imageUrl: string): Promise<{ url: string; improved: boolean }> {
    try {
        const resp = await fetch(imageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!resp.ok) throw new Error('Cannot fetch image');
        const arrayBuffer = await resp.arrayBuffer();
        const inputBuffer = Buffer.from(arrayBuffer);

        const optimized = await sharp(inputBuffer)
            .resize(1200, 1200, { fit: 'inside', withoutEnlargement: false })
            .sharpen({ sigma: 1.2, m1: 0.5, m2: 0.5 })
            .jpeg({ quality: 90, mozjpeg: true })
            .toBuffer();

        const url = await uploadToSupabase(optimized, 'image/jpeg', 'optimized');
        return { url, improved: true };
    } catch (err) {
        return { url: imageUrl, improved: false };
    }
}

// ── Detect Multiple Products via Gemini ───────────────────────────────────────

async function detectMultipleProducts(imageUrl: string, base64: string, mimeType: string) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Gemini API key no configurado');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Analiza esta imagen y detecta si contiene MÚLTIPLES productos diferentes.

Responde ÚNICAMENTE con JSON en este formato exacto:
{
  "multiple_products": true/false,
  "count": número de productos (1 si hay solo uno),
  "products": [
    {
      "name": "nombre del producto",
      "description": "descripción breve",
      "category": "categoría sugerida",
      "position": "descripción de su posición en la imagen (ej: izquierda, centro, arriba-derecha)"
    }
  ],
  "recommendation": "qué hacer (usar_tal_cual / separar_manualmente / recortar_individualmente)"
}

Si hay UN solo producto, igual describirlo en el array con 1 elemento.
Si hay múltiples, listar cada uno.`;

    const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64, mimeType } }
    ]);

    const text = result.response.text()
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

    return JSON.parse(text);
}

// ── Analyze Product Details via Gemini ────────────────────────────────────────

async function analyzeProductDetails(base64: string, mimeType: string) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Gemini API key no configurado');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Eres un experto en comercio electrónico y catálogos de productos. Analiza esta imagen y extrae TODA la información posible del producto.

Responde ÚNICAMENTE con JSON en este formato exacto (sin markdown):
{
  "title": "nombre comercial del producto, máx 60 caracteres",
  "description": "descripción persuasiva y detallada para vender, 30-60 palabras",
  "price": número o null (si ves un precio en la imagen),
  "category": "categoría principal del producto",
  "subcategory": "subcategoría más específica o null",
  "brand": "marca si es visible o null",
  "sku": "código SKU o código de barras si es visible o null",
  "unit": "unidad de venta (unidad, par, caja, kg, metro, litro, etc.)",
  "attributes": {
    "color": "color si aplica",
    "material": "material si aplica",
    "size": "tamaño/medida si aplica",
    "weight": "peso si aplica"
  },
  "tags": ["tag1", "tag2", "tag3"],
  "condition": "nuevo o usado",
  "confidence": número entre 0 y 1 indicando confianza en los datos,
  "notes": "observaciones importantes sobre la imagen o el producto"
}`;

    const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64, mimeType } }
    ]);

    const text = result.response.text()
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

    return JSON.parse(text);
}

// ── Main Handler ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        const user = await authenticate(request);
        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { imageUrl, actions } = body as {
            imageUrl: string;
            actions: Array<'remove_bg' | 'upscale' | 'optimize' | 'analyze' | 'detect_multi'>;
        };

        if (!imageUrl) {
            return NextResponse.json({ error: 'Se requiere imageUrl' }, { status: 400 });
        }
        if (!actions || actions.length === 0) {
            return NextResponse.json({ error: 'Se requieren acciones' }, { status: 400 });
        }

        const results: Record<string, any> = {};
        let currentImageUrl = imageUrl;

        // Fetch image once for Gemini actions
        let imageData: { base64: string; mimeType: string } | null = null;
        const needsBase64 = actions.includes('analyze') || actions.includes('detect_multi');
        if (needsBase64) {
            imageData = await fetchImageAsBase64(imageUrl);
        }

        // Execute actions
        for (const action of actions) {
            try {
                switch (action) {
                    case 'analyze':
                        if (imageData) {
                            results.analysis = await analyzeProductDetails(imageData.base64, imageData.mimeType);
                        }
                        break;

                    case 'detect_multi':
                        if (imageData) {
                            results.multiDetect = await detectMultipleProducts(currentImageUrl, imageData.base64, imageData.mimeType);
                        }
                        break;

                    case 'optimize': {
                        const optimized = await optimizeImage(currentImageUrl);
                        results.optimizedUrl = optimized.url;
                        if (optimized.improved) currentImageUrl = optimized.url;
                        break;
                    }

                    case 'remove_bg': {
                        const bgRemoved = await removeBackground(currentImageUrl);
                        results.removedBgUrl = bgRemoved;
                        currentImageUrl = bgRemoved;
                        break;
                    }

                    case 'upscale': {
                        const upscaled = await upscaleImage(currentImageUrl);
                        results.upscaledUrl = upscaled;
                        currentImageUrl = upscaled;
                        break;
                    }
                }
            } catch (actionErr: any) {
                console.error(`Action ${action} failed:`, actionErr);
                results[`${action}_error`] = actionErr.message;
            }
        }

        results.finalUrl = currentImageUrl;
        results.originalUrl = imageUrl;

        return NextResponse.json({ success: true, ...results });

    } catch (error: any) {
        console.error('Enhance image error:', error);
        return NextResponse.json(
            { error: error.message || 'Error al procesar imagen' },
            { status: 500 }
        );
    }
}
