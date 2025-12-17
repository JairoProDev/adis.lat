-- Create the user_ad_interactions table
CREATE TABLE IF NOT EXISTS public.user_ad_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    adiso_id UUID NOT NULL, -- Assuming adisos table exists, if strict FK needed: REFERENCES public.adisos(id)
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('favorite', 'not_interested', 'view', 'click')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb, -- For extras like 'device', 'session_id' etc
    UNIQUE(user_id, adiso_id, interaction_type)
);

-- Enable Row Level Security
ALTER TABLE public.user_ad_interactions ENABLE ROW LEVEL SECURITY;

-- Create Policies
-- Users can see their own interactions
CREATE POLICY "Users can view their own interactions"
    ON public.user_ad_interactions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own interactions
CREATE POLICY "Users can insert their own interactions"
    ON public.user_ad_interactions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own interactions (e.g. toggle favorite off? usually we delete)
-- But if we want to toggle 'favorite' to 'unfavorite' we might just delete the row.
-- Or we could have an 'active' boolean. For now, let's assume DELETE is used to remove a favorite.

CREATE POLICY "Users can delete their own interactions"
    ON public.user_ad_interactions
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_user_ad_interactions_user_id ON public.user_ad_interactions(user_id);
CREATE INDEX idx_user_ad_interactions_adiso_id ON public.user_ad_interactions(adiso_id);
