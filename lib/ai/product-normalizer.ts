/**
 * Product Normalizer with AI
 * 
 * AI-powered product data normalization:
 * 1. Auto-detect column meanings
 * 2. Normalize product data
 * 3. Extract attributes from free text
 */

import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export interface ColumnMapping {
    [excelColumn: string]: string; // "Nombre Producto" -> "title"
}

export interface NormalizedProduct {
    title: string;
    description?: string;
    sku?: string;
    price?: number;
    category?: string;
    brand?: string;
    attributes?: Record<string, any>;
    [key: string]: any;
}

// Helper to fix encoding issues (Mojibake)
function fixMojibake(str: string): string {
    try {
        // Detect common UTF-8 interpreted as ISO-8859-1/Windows-1252 artifacts
        // Ã = \u00C3
        if (/[\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF]/.test(str)) {
            const fixed = Buffer.from(str, 'binary').toString('utf-8');
            if (fixed.length < str.length) return fixed;
        }
        return str;
    } catch (e) {
        return str;
    }
}

export class ProductNormalizer {
    /**
     * AI-powered column detection
     * Detects what each column in the Excel means
     */
    async detectColumns(headers: string[], sampleRow: any[]): Promise<ColumnMapping> {
        const prompt = `You are a data mapping assistant. Map these product catalog headers to standard fields.

Headers: ${JSON.stringify(headers)}
Sample Data: ${JSON.stringify(sampleRow)}

Standard fields:
- title: Product name
- price: Price
- sku: SKU/Code
- brand: Brand/Manufacturer
- category: Category
- stock: Stock
- description: Description
- attributes.specs: Any specific variant detail (size, color, dimension, etc)

RULES:
1. Map EVERY column. Do not ignore any column.
2. If a column is "color", "size", "medida", map it to "attributes.specs".
3. If a column is generic detail, map to "attributes.[ColumnName]".
4. Return JSON only.

Example:
{
  "Producto": "title",
  "Precio": "price",
  "Marca": "brand",
  "Medida": "attributes.specs",
  "Color": "attributes.color"
}`;

        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' },
                temperature: 0.1
            });

            const mapping = JSON.parse(response.choices[0].message.content || '{}');
            return mapping;

        } catch (error: any) {
            console.error('AI column detection failed:', error.message);
            return this.fallbackColumnDetection(headers);
        }
    }

    /**
     * Fallback column detection usando keywords
     */
    private fallbackColumnDetection(headers: string[]): ColumnMapping {
        const mapping: ColumnMapping = {};

        const patterns: Record<string, RegExp[]> = {
            title: [/nombre/i, /producto/i, /title/i, /descripci/i, /item/i],
            sku: [/sku/i, /c[oó]digo/i, /ref/i, /id/i],
            price: [/precio/i, /price/i, /costo/i, /s\//i, /\$/i],
            category: [/categor/i, /tipo/i, /grupo/i, /familia/i],
            brand: [/marca/i, /brand/i, /fabricante/i, /línea/i, /linea/i],
            barcode: [/barcode/i, /ean/i],
            stock: [/stock/i, /cantidad/i, /existencia/i],
            supplier: [/proveedor/i, /supplier/i],
            'attributes.specs': [/detalle/i, /spec/i, /medida/i, /tamaño/i, /color/i, /característica/i]
        };

        headers.forEach(header => {
            const normalizedHeader = header.trim();
            let matched = false;

            for (const [field, regexes] of Object.entries(patterns)) {
                for (const regex of regexes) {
                    if (regex.test(normalizedHeader)) {
                        mapping[normalizedHeader] = field;
                        matched = true;
                        break;
                    }
                }
                if (matched) break;
            }

            if (!matched && normalizedHeader.length > 0) {
                const attrKey = normalizedHeader.toLowerCase()
                    .replace(/\s+/g, '_')
                    .replace(/[^\w_]/g, '');
                mapping[normalizedHeader] = `attributes.${attrKey}`;
            }
        });

        return mapping;
    }

    /**
     * Normalize a product row using the column mapping
     */
    async normalize(row: any[], mapping: ColumnMapping, originalHeaders: string[], options: { skipEnrichment?: boolean } = {}): Promise<NormalizedProduct> {
        const product: NormalizedProduct = {
            title: '',
            attributes: {}
        };

        originalHeaders.forEach((originalHeader, index) => {
            const header = fixMojibake(originalHeader);
            const value = row[index];
            if (value === null || value === undefined || value === '') return;

            let targetField = mapping[originalHeader] || mapping[header];

            // If no mapping found, treat as attribute
            if (!targetField) {
                const attrKey = header.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, '');
                targetField = `attributes.${attrKey}`;
            }

            // Handle nested attributes
            if (targetField.startsWith('attributes.')) {
                const attrKey = targetField.replace('attributes.', '');
                if (!product.attributes) product.attributes = {};
                product.attributes[attrKey] = this.parseValue(value);
            } else {
                // Direct field mapping
                product[targetField] = this.parseValue(value, targetField);
            }
        });

        // Validate required fields
        if (!product.title || product.title.trim() === '') {
            throw new Error('Product title is required');
        }

        // --- ENHANCEMENT: COMPOSITE TITLE ---
        // Construct composite title for better uniqueness by appending distinct attributes
        if (product.attributes) {
            // Find all attribute values that are short enough to be part of a title
            const attrsToAdd = Object.values(product.attributes)
                .filter(val => (typeof val === 'string' || typeof val === 'number') && val !== null)
                .map(val => String(val).trim())
                .filter(val => val.length > 0 && val.length < 30) // Only short specs
                .filter(val => !product.title.toLowerCase().includes(val.toLowerCase())); // Distinct

            // Add brand if not present
            if (product.brand && !product.title.toLowerCase().includes(product.brand.toLowerCase())) {
                attrsToAdd.push(product.brand);
            }

            // Unique deduplication of additions
            const uniqueAdditions = Array.from(new Set(attrsToAdd));

            if (uniqueAdditions.length > 0) {
                product.title = `${product.title} ${uniqueAdditions.join(' ')}`.trim();
            }
        }
        // ------------------------------------

        // AI Enhancement: Extract more info from title/description if sparse
        if (product.title && !options.skipEnrichment && (!product.category || Object.keys(product.attributes || {}).length < 2)) {
            await this.enrichProduct(product);
        }

        return product;
    }

    /**
     * Parse value to appropriate type
     */
    private parseValue(value: any, expectedType?: string): any {
        if (value === null || value === undefined || value === '') {
            return null;
        }

        const str = String(value).trim();

        // Fix encoding artifacts
        const fixedStr = fixMojibake(str);

        // Price parsing
        if (expectedType === 'price' || /^[S\/\$]?\s*[\d,\.]+$/.test(fixedStr)) {
            const numStr = fixedStr.replace(/[^\d.]/g, '');
            const num = parseFloat(numStr);
            return isNaN(num) ? null : num;
        }

        // Number parsing
        if (/^\d+$/.test(fixedStr)) {
            return parseInt(fixedStr, 10);
        }

        if (/^\d+\.\d+$/.test(fixedStr)) {
            return parseFloat(fixedStr);
        }

        // Boolean
        if (/^(true|false|yes|no|sí|no)$/i.test(fixedStr)) {
            return /^(true|yes|sí)$/i.test(fixedStr);
        }

        return fixedStr;
    }

    /**
     * AI enhancement: Extract category and attributes from title
     */
    private async enrichProduct(product: NormalizedProduct): Promise<void> {
        try {
            const prompt = `Extract product information from this title:
"${product.title}"
${product.description ? `Description: "${product.description}"` : ''}

Extract:
1. category: Main product category (e.g., "Tuberías", "Cables", "Pegamentos")
2. brand: Brand name if mentioned
3. attributes: Key specifications (e.g., size, color, material, voltage)

Return JSON format:
{
  "category": "string",
  "brand": "string or null",
  "attributes": {"key": "value"}
}`;

            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' },
                temperature: 0.2
            });

            const extracted = JSON.parse(response.choices[0].message.content || '{}');

            // Merge extracted data (don't override existing)
            if (extracted.category && !product.category) {
                product.category = extracted.category;
            }
            if (extracted.brand && !product.brand) {
                product.brand = extracted.brand;
            }
            if (extracted.attributes) {
                product.attributes = {
                    ...extracted.attributes,
                    ...product.attributes // Existing attributes take precedence
                };
            }

        } catch (error) {
            console.warn('AI enrichment failed, continuing without it:', error);
            // Non-critical, continue without enrichment
        }
    }
}
