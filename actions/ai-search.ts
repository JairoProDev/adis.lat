/**
 * AI-Powered Hybrid Search Server Action
 *
 * This module provides RAG-based search functionality combining:
 * - Semantic search (vector embeddings)
 * - Keyword search (Full-Text Search)
 * - Category and location filtering
 */

'use server';

import { supabase } from '@/lib/supabase';
import { generateEmbedding } from '@/lib/ai/embeddings';
import { Adiso, Categoria } from '@/types';

export interface HybridSearchParams {
  query: string;
  category?: Categoria;
  location?: string;
  maxResults?: number;
  threshold?: number;
  onlyActive?: boolean;
}

export interface HybridSearchResult {
  adiso: Adiso;
  similarity_score: number;
  keyword_rank: number;
  hybrid_score: number;
}

/**
 * Perform hybrid search (Semantic + Keyword)
 *
 * @param params - Search parameters
 * @returns Array of search results with scores
 */
export async function hybridSearch(
  params: HybridSearchParams
): Promise<HybridSearchResult[]> {
  const {
    query,
    category,
    location,
    maxResults = 10,
    threshold = 0.1, // Lower threshold = more results
    onlyActive = true,
  } = params;

  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  if (!query || query.trim().length === 0) {
    throw new Error('Search query cannot be empty');
  }

  try {
    console.log(`🔍 Hybrid Search: "${query}" | Category: ${category || 'all'} | Location: ${location || 'all'}`);

    // Step 1: Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query);

    // Step 2: Call the Supabase hybrid search RPC function
    const { data, error } = await supabase.rpc('match_adisos_hybrid', {
      query_embedding: queryEmbedding,
      query_text: query,
      match_threshold: threshold,
      match_count: maxResults,
      filter_category: category || null,
      filter_location: location || null,
      only_active: onlyActive,
    });

    if (error) {
      console.error('Hybrid search error:', error);
      throw new Error(`Search failed: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.log('📭 No results found');
      return [];
    }

    console.log(`✅ Found ${data.length} results`);

    // Step 3: Transform results
    const results: HybridSearchResult[] = data.map((row: any) => ({
      adiso: {
        id: row.id,
        categoria: row.categoria as Categoria,
        titulo: row.titulo,
        descripcion: row.descripcion,
        contacto: row.contacto,
        ubicacion: row.ubicacion,
        fechaPublicacion: row.fecha_publicacion,
        horaPublicacion: row.hora_publicacion,
        imagenesUrls: row.imagenes_urls ? JSON.parse(row.imagenes_urls) : undefined,
      },
      similarity_score: row.similarity_score || 0,
      keyword_rank: row.keyword_rank || 0,
      hybrid_score: row.hybrid_score || 0,
    }));

    return results;
  } catch (error: any) {
    console.error('❌ Hybrid search failed:', error);
    throw error;
  }
}

/**
 * Semantic-only search (vector similarity)
 * Use when you want conceptual matches without keyword constraints
 *
 * @param query - Search query
 * @param maxResults - Max number of results
 * @param threshold - Similarity threshold (0-1)
 * @returns Array of adisos with similarity scores
 */
export async function semanticSearch(
  query: string,
  maxResults: number = 10,
  threshold: number = 0.5
): Promise<Array<Adiso & { similarity: number }>> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);

    // Call semantic search RPC
    const { data, error } = await supabase.rpc('match_adisos_semantic', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: maxResults,
    });

    if (error) {
      throw error;
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      categoria: row.categoria as Categoria,
      titulo: row.titulo,
      descripcion: row.descripcion,
      contacto: '',
      ubicacion: '',
      fechaPublicacion: '',
      horaPublicacion: '',
      similarity: row.similarity,
    }));
  } catch (error: any) {
    console.error('Semantic search failed:', error);
    throw error;
  }
}

/**
 * Log search query for analytics
 *
 * @param query - Search query
 * @param resultsCount - Number of results found
 * @param userId - Optional user ID
 */
export async function logSearch(
  query: string,
  resultsCount: number,
  userId?: string
): Promise<void> {
  if (!supabase) return;

  try {
    const queryEmbedding = await generateEmbedding(query);

    await supabase.from('ai_search_logs').insert({
      query_text: query,
      query_embedding: queryEmbedding,
      results_count: resultsCount,
      user_id: userId || null,
      session_id: Math.random().toString(36).substring(7),
    });
  } catch (error) {
    // Don't fail the search if logging fails
    console.error('Failed to log search:', error);
  }
}

/**
 * Get personalized recommendations for a user
 * Based on their search history
 *
 * @param userId - User ID
 * @param limit - Number of recommendations
 * @returns Array of recommended adisos
 */
export async function getRecommendations(
  userId: string,
  limit: number = 10
): Promise<Adiso[]> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase.rpc('get_user_recommendations', {
      p_user_id: userId,
      p_limit: limit,
    });

    if (error) {
      throw error;
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      titulo: row.titulo,
      categoria: row.categoria as Categoria,
      descripcion: '',
      contacto: '',
      ubicacion: '',
      fechaPublicacion: '',
      horaPublicacion: '',
    }));
  } catch (error: any) {
    console.error('Failed to get recommendations:', error);
    return [];
  }
}
