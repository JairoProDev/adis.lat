/**
 * Utility for preventing user errors and detecting duplicates in catalog management
 */

import { Adiso } from '@/types';

/**
 * Normalizes a string for comparison by removing accents, special characters and extra spaces
 */
export function normalizeString(str: string): string {
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9\s]/g, "")     // Remove special characters
        .trim();
}

/**
 * Checks if a product with a similar title already exists in the catalog
 * @returns The existing product if a match is found, null otherwise
 */
export function findPotentialDuplicate(title: string, existingAdisos: Adiso[]): Adiso | null {
    if (!title || !existingAdisos || existingAdisos.length === 0) return null;

    const normalizedNew = normalizeString(title);

    // Exact match after normalization
    const exactMatch = existingAdisos.find(a => normalizeString(a.titulo) === normalizedNew);
    if (exactMatch) return exactMatch;

    // Fuzzy match (contained in or contains)
    // We only trigger this if the title is reasonably long to avoid false positives on short names
    if (normalizedNew.length > 5) {
        const fuzzyMatch = existingAdisos.find(a => {
            const normalizedExisting = normalizeString(a.titulo);
            return normalizedExisting.includes(normalizedNew) || normalizedNew.includes(normalizedExisting);
        });
        if (fuzzyMatch) return fuzzyMatch;
    }

    return null;
}

/**
 * Validates price to prevent "accidents" like too many zeros or negative numbers
 */
export function validatePrice(price: string | number | null): { isValid: boolean; warning?: string } {
    if (price === null || price === '') return { isValid: true };

    const numPrice = typeof price === 'string' ? parseFloat(price) : price;

    if (isNaN(numPrice)) return { isValid: false, warning: 'El precio debe ser un número válido' };
    if (numPrice < 0) return { isValid: false, warning: 'El precio no puede ser negativo' };

    // Warning for unusually high prices (e.g. > 1 million, maybe a typo)
    if (numPrice > 1000000) {
        return { isValid: true, warning: '¿Estás seguro del precio? Parece inusualmente alto.' };
    }

    return { isValid: true };
}
