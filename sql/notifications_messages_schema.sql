-- ============================================
-- 1. NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('system', 'like', 'message', 'ad_approved', 'ad_rejected')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can only view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications (mark as read)"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Only system/admin (or trigger) should insert notifications ideally, 
-- but we might allow triggers or functions running with security definer.
-- For now, let's allow users to insert notifications to themselves (e.g. for testing)
CREATE POLICY "Users can insert their own notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (auth.uid() = user_id);


-- ============================================
-- 2. MESSAGING SYSTEM
-- ============================================

-- CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    participants UUID[] NOT NULL, -- Array of user IDs
    last_message TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Policies for Conversations
-- Verify that the current user's ID is in the participants array
CREATE POLICY "Users can view conversations they are part of"
    ON public.conversations FOR SELECT
    USING (auth.uid() = ANY(participants));

CREATE POLICY "Users can insert conversations they are part of"
    ON public.conversations FOR INSERT
    WITH CHECK (auth.uid() = ANY(participants));
    
CREATE POLICY "Users can update conversations they are part of"
    ON public.conversations FOR UPDATE
    USING (auth.uid() = ANY(participants));


-- MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies for Messages
-- Users can see messages if they are part of the conversation
-- This requires a join or a check on the conversation table.
-- For simplicity and performance, we can trust the conversation_id 
-- IF enforce that one must be a participant of the conversation to insert messages.

-- To select messages: Join conversations and check participants
CREATE POLICY "Users can view messages in their conversations"
    ON public.messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = messages.conversation_id
            AND auth.uid() = ANY(c.participants)
        )
    );

-- To insert messages: Ensure sender is the user AND user is in conversation
CREATE POLICY "Users can send messages to their conversations"
    ON public.messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = conversation_id
            AND auth.uid() = ANY(c.participants)
        )
    );
    
-- To update messages (e.g. mark as read): 
-- User can mark messages as read if they are in the conversation (recipient)
CREATE POLICY "Users can update messages in their conversations"
    ON public.messages FOR UPDATE
    USING (
         EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = messages.conversation_id
            AND auth.uid() = ANY(c.participants)
        )
    );

-- ============================================
-- 3. REALTIME SETUP
-- ============================================

-- Add tables to realtime publication
-- This must usually be done in the Supabase Dashboard or via API, 
-- but we can try to add it here if the migration user has permissions.
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- ============================================
-- 4. UTILITY FUNCTIONS
-- ============================================

-- Function to update conversation's updated_at and last_message on new message
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET 
        last_message = NEW.content,
        last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new messages
DROP TRIGGER IF EXISTS on_new_message ON public.messages;
CREATE TRIGGER on_new_message
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_message();
