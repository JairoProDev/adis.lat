/**
 * Product Grouping Logic
 * Groups products by base name and creates variants
 */

import type { CatalogProduct } from '@/types/catalog';

export interface ProductVariant {
    id: string;
    specs: string;
    price: number;
    stock?: number;
    sku?: string;
    images?: any[];
}

export interface GroupedProduct {
    baseId: string;
    baseName: string;
    category?: string;
    brand?: string;
    description?: string;
    baseImage?: string;
    variants: ProductVariant[];
    allProducts: CatalogProduct[];
}

/**
 * Extract base name from product title
 * Removes size/measurement specifications
 */
function extractBaseName(title: string): string {
    // Remove common measurement patterns
    let baseName = title
        // Remove measurements like "2 pulgadas", "3"", "½", "¾", "1½"
        .replace(/\s+\d+[\s"]*(pulgadas?|pulg|"|''|mm|cm|m|metros?|mts?)\b/gi, '')
        .replace(/\s+[½¼¾⅓⅔⅛⅜⅝⅞]\s*/g, '')
        .replace(/\s+\d+\s*[½¼¾⅓⅔⅛⅜⅝⅞]\s*/g, '')
        // Remove standalone numbers at the end
        .replace(/\s+\d+\s*$/g, '')
        // Remove size indicators
        .replace(/\s+(S|M|L|XL|XXL)\b/gi, '')
        // Remove color names (common ones)
        .replace(/\s+(rojo|azul|verde|amarillo|negro|blanco|gris|naranja|morado|rosa)\b/gi, '')
        // Clean up extra spaces
        .replace(/\s+/g, ' ')
        .trim();

    return baseName;
}

/**
 * Extract variant specs from product
 */
function extractVariantSpecs(product: CatalogProduct): string {
    const specs: string[] = [];

    // Get specs from attributes
    if (product.attributes) {
        const getAttr = (name: string) => {
            if (Array.isArray(product.attributes)) {
                return product.attributes.find(a => a.name === name)?.value;
            }
            return (product.attributes as Record<string, any>)[name];
        };

        const valSpecs = getAttr('specs');
        const valMedida = getAttr('medida');
        const valTamaño = getAttr('tamaño');
        const valColor = getAttr('color');

        if (valSpecs) specs.push(String(valSpecs));
        if (valMedida) specs.push(String(valMedida));
        if (valTamaño) specs.push(String(valTamaño));
        if (valColor) specs.push(String(valColor));
    }

    // If no specs found, try to extract from title
    if (specs.length === 0) {
        const baseName = extractBaseName(product.title);
        const remaining = product.title.replace(baseName, '').trim();
        if (remaining) {
            specs.push(remaining);
        }
    }

    return specs.join(' ').trim() || 'Estándar';
}

/**
 * Group products by base name
 */
export function groupProducts(products: CatalogProduct[]): GroupedProduct[] {
    const groups = new Map<string, GroupedProduct>();

    products.forEach(product => {
        const baseName = extractBaseName(product.title);
        const key = `${baseName}-${product.category || 'sin-categoria'}-${product.brand || 'sin-marca'}`.toLowerCase();

        if (!groups.has(key)) {
            groups.set(key, {
                baseId: product.id,
                baseName,
                category: product.category,
                brand: product.brand,
                description: product.description,
                baseImage: product.images?.[0]?.url,
                variants: [],
                allProducts: []
            });
        }

        const group = groups.get(key)!;
        group.allProducts.push(product);

        group.variants.push({
            id: product.id,
            specs: extractVariantSpecs(product),
            price: product.price || 0,
            stock: product.stock,
            sku: product.sku,
            images: product.images
        });

        // Update base image if current product has one and base doesn't
        if (product.images?.[0]?.url && !group.baseImage) {
            group.baseImage = product.images[0].url;
        }
    });

    return Array.from(groups.values());
}

/**
 * Get unique values for filters
 */
export function getFilterOptions(products: CatalogProduct[]) {
    const categories = new Set<string>();
    const brands = new Set<string>();
    const specs = new Set<string>();

    products.forEach(product => {
        if (product.category) categories.add(product.category);
        if (product.brand) brands.add(product.brand);

        const variantSpecs = extractVariantSpecs(product);
        if (variantSpecs && variantSpecs !== 'Estándar') {
            specs.add(variantSpecs);
        }
    });

    return {
        categories: Array.from(categories).sort(),
        brands: Array.from(brands).sort(),
        specs: Array.from(specs).sort()
    };
}
