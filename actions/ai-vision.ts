/**
 * AI Vision Analysis - "Snap & Sell" Module
 *
 * This module uses GPT-4o Vision to analyze product images
 * and automatically extract listing details (title, category, condition, price).
 */

'use server';

import { generateObject } from 'ai';
import { openai, AI_MODELS } from '@/lib/ai/openai-client';
import { hybridSearch } from './ai-search';
import { Categoria } from '@/types';
import { z } from 'zod';

/**
 * Zod schema for structured item extraction
 */
const ItemAnalysisSchema = z.object({
  title: z.string().describe('A compelling, SEO-friendly title for the listing (max 80 chars)'),
  category: z.enum([
    'empleos',
    'inmuebles',
    'vehiculos',
    'servicios',
    'productos',
    'eventos',
    'negocios',
    'comunidad',
  ]).describe('The most appropriate category for this item'),
  subcategory: z.string().optional().describe('A more specific subcategory if applicable'),
  condition: z.enum(['nuevo', 'como_nuevo', 'usado_bueno', 'usado_regular', 'para_reparar'])
    .describe('The condition of the item based on visual inspection'),
  brand: z.string().optional().describe('The brand name if visible or identifiable'),
  model: z.string().optional().describe('The model name or number if identifiable'),
  color: z.string().describe('Primary color(s) of the item'),
  material: z.string().optional().describe('Material (e.g., "metal", "plástico", "cuero")'),
  detectedDefects: z.array(z.string())
    .describe('Visible defects or wear (e.g., "rayones", "manchas", "desgaste")'),
  keyFeatures: z.array(z.string())
    .describe('Notable features or selling points (max 5 items)'),
  suggestedDescription: z.string()
    .describe('A draft description highlighting key features and condition (150-250 chars)'),
  searchTags: z.array(z.string())
    .describe('Relevant search tags for SEO (5-10 tags)'),
  estimatedValue: z.object({
    min: z.number().describe('Minimum estimated price in Soles (S/)'),
    max: z.number().describe('Maximum estimated price in Soles (S/)'),
    confidence: z.enum(['baja', 'media', 'alta']).describe('Confidence in the price estimate'),
  }).describe('Estimated market value range'),
});

export type ItemAnalysis = z.infer<typeof ItemAnalysisSchema>;

/**
 * Analyze an image to extract listing details
 *
 * @param imageUrl - Public URL of the image to analyze
 * @returns Structured item analysis
 */
export async function analyzeItemImage(imageUrl: string): Promise<ItemAnalysis> {
  try {
    console.log('🔍 Analyzing image with GPT-4o Vision...');

    const { object } = await generateObject({
      model: openai(AI_MODELS.VISION),
      schema: ItemAnalysisSchema,
      messages: [
        {
          role: 'system',
          content: `You are an expert appraiser for a classifieds marketplace in Peru (Buscadis).
Analyze images of items and extract detailed, accurate information for creating listings.

GUIDELINES:
- Be conservative about condition (if you see wear, mark it as "usado_bueno" not "como_nuevo")
- Prices should be in Peruvian Soles (S/)
- Consider the local market (Peru, especially Cusco region)
- Focus on practical, SEO-friendly titles
- Highlight defects honestly (builds trust)
- Use Spanish language for all text fields`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this item for a marketplace listing. Provide accurate details.',
            },
            {
              type: 'image',
              image: imageUrl,
            },
          ],
        },
      ],
    });

    console.log('✅ Image analysis complete');
    return object;
  } catch (error: any) {
    console.error('❌ Image analysis failed:', error);
    throw new Error(`Failed to analyze image: ${error.message}`);
  }
}

/**
 * Get market price suggestions by searching similar items
 *
 * @param analysis - Item analysis from vision
 * @returns Suggested price based on real market data
 */
export async function getMarketPriceSuggestion(
  analysis: ItemAnalysis
): Promise<{
  suggestedPrice: number;
  priceRange: { min: number; max: number };
  similarListings: number;
  confidence: 'baja' | 'media' | 'alta';
}> {
  try {
    // Build search query from analysis
    const searchQuery = [
      analysis.brand,
      analysis.model,
      analysis.title,
    ]
      .filter(Boolean)
      .join(' ');

    console.log(`💰 Checking market prices for: "${searchQuery}"`);

    // Search for similar items in the database
    const results = await hybridSearch({
      query: searchQuery,
      category: analysis.category as Categoria,
      maxResults: 20,
      threshold: 0.3,
    });

    if (results.length === 0) {
      // No market data available, use vision estimate
      const avgEstimate = (analysis.estimatedValue.min + analysis.estimatedValue.max) / 2;
      return {
        suggestedPrice: Math.round(avgEstimate),
        priceRange: {
          min: analysis.estimatedValue.min,
          max: analysis.estimatedValue.max,
        },
        similarListings: 0,
        confidence: 'baja',
      };
    }

    // Extract prices from similar listings (if they have price in description/title)
    const prices: number[] = [];
    results.forEach((result) => {
      // Try to extract price from title or description
      const text = `${result.adiso.titulo} ${result.adiso.descripcion}`;
      const priceMatch = text.match(/S\/?\s*(\d{1,5})/);
      if (priceMatch) {
        const price = parseInt(priceMatch[1]);
        if (price > 10 && price < 100000) {
          // Reasonable price range
          prices.push(price);
        }
      }
    });

    if (prices.length < 3) {
      // Not enough price data, use vision estimate
      const avgEstimate = (analysis.estimatedValue.min + analysis.estimatedValue.max) / 2;
      return {
        suggestedPrice: Math.round(avgEstimate),
        priceRange: {
          min: analysis.estimatedValue.min,
          max: analysis.estimatedValue.max,
        },
        similarListings: results.length,
        confidence: 'media',
      };
    }

    // Calculate statistics from market data
    prices.sort((a, b) => a - b);
    const median = prices[Math.floor(prices.length / 2)];
    const avg = Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length);
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    console.log(`✅ Market analysis: ${prices.length} prices found, median: S/ ${median}`);

    return {
      suggestedPrice: median,
      priceRange: { min, max },
      similarListings: results.length,
      confidence: prices.length >= 5 ? 'alta' : 'media',
    };
  } catch (error: any) {
    console.error('Market price check failed:', error);
    // Fallback to vision estimate
    const avgEstimate = (analysis.estimatedValue.min + analysis.estimatedValue.max) / 2;
    return {
      suggestedPrice: Math.round(avgEstimate),
      priceRange: {
        min: analysis.estimatedValue.min,
        max: analysis.estimatedValue.max,
      },
      similarListings: 0,
      confidence: 'baja',
    };
  }
}

/**
 * Complete "Snap & Sell" pipeline
 *
 * @param imageUrl - Public URL of the image
 * @returns Full analysis with market price suggestions
 */
export async function snapAndSell(imageUrl: string) {
  console.log('📸 Starting Snap & Sell pipeline...');

  // Step 1: Analyze the image
  const analysis = await analyzeItemImage(imageUrl);

  // Step 2: Get market price suggestion
  const marketPrice = await getMarketPriceSuggestion(analysis);

  // Step 3: Combine results
  const result = {
    ...analysis,
    marketPrice: marketPrice.suggestedPrice,
    marketPriceRange: marketPrice.priceRange,
    marketConfidence: marketPrice.confidence,
    similarListingsFound: marketPrice.similarListings,
    autofillData: {
      categoria: analysis.category,
      titulo: analysis.title,
      descripcion: analysis.suggestedDescription,
      tags: analysis.searchTags,
      precio: marketPrice.suggestedPrice,
      condicion: analysis.condition,
    },
  };

  console.log('✅ Snap & Sell complete');
  return result;
}

/**
 * Validate if an image is suitable for listing analysis
 * (Checks for inappropriate content, blurriness, etc.)
 *
 * @param imageUrl - Public URL of the image
 * @returns Validation result
 */
export async function validateImage(imageUrl: string): Promise<{
  isValid: boolean;
  reason?: string;
}> {
  try {
    // Use OpenAI Moderation API for content safety
    // This is a placeholder - implement actual moderation
    return { isValid: true };
  } catch (error: any) {
    console.error('Image validation failed:', error);
    return {
      isValid: false,
      reason: 'No se pudo validar la imagen',
    };
  }
}
