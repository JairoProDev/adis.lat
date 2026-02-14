/**
 * Replicate Client for Image Enhancement
 * Used for: upscaling, background removal, image generation
 */

import Replicate from 'replicate';

const replicate = process.env.REPLICATE_API_TOKEN
    ? new Replicate({ auth: process.env.REPLICATE_API_TOKEN })
    : null;

// ============================================================
// IMAGE UPSCALING
// ============================================================

/**
 * Mejora la calidad de una imagen (upscale 4x)
 * Model: Real-ESRGAN
 * Cost: ~$0.0023 per image
 */
export async function upscaleImage(imageUrl: string): Promise<string> {
    if (!replicate) throw new Error('Replicate API no configurado');

    const output = await replicate.run(
        "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
        {
            input: {
                image: imageUrl,
                scale: 4,
                face_enhance: false
            }
        }
    ) as string;

    return output;
}

// ============================================================
// BACKGROUND REMOVAL
// ============================================================

/**
 * Remueve el fondo de una imagen de producto
 * Model: BRIA RMBG 1.4
 * Cost: ~$0.005 per image (free 1000/month)
 */
export async function removeBackground(imageUrl: string): Promise<string> {
    if (!replicate) throw new Error('Replicate API no configurado');

    const output = await replicate.run(
        "lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1",
        {
            input: {
                image: imageUrl
            }
        }
    ) as string;

    return output;
}

// ============================================================
// IMAGE GENERATION
// ============================================================

/**
 * Genera una imagen desde texto (para logos, productos, etc.)
 * Model: SDXL
 * Cost: ~$0.0055 per image
 */
export async function generateImage(
    prompt: string,
    options?: {
        negativePrompt?: string;
        width?: number;
        height?: number;
        numOutputs?: number;
    }
): Promise<string[]> {
    if (!replicate) throw new Error('Replicate API no configurado');

    const output = await replicate.run(
        "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        {
            input: {
                prompt,
                negative_prompt: options?.negativePrompt || "blurry, low quality, distorted",
                width: options?.width || 1024,
                height: options?.height || 1024,
                num_outputs: options?.numOutputs || 1,
                scheduler: "K_EULER",
                num_inference_steps: 25,
                guidance_scale: 7.5
            }
        }
    ) as string[];

    return output;
}

/**
 * Genera un logo profesional desde texto
 */
export async function generateLogo(
    businessName: string,
    industry: string,
    style?: 'modern' | 'classic' | 'minimalist' | 'playful'
): Promise<string[]> {
    const stylePrompts = {
        modern: 'modern, sleek, geometric, contemporary design',
        classic: 'classic, timeless, elegant, traditional',
        minimalist: 'minimalist, simple, clean, monochrome',
        playful: 'playful, colorful, fun, creative'
    };

    const selectedStyle = stylePrompts[style || 'modern'];

    const prompt = `Professional logo design for "${businessName}", a ${industry} business. ${selectedStyle}. Vector style, clean lines, professional, scalable, centered composition, white background, high quality`;

    return generateImage(prompt, {
        negativePrompt: "text, words, letters, watermark, signature, blurry, low quality, photograph, realistic",
        numOutputs: 5
    });
}

// ============================================================
// IMAGE VARIATIONS
// ============================================================

/**
 * Genera variaciones de una imagen existente
 * Útil para crear diferentes ángulos o estilos del mismo producto
 */ export async function generateVariations(
    imageUrl: string,
    prompt: string,
    numVariations: number = 3
): Promise<string[]> {
    if (!replicate) throw new Error('Replicate API no configurado');

    const output = await replicate.run(
        "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        {
            input: {
                image: imageUrl,
                prompt: `${prompt}, product photography, professional lighting, high quality`,
                num_outputs: numVariations,
                strength: 0.8 // Higher = more variation
            }
        }
    ) as string[];

    return output;
}

// ============================================================
// CLIENT-SIDE ALTERNATIVE (FREE)
// ============================================================

/**
 * Para background removal en el cliente (gratis, sin API)
 * Usar @imgly/background-removal
 * 
 * Implementación en el frontend:
 * ```tsx
 * import { removeBackground } from '@imgly/background-removal';
 * 
 * const blob = await removeBackground(imageFile);
 * const url = URL.createObjectURL(blob);
 * ```
 */

export default {
    upscaleImage,
    removeBackground,
    generateImage,
    generateLogo,
    generateVariations
};
