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

export class ProductNormalizer {
    /**
     * AI-powered column detection
     * Detects what each column in the Excel means
     */
    async detectColumns(headers: string[], sampleRow: any[]): Promise<ColumnMapping> {
        const prompt = `You are a data mapping assistant. Given these column headers from a product catalog spreadsheet, map them to standard fields.

Headers: ${JSON.stringify(headers)}
Sample Data: ${JSON.stringify(sampleRow)}

Standard fields available:
- title: Product name/title
- description: Product description
- sku: SKU/product code
- price: Price (numeric)
- category: Product category
- brand: Brand name
- barcode: Barcode/EAN
- supplier: Supplier name
- stock: Stock amount
- attributes: Any other specifications (color, size, voltage, etc.)

Return a JSON object mapping each header to its standard field. If a header doesn't match any standard field but contains useful info, map it to "attributes".

Example response:
{
  "Nombre Producto": "title",
  "Precio S/": "price",
  "Código": "sku",
  "Marca": "brand",
  "Category": "title",
  "Diámetro": "attributes.diameter",
  "Material": "attributes.material"
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
            // Fallback: simple keyword matching
            return this.fallbackColumnDetection(headers);
        }
    }

    /**
     * Fallback column detection usando keywords
     */
    private fallbackColumnDetection(headers: string[]): ColumnMapping {
        const mapping: ColumnMapping = {};

        const patterns: Record<string, RegExp[]> = {
            title: [/nombre/i, /producto/i, /title/i, /descripci[oó]n/i, /item/i],
            sku: [/sku/i, /c[oó]digo/i, /code/i, /ref/i, /art[ií]culo/i],
            price: [/precio/i, /price/i, /costo/i, /valor/i, /s\//i, /\$/i],
            category: [/categor[ií]a/i, /category/i, /tipo/i, /type/i, /grupo/i],
            brand: [/marca/i, /brand/i, /fabricante/i],
            barcode: [/barcode/i, /ean/i, /c[oó]digo de barras/i],
            stock: [/stock/i, /cantidad/i, /inventory/i, /existencia/i],
            supplier: [/proveedor/i, /supplier/i, /distribuidor/i]
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

            // Si no matched, es un atributo custom
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
    async normalize(row: any[], mapping: ColumnMapping, options: { skipEnrichment?: boolean } = {}): Promise<NormalizedProduct> {
        const product: NormalizedProduct = {
            title: '',
            attributes: {}
        };

        const headers = Object.keys(mapping);

        headers.forEach((header, index) => {
            const value = row[index];
            const targetField = mapping[header];

            if (!value || value === '') return;

            // Handle nested attributes
            if (targetField.startsWith('attributes.')) {
                const attrKey = targetField.replace('attributes.', '');
                product.attributes![attrKey] = this.parseValue(value);
            } else {
                // Direct field mapping
                product[targetField] = this.parseValue(value, targetField);
            }
        });

        // Validate required fields
        if (!product.title || product.title.trim() === '') {
            throw new Error('Product title is required');
        }

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

        // Price parsing
        if (expectedType === 'price' || /^[S\/\$]?\s*[\d,\.]+$/.test(str)) {
            const numStr = str.replace(/[^\d.]/g, '');
            const num = parseFloat(numStr);
            return isNaN(num) ? null : num;
        }

        // Number parsing
        if (/^\d+$/.test(str)) {
            return parseInt(str, 10);
        }

        if (/^\d+\.\d+$/.test(str)) {
            return parseFloat(str);
        }

        // Boolean
        if (/^(true|false|yes|no|sí|no)$/i.test(str)) {
            return /^(true|yes|sí)$/i.test(str);
        }

        return str;
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
