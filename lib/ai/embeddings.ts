/**
 * Embeddings Generation Service
 *
 * This module handles the creation of vector embeddings
 * for semantic search using OpenAI's text-embedding-3-small model.
 */

import { openaiClient, AI_MODELS } from './openai-client';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { Adiso } from '@/types';

/**
 * Generate embedding for a single text
 *
 * @param text - The text to embed
 * @returns Vector embedding (1536 dimensions)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openaiClient.embeddings.create({
      model: AI_MODELS.EMBEDDING,
      input: text.trim(),
      encoding_format: 'float',
    });

    return response.data[0].embedding;
  } catch (error: any) {
    console.error('Error generating embedding:', error);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

/**
 * Generate embeddings for multiple texts in batch
 * (More efficient than calling generateEmbedding multiple times)
 *
 * @param texts - Array of texts to embed
 * @returns Array of vector embeddings
 */
export async function generateEmbeddingsBatch(
  texts: string[]
): Promise<number[][]> {
  try {
    const response = await openaiClient.embeddings.create({
      model: AI_MODELS.EMBEDDING,
      input: texts.map((t) => t.trim()),
      encoding_format: 'float',
    });

    return response.data.map((item) => item.embedding);
  } catch (error: any) {
    console.error('Error generating embeddings batch:', error);
    throw new Error(`Failed to generate embeddings batch: ${error.message}`);
  }
}

/**
 * Create searchable text from an Adiso
 * This combines the most relevant fields for embedding
 *
 * @param adiso - The adiso object
 * @returns Concatenated searchable text
 */
export function createSearchableText(adiso: Adiso): string {
  const parts: string[] = [];

  // Title (most important)
  if (adiso.titulo) {
    parts.push(adiso.titulo);
  }

  // Category
  if (adiso.categoria) {
    parts.push(adiso.categoria);
  }

  // Description
  if (adiso.descripcion) {
    parts.push(adiso.descripcion);
  }

  // Location
  if (adiso.ubicacion) {
    if (typeof adiso.ubicacion === 'string') {
      parts.push(adiso.ubicacion);
    } else {
      const loc = [
        adiso.ubicacion.distrito,
        adiso.ubicacion.provincia,
        adiso.ubicacion.departamento,
      ]
        .filter(Boolean)
        .join(', ');
      parts.push(loc);
    }
  }

  return parts.join(' | ');
}

/**
 * Generate and store embedding for a single adiso
 *
 * @param adisoId - The adiso ID
 * @returns Success boolean
 */
export async function generateAndStoreEmbedding(
  adisoId: string
): Promise<boolean> {
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  try {
    // Fetch the adiso
    const { data: adiso, error: fetchError } = await supabaseAdmin
      .from('adisos')
      .select('*')
      .eq('id', adisoId)
      .single();

    if (fetchError || !adiso) {
      throw new Error(`Adiso not found: ${adisoId}`);
    }

    // Create searchable text
    const searchableText = createSearchableText(adiso);

    // Generate embedding
    const embedding = await generateEmbedding(searchableText);

    // Store in database
    const { error: updateError } = await supabaseAdmin
      .from('adisos')
      .update({ embedding })
      .eq('id', adisoId);

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ Generated embedding for adiso: ${adisoId}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to generate embedding for ${adisoId}:`, error);
    return false;
  }
}

/**
 * Batch generate embeddings for all adisos without embeddings
 *
 * @param limit - Max number of adisos to process (default: 100)
 * @returns Number of successfully processed adisos
 */
export async function batchGenerateEmbeddings(
  limit: number = 100
): Promise<number> {
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  try {
    // Fetch adisos without embeddings
    const { data: adisos, error: fetchError } = await supabaseAdmin
      .from('adisos')
      .select('*')
      .is('embedding', null)
      .limit(limit);

    if (fetchError) {
      throw fetchError;
    }

    if (!adisos || adisos.length === 0) {
      console.log('✅ All adisos already have embeddings');
      return 0;
    }

    console.log(`🔄 Processing ${adisos.length} adisos...`);

    // Create searchable texts
    const searchableTexts = adisos.map((adiso) => createSearchableText(adiso));

    // Generate embeddings in batch (more efficient)
    const embeddings = await generateEmbeddingsBatch(searchableTexts);

    // Update database with embeddings
    let successCount = 0;
    for (let i = 0; i < adisos.length; i++) {
      try {
        const { error } = await supabaseAdmin
          .from('adisos')
          .update({ embedding: embeddings[i] })
          .eq('id', adisos[i].id);

        if (!error) {
          successCount++;
        }
      } catch (error) {
        console.error(`Failed to update ${adisos[i].id}:`, error);
      }
    }

    console.log(`✅ Successfully generated ${successCount}/${adisos.length} embeddings`);
    return successCount;
  } catch (error: any) {
    console.error('❌ Batch embedding generation failed:', error);
    throw error;
  }
}

/**
 * Cosine similarity between two vectors
 * (Useful for testing/debugging)
 *
 * @param a - First vector
 * @param b - Second vector
 * @returns Similarity score (0-1, where 1 is identical)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
