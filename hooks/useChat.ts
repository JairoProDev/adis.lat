import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { Message } from '@/types';

export function useChat(conversationId: string | null) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (!user || !conversationId) {
            setMessages([]);
            return;
        }

        const fetchMessages = async () => {
            if (!supabase) return;

            setLoading(true);
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching messages:', error);
            } else {
                setMessages(data as Message[]);
                // Mark as read logic could go here
            }
            setLoading(false);
        };

        fetchMessages();

        // Subscribe to new messages in this conversation
        const channel = supabase
            .channel(`chat:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`,
                },
                (payload) => {
                    setMessages((prev) => [...prev, payload.new as Message]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, conversationId]);

    const sendMessage = async (content: string) => {
        if (!supabase || !user || !conversationId || !content.trim()) return;

        setSending(true);
        const { error } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: user.id,
                content: content.trim(),
                read: false
            });

        if (error) {
            console.error('Error sending message:', error);
            // Handle error (toast?)
        }
        setSending(false);
    };

    return {
        messages,
        loading,
        sending,
        sendMessage,
        user
    };
}
