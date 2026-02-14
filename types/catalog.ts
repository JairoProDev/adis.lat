/**
 * TypeScript Types for Catalog System
 */

// ============================================================
// CATALOG PRODUCT
// ============================================================

export interface CatalogProduct {
    id: string;
    business_profile_id: string;

    // Basic info
    title: string;
    description?: string;
    sku?: string;
    barcode?: string;

    // Images
    images: ProductImage[];

    // Pricing
    price?: number;
    compare_at_price?: number;
    currency: string;

    // Categorization
    category?: string;
    tags: string[];

    // Attributes
    attributes: Record<string, any> | Array<{ name: string; value: string }>;

    // Inventory
    stock?: number;
    track_inventory: boolean;
    low_stock_alert?: number;

    // SEO
    seo_title?: string;
    seo_description?: string;
    seo_keywords: string[];

    // AI Metadata
    ai_metadata: AIMetadata;

    // Status
    status: 'draft' | 'published' | 'archived';
    stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock';
    is_featured: boolean;
    sort_order: number;

    // Analytics
    view_count: number;
    click_count: number;
    whatsapp_clicks: number;
    share_count: number;

    // Timestamps
    created_at: string;
    updated_at: string;
    published_at?: string;
}

export interface ProductImage {
    url: string;
    is_primary: boolean;
    ai_enhanced: boolean;
    original_url?: string;
    enhancement_type?: 'upscale' | 'remove_bg' | 'recolor' | 'generated';
    alt_text?: string;
}

export interface AIMetadata {
    extracted_from?: 'pdf' | 'photo' | 'excel' | 'manual';
    confidence_score?: number;
    auto_generated?: string[]; // ['title', 'description', 'attributes']
    enhanced_images?: number[]; // Indices of enhanced images
    source_file_url?: string;
    processing_time_ms?: number;
}

// ============================================================
// CATALOG IMPORT
// ============================================================

export interface CatalogImport {
    id: string;
    business_profile_id: string;

    // File info
    file_type: 'pdf' | 'image' | 'excel' | 'multiple';
    file_url: string;
    file_name?: string;
    file_size?: number;

    // Processing
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    progress: number; // 0-100
    current_step?: 'uploading' | 'extracting' | 'enhancing' | 'saving';

    // Results
    products_found: number;
    products_imported: number;
    products_failed: number;
    error_message?: string;
    warnings: string[];

    // AI usage
    ai_tokens_used: number;
    ai_images_processed: number;
    ai_cost_estimate: number;

    // Processing options
    processing_options: ProcessingOptions;

    // Metadata
    processing_metadata: Record<string, any>;

    created_at: string;
    started_at?: string;
    completed_at?: string;
}

export interface ProcessingOptions {
    auto_enhance_images?: boolean;
    generate_descriptions?: boolean;
    detect_price?: boolean;
    remove_backgrounds?: boolean;
    upscale_images?: boolean;
    generate_seo?: boolean;
}

// ============================================================
// CATALOG CATEGORY
// ============================================================

export interface CatalogCategory {
    id: string;
    business_profile_id: string;

    name: string;
    slug: string;
    description?: string;
    icon?: string;
    color?: string;

    // Hierarchy
    parent_id?: string;
    sort_order: number;

    // Metadata
    ai_generated: boolean;
    product_count: number;

    is_active: boolean;

    created_at: string;
    updated_at: string;
}

// ============================================================
// AI JOB
// ============================================================

export interface CatalogAIJob {
    id: string;
    business_profile_id: string;

    job_type: 'enhance_image' | 'generate_content' | 'batch_process' | 'generate_logo';
    status: 'pending' | 'processing' | 'completed' | 'failed';

    input_data: Record<string, any>;
    output_data?: Record<string, any>;
    error_message?: string;

    priority: number;
    retry_count: number;
    max_retries: number;

    created_at: string;
    started_at?: string;
    completed_at?: string;
}

// ============================================================
// FORM DATA TYPES
// ============================================================

export interface ProductFormData {
    title: string;
    description?: string;
    price?: number;
    compare_at_price?: number;
    category?: string;
    tags: string[];
    attributes: Record<string, any>;
    sku?: string;
    barcode?: string;
    stock?: number;
    track_inventory: boolean;
    images: File[];
    status: 'draft' | 'published';
}

export interface ImportFormData {
    files: File[];
    options: ProcessingOptions;
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface APIResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    per_page: number;
    has_more: boolean;
}

// ============================================================
// WIZARD TYPES
// ============================================================

export type WizardStep = 'upload' | 'processing' | 'review' | 'complete';

export interface WizardState {
    currentStep: WizardStep;
    importId?: string;
    files: File[];
    options: ProcessingOptions;
    extractedProducts: CatalogProduct[];
    selectedProducts: string[]; // IDs of products to import
}

// ============================================================
// FILTER & SORT TYPES
// ============================================================

export interface ProductFilters {
    category?: string;
    status?: 'draft' | 'published' | 'archived';
    tags?: string[];
    price_min?: number;
    price_max?: number;
    search?: string;
    is_featured?: boolean;
}

export type ProductSortBy = 'created_at' | 'updated_at' | 'title' | 'price' | 'view_count';
export type SortOrder = 'asc' | 'desc';
