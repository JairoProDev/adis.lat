import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { rateLimit, getClientIP } from '@/lib/rate-limit';

export const runtime = 'nodejs'; // or 'edge' if preferred, but nodejs is safer for fetch/buffer
export const maxDuration = 60; // 1 minute should be enough

const MODEL_NAME = 'gemini-2.5-flash';

export async function POST(request: NextRequest) {
    try {
        const ip = getClientIP(request);
        const limited = rateLimit(`analyze-product-${ip}`, {
            windowMs: 60 * 1000,
            maxRequests: 15,
        });
        if (!limited.allowed) {
            return NextResponse.json({ error: 'Demasiadas solicitudes. Espera un momento.' }, { status: 429 });
        }

        const user = await getUserFromRouteRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { imageUrl } = await request.json();

        if (!imageUrl) {
            return NextResponse.json({ error: 'Se requiere URL de imagen' }, { status: 400 });
        }

        // Initialize Gemini
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'API Key no configurada' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        // Fetch image
        const imageResp = await fetch(imageUrl);
        if (!imageResp.ok) {
            return NextResponse.json({ error: 'No se pudo descargar la imagen' }, { status: 400 });
        }

        const arrayBuffer = await imageResp.arrayBuffer();
        const base64Image = Buffer.from(arrayBuffer).toString('base64');
        const mimeType = imageResp.headers.get('content-type') || 'image/jpeg';

        // Prompt
        const prompt = `
Actúa como un asistente experto en ventas y catálogos de comercio electrónico.
Analiza esta imagen de un producto y extrae o genera la siguiente información en formato JSON estricto:

1. "title": Un título corto, atractivo y descriptivo del producto (máx 60 caracteres).
2. "description": Una descripción persuasiva para vender el producto. Incluye detalles visibles, beneficios y características clave. (aprox 20-40 palabras).
3. "price": Si el precio es VISIBLE en la imagen, extraelo como número (sin símbolo de moneda). Si NO es visible, devuelve null.
4. "category": La categoría más apropiada para este producto (ej: Ropa, Electrónica, Alimentos, Hogar, Servicios, etc.).

Responde ÚNICAMENTE con el objeto JSON. No incluyas markdown \`\`\`json.
`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType
                }
            }
        ]);

        const responseText = result.response.text();

        // Clean markdown if present
        const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        let data;
        try {
            data = JSON.parse(jsonStr);
        } catch (e) {
            console.error('JSON Parse error:', e);
            console.log('Raw text:', responseText);
            return NextResponse.json({ error: 'Error al procesar la respuesta de IA' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error('Analyze product error:', error);
        return NextResponse.json({ error: error.message || 'Error del servidor' }, { status: 500 });
    }
}
