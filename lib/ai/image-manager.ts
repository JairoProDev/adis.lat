/**
 * Product Image Manager
 * 
 * Hybrid image acquisition strategy:
 * 1. Extract from import sources (PDF, Excel)
 * 2. Search web (Bing Visual Search)
 * 3. AI Generation (Stable Diffusion/DALL-E) as fallback
 * 4. Category placeholders
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import sharp from 'sharp';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const BING_API_KEY = process.env.BING_SEARCH_API_KEY;
const BING_SEARCH_ENDPOINT = 'https://api.bing.microsoft.com/v7.0/images/search';

export interface ImageSource {
    url: string;
    source: 'extracted' | 'web_search' | 'ai_generated' | 'placeholder';
    sourceUrl?: string;
    confidence: number;
}

export class ProductImageManager {
    private supabase: ReturnType<typeof createClient>;

    constructor(supabase: any) {
        this.supabase = supabase;
    }

    /**
     * Get images for a product using hybrid strategy
     */
    async getImagesForProduct(product: {
        title: string;
        brand?: string;
        category?: string;
        description?: string;
    }): Promise<ImageSource[]> {
        const images: ImageSource[] = [];

        // Strategy 1: Web Search (primary)
        const webImages = await this.searchWebImages(product);
        images.push(...webImages);

        // Strategy 2: AI Generation (if web search fails)
        if (images.length === 0 && this.shouldGenerateAI(product)) {
            const aiImage = await this.generateProductImage(product);
            if (aiImage) {
                images.push(aiImage);
            }
        }

        // Strategy 3: Category placeholder (fallback)
        if (images.length === 0 && product.category) {
            images.push({
                url: this.getCategoryPlaceholder(product.category),
                source: 'placeholder',
                confidence: 0.1
            });
        }

        return images;
    }

    /**
     * Search for product images on the web using Bing
     */
    private async searchWebImages(product: {
        title: string;
        brand?: string;
        category?: string;
    }): Promise<ImageSource[]> {
        if (!BING_API_KEY) {
            console.warn('Bing API key not configured, skipping web search');
            return [];
        }

        try {
            // Construct search query
            const query = [
                product.brand,
                product.title,
                product.category,
                'product photo'
            ]
                .filter(Boolean)
                .join(' ');

            const response = await fetch(
                `${BING_SEARCH_ENDPOINT}?q=${encodeURIComponent(query)}&count=5&imageType=Photo&aspect=Square`,
                {
                    headers: {
                        'Ocp-Apim-Subscription-Key': BING_API_KEY
                    }
                }
            );

            if (!response.ok) {
                console.error('Bing search failed:', response.statusText);
                return [];
            }

            const data = await response.json();

            if (!data.value || data.value.length === 0) {
                return [];
            }

            // Download and re-host images
            const images: ImageSource[] = [];

            for (const result of data.value.slice(0, 3)) {
                try {
                    const hostedUrl = await this.downloadAndUpload(
                        result.contentUrl,
                        product.title
                    );

                    if (hostedUrl) {
                        images.push({
                            url: hostedUrl,
                            source: 'web_search',
                            sourceUrl: result.contentUrl,
                            confidence: 0.7
                        });
                    }
                } catch (err) {
                    console.warn('Failed to download image:', err);
                }
            }

            return images;

        } catch (error) {
            console.error('Web image search failed:', error);
            return [];
        }
    }

    /**
     * Download image from URL and upload to Supabase Storage
     */
    private async downloadAndUpload(imageUrl: string, productTitle: string): Promise<string | null> {
        try {
            // Download image
            const response = await fetch(imageUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            if (!response.ok) return null;

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Optimize image using sharp
            const optimized = await sharp(buffer)
                .resize(800, 800, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({ quality: 85 })
                .toBuffer();

            // Generate unique filename
            const filename = `products/${Date.now()}-${this.slugify(productTitle)}.jpg`;

            // Upload to Supabase Storage
            const { data, error } = await this.supabase.storage
                .from('catalog-images')
                .upload(filename, optimized, {
                    contentType: 'image/jpeg',
                    cacheControl: '31536000' // 1 year
                });

            if (error) {
                console.error('Supabase upload error:', error);
                return null;
            }

            // Get public URL
            const { data: { publicUrl } } = this.supabase.storage
                .from('catalog-images')
                .getPublicUrl(filename);

            return publicUrl;

        } catch (error) {
            console.error('Download and upload failed:', error);
            return null;
        }
    }

    /**
     * Determine if product is suitable for AI generation
     */
    private shouldGenerateAI(product: { category?: string; brand?: string }): boolean {
        // Only generate for generic, common products
        const genericCategories = [
            'tuberías',
            'cables',
            'pegamentos',
            'accesorios',
            'herramientas'
        ];

        const category = product.category?.toLowerCase() || '';
        return genericCategories.some(cat => category.includes(cat));
    }

    /**
     * Generate product image using AI (DALL-E)
     */
    private async generateProductImage(product: {
        title: string;
        description?: string;
        category?: string;
    }): Promise<ImageSource | null> {
        try {
            const prompt = `Professional product photography of ${product.title}, ${product.category || 'hardware product'}, white background, studio lighting, high quality, product shot, centered composition`;

            const response = await openai.images.generate({
                model: 'dall-e-3',
                prompt,
                size: '1024x1024',
                quality: 'standard',
                n: 1
            });

            const imageUrl = response.data[0]?.url;
            if (!imageUrl) return null;

            // Download and re-host
            const hostedUrl = await this.downloadAndUpload(imageUrl, product.title);

            if (!hostedUrl) return null;

            return {
                url: hostedUrl,
                source: 'ai_generated',
                confidence: 0.5
            };

        } catch (error) {
            console.error('AI image generation failed:', error);
            return null;
        }
    }

    /**
     * Get category placeholder image
     */
    private getCategoryPlaceholder(category: string): string {
        const baseUrl = '/images/placeholders';

        const categoryMap: Record<string, string> = {
            'tuberías': `${baseUrl}/tuberia.svg`,
            'tuberias': `${baseUrl}/tuberia.svg`,
            'cables': `${baseUrl}/cable.svg`,
            'pegamentos': `${baseUrl}/pegamento.svg`,
            'accesorios': `${baseUrl}/accesorio.svg`,
            'herramientas': `${baseUrl}/herramienta.svg`,
            'default': `${baseUrl}/producto.svg`
        };

        const key = category.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return categoryMap[key] || categoryMap['default'];
    }

    /**
     * Create URL-safe slug from text
     */
    private slugify(text: string): string {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50);
    }

    /**
     * Batch process images for multiple products
     */
    async processProductImages(products: any[]): Promise<Map<string, ImageSource[]>> {
        const results = new Map<string, ImageSource[]>();

        // Process in batches to avoid rate limiting
        const batchSize = 5;

        for (let i = 0; i < products.length; i += batchSize) {
            const batch = products.slice(i, i + batchSize);

            const promises = batch.map(async (product) => {
                const images = await this.getImagesForProduct(product);
                return { productId: product.id || product.title, images };
            });

            const batchResults = await Promise.all(promises);

            batchResults.forEach(({ productId, images }) => {
                results.set(productId, images);
            });

            // Rate limiting delay
            if (i + batchSize < products.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return results;
    }
}
