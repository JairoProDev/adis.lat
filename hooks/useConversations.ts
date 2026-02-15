import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { Conversation, Message } from '@/types';

export function useConversations() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // Initial fetch of conversations
    useEffect(() => {
        if (!user) return;

        const fetchConversations = async () => {
            if (!supabase) return;
            setLoading(true);

            // Fetch conversations where user is a participant
            const { data, error } = await supabase
                .from('conversations')
                .select(`
          id,
          participants,
          last_message,
          last_message_at,
          updated_at,
          created_at,
          unread_count:messages(count)
        `)
                .contains('participants', [user.id])
                .order('updated_at', { ascending: false });

            if (error) {
                console.error('Error fetching conversations:', error);
            } else {
                // Need to fetch other participant details manually since we store IDs in array
                // Or we could join with profiles/users table if we had a many-to-many table. 
                // With array, we need a second query or a function.
                // For now, let's fetch user profiles for the OTHER participant.

                const enhancedConversations = await Promise.all(data.map(async (conv: any) => {
                    const otherUserId = conv.participants.find((id: string) => id !== user.id);
                    let otherUser = null;

                    if (otherUserId && supabase) {
                        const { data: userData } = await supabase
                            .from('profiles') // Assuming profiles table exists, otherwise users
                            .select('id, email, nombre, avatar_url')
                            .eq('id', otherUserId)
                            .single();
                        otherUser = userData;
                    }

                    return {
                        ...conv,
                        other_user: otherUser,
                        unread_count: conv.unread_count?.[0]?.count || 0 // This count needs filtering by read=false and sender!=me
                    };
                }));

                setConversations(enhancedConversations);

                // Caluclate total unread
                // Note: The count aggregation above is simplistic. 
                // Real unread count per conversation requires: count of messages where conversation_id=X AND read=false AND sender_id!=me
                // Providing accurate unread counts in list view is computationally expensive without a materialized view or specific counters.
                // We will implement a simpler unread check for now or fetch actual unread messages count.
            }
            setLoading(false);
        };

        fetchConversations();

        if (!supabase) return;

        // Realtime Subscription to Conversations (new messages update the conversation row)
        const channel = supabase
            .channel('public:conversations')
            .on(
                'postgres_changes',
                {
                    event: '*', // INSERT, UPDATE
                    schema: 'public',
                    table: 'conversations',
                    filter: `participants=cs.{${user.id}}`, // 'cs' means contains
                },
                (payload) => {
                    // Reload conversations on update to get latest message and generic info
                    // Optimizing this would require merging payload into state
                    fetchConversations();
                }
            )
            .subscribe();

        return () => {
            supabase?.removeChannel(channel);
        };
    }, [user]);

    return {
        conversations,
        unreadCount,
        loading,
    };
}
