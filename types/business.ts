export interface SocialLink {
    network: 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin' | 'custom';
    url: string;
    label?: string;
}

export interface BusinessHours {
    [day: string]: {
        open: string;
        close: string;
        closed: boolean;
    };
}

export interface CustomBlock {
    id: string;
    type: 'link' | 'image' | 'video' | 'text' | 'hero';
    label?: string;
    content?: string; // URL or text
    sublabel?: string;
    icon?: string;
    style?: 'default' | 'outline' | 'filled';
    size?: 'small' | 'medium' | 'large' | 'full'; // For Bento grid
}

export interface BusinessProfile {
    id: string;
    user_id: string;
    slug: string;
    name: string;
    description?: string;
    logo_url?: string;
    banner_url?: string;

    theme_color: string;
    theme_mode: 'light' | 'dark' | 'system';
    layout_style: 'standard' | 'bento' | 'minimal';

    contact_email?: string;
    contact_phone?: string;
    contact_whatsapp?: string;
    contact_address?: string;
    contact_maps_url?: string;

    business_hours: BusinessHours;
    social_links: SocialLink[];
    custom_blocks: CustomBlock[];

    is_published: boolean;
    view_count: number;

    created_at: string;
    updated_at: string;
}

export interface BusinessProfileFormData extends Omit<BusinessProfile, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'view_count'> {
    // Form specific fields if any
}
