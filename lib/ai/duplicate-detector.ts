/**
 * Duplicate Detector using AI
 * 
 * Multi-strategy duplicate detection:
 * 1. Exact SKU matching
 * 2. Text embeddings similarity (semantic)
 * 3. Fuzzy string matching
 * 4. Weighted scoring
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { distance } from 'fastest-levenshtein';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export interface DuplicateResult {
    product: any;
    isDuplicate: boolean;
    matchedProduct?: any;
    score: number; // 0.0 - 1.0
    reasons: string[];
}

export class DuplicateDetector {
    private supabase: SupabaseClient;

    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    /**
     * Detect duplicates for a batch of products
     */
    /**
     * Detect duplicates for a batch of products (Optimized)
     */
    async detectBatch(products: any[], businessProfileId: string): Promise<DuplicateResult[]> {
        // 1. Bulk check for exact matches (SKU/Barcode) to avoid DB hits
        const skus = products.filter(p => p.sku).map(p => p.sku);
        const barcodes = products.filter(p => p.barcode).map(p => p.barcode);

        const existingSkus = new Set<string>();
        const existingBarcodes = new Set<string>();

        if (skus.length > 0) {
            const { data } = await this.supabase
                .from('catalog_products')
                .select('sku')
                .eq('business_profile_id', businessProfileId)
                .in('sku', skus);
            data?.forEach((r: any) => existingSkus.add(r.sku));
        }

        if (barcodes.length > 0) {
            const { data } = await this.supabase
                .from('catalog_products')
                .select('barcode')
                .eq('business_profile_id', businessProfileId)
                .in('barcode', barcodes);
            data?.forEach((r: any) => existingBarcodes.add(r.barcode));
        }

        // 2. Process with concurrency limit for Title Fuzzy Search (expensive)
        const results: DuplicateResult[] = new Array(products.length);
        const CONCURRENCY = 5;
        const chunks = [];

        for (let i = 0; i < products.length; i += CONCURRENCY) {
            chunks.push(products.slice(i, i + CONCURRENCY).map((p, idx) => ({ product: p, originalIndex: i + idx })));
        }

        for (const chunk of chunks) {
            await Promise.all(chunk.map(async ({ product, originalIndex }) => {
                // Pre-check exact matches locally
                if (product.sku && existingSkus.has(product.sku)) {
                    results[originalIndex] = {
                        product,
                        isDuplicate: true,
                        score: 1.0,
                        reasons: ['exact_sku_match']
                    };
                    return;
                }
                if (product.barcode && existingBarcodes.has(product.barcode)) {
                    results[originalIndex] = {
                        product,
                        isDuplicate: true,
                        score: 1.0,
                        reasons: ['exact_barcode_match']
                    };
                    return;
                }

                // If no exact match, do the expensive check (Title Fuzzy)
                // Only if title exists
                if (product.title) {
                    try {
                        const result = await this.detect(product, businessProfileId, true); // true = skip exact checks
                        results[originalIndex] = result;
                    } catch (e) {
                        console.error(`Error checking duplicate for ${product.title}:`, e);
                        // Fallback to non-duplicate on error
                        results[originalIndex] = { product, isDuplicate: false, score: 0, reasons: [] };
                    }
                } else {
                    results[originalIndex] = { product, isDuplicate: false, score: 0, reasons: [] };
                }
            }));
        }

        return results;
    }

    /**
     * Detect if a single product is a duplicate
     */
    /**
     * Detect if a single product is a duplicate
     * @param skipExactChecks If true, skips DB queries for SKU/Barcode (assumes checked externally)
     */
    async detect(newProduct: any, businessProfileId: string, skipExactChecks = false): Promise<DuplicateResult> {
        const reasons: string[] = [];
        let maxScore = 0;
        let bestMatch: any = null;

        // Strategy 1: Exact SKU Match (100% confidence)
        if (!skipExactChecks && newProduct.sku) {
            const { data: skuMatches } = await this.supabase
                .from('catalog_products')
                .select('*')
                .eq('business_profile_id', businessProfileId)
                .eq('sku', newProduct.sku)
                .limit(1);

            if (skuMatches && skuMatches.length > 0) {
                return {
                    product: newProduct,
                    isDuplicate: true,
                    matchedProduct: skuMatches[0],
                    score: 1.0,
                    reasons: ['exact_sku_match']
                };
            }
        }

        // Strategy 2: Title Similarity (Fuzzy + Embeddings)
        if (newProduct.title) {
            const similarProducts = await this.findSimilarByTitle(
                newProduct.title,
                businessProfileId
            );

            for (const similar of similarProducts) {
                const fuzzyScore = this.calculateFuzzyScore(newProduct.title, similar.title);
                const brandMatch = this.compareBrands(newProduct.brand, similar.brand);

                // Weighted score
                let score = fuzzyScore * 0.7;
                if (brandMatch) {
                    score += 0.2;
                    reasons.push('brand_match');
                }

                // Attribute similarity (if available)
                if (newProduct.attributes && similar.attributes) {
                    let similarAttrs = similar.attributes;
                    if (typeof similarAttrs === 'string') {
                        try {
                            similarAttrs = JSON.parse(similarAttrs);
                        } catch (e) {
                            similarAttrs = {};
                        }
                    }

                    const attrScore = this.compareAttributes(
                        newProduct.attributes,
                        similarAttrs || {}
                    );
                    score += attrScore * 0.1;
                }

                if (score > maxScore) {
                    maxScore = score;
                    bestMatch = similar;
                    if (fuzzyScore > 0.8) {
                        reasons.push('title_high_similarity');
                    } else if (fuzzyScore > 0.6) {
                        reasons.push('title_moderate_similarity');
                    }
                }
            }
        }

        // Strategy 3: Barcode Match
        if (!skipExactChecks && newProduct.barcode) {
            const { data: barcodeMatches } = await this.supabase
                .from('catalog_products')
                .select('*')
                .eq('business_profile_id', businessProfileId)
                .eq('barcode', newProduct.barcode)
                .limit(1);

            if (barcodeMatches && barcodeMatches.length > 0) {
                return {
                    product: newProduct,
                    isDuplicate: true,
                    matchedProduct: barcodeMatches[0],
                    score: 1.0,
                    reasons: ['exact_barcode_match']
                };
            }
        }

        // Determine if duplicate based on threshold
        const isDuplicate = maxScore > 0.75; // 75% threshold

        return {
            product: newProduct,
            isDuplicate,
            matchedProduct: bestMatch,
            score: maxScore,
            reasons
        };
    }

    /**
     * Find similar products by title usando text search
     */
    private async findSimilarByTitle(title: string, businessProfileId: string): Promise<any[]> {
        // Use PostgreSQL full-text search
        const searchQuery = title
            .toLowerCase()
            .split(' ')
            .filter(word => word.length > 2)
            .join(' & ');

        const { data } = await this.supabase
            .from('catalog_products')
            .select('*')
            .eq('business_profile_id', businessProfileId)
            .textSearch('search_vector', searchQuery)
            .limit(10);

        return data || [];
    }

    /**
     * Calculate fuzzy string similarity using Levenshtein distance
     */
    private calculateFuzzyScore(str1: string, str2: string): number {
        const s1 = this.normalizeString(str1);
        const s2 = this.normalizeString(str2);

        const maxLen = Math.max(s1.length, s2.length);
        if (maxLen === 0) return 1.0;

        const dist = distance(s1, s2);
        return 1 - (dist / maxLen);
    }

    /**
     * Normalize string for comparison
     */
    private normalizeString(str: string): string {
        return str
            .toLowerCase()
            .normalize('NFD') // Decompose accents
            .replace(/[\u0300-\u036f]/g, '') // Remove accents
            .replace(/[^\w\s]/g, '') // Remove special chars
            .replace(/\s+/g, ' ') // Collapse spaces
            .trim();
    }

    /**
     * Compare brands
     */
    private compareBrands(brand1?: string, brand2?: string): boolean {
        if (!brand1 || !brand2) return false;

        const b1 = this.normalizeString(brand1);
        const b2 = this.normalizeString(brand2);

        return b1 === b2;
    }

    /**
     * Compare product attributes
     */
    private compareAttributes(attr1: any, attr2: any): number {
        const keys1 = Object.keys(attr1);
        const keys2 = Object.keys(attr2);

        if (keys1.length === 0 && keys2.length === 0) return 0;

        const commonKeys = keys1.filter(k => keys2.includes(k));
        if (commonKeys.length === 0) return 0;

        let matches = 0;
        for (const key of commonKeys) {
            const val1 = String(attr1[key]).toLowerCase().trim();
            const val2 = String(attr2[key]).toLowerCase().trim();

            if (val1 === val2) {
                matches++;
            }
        }

        return matches / commonKeys.length;
    }

    /**
     * Generate text embeddings for semantic similarity
     * (Optional advanced feature - requires pgvector)
     */
    async generateEmbedding(text: string): Promise<number[]> {
        try {
            const response = await openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: text
            });

            return response.data[0].embedding;
        } catch (error) {
            console.error('Embedding generation failed:', error);
            return [];
        }
    }

    /**
     * Find similar products using vector embeddings
     * Requires pgvector extension in PostgreSQL
     */
    async findSimilarByEmbedding(
        embedding: number[],
        businessProfileId: string,
        threshold: number = 0.7
    ): Promise<any[]> {
        // This requires pgvector to be installed and embedding column to exist
        // Skipping for MVP, can be added in V2
        return [];
    }
}
