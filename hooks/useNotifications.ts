import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { Notification } from '@/types';

export function useNotifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        // Initial Fetch
        const fetchNotifications = async () => {
            if (!supabase) return;
            setLoading(true);
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) {
                console.error('Error fetching notifications:', error);
            } else {
                setNotifications(data as Notification[]);
                setUnreadCount(data?.filter((n: Notification) => !n.read).length || 0);
            }
            setLoading(false);
        };

        fetchNotifications();

        if (!supabase) return;

        // Realtime Subscription
        const channel = supabase
            .channel('public:notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    const newNotification = payload.new as Notification;
                    setNotifications((prev) => [newNotification, ...prev]);
                    setUnreadCount((prev) => prev + 1);
                }
            )
            .subscribe();

        return () => {
            supabase?.removeChannel(channel);
        };
    }, [user]);

    const markAsRead = async (id: string) => {
        if (!supabase) return;

        // Optimistic update
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id);

        if (error) {
            console.error('Error marking notification as read:', error);
            // Revert if error (optional, but good practice)
        }
    };

    const markAllAsRead = async () => {
        if (!supabase) return;

        // Optimistic update
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);

        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', user?.id)
            .eq('read', false);

        if (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
    };
}
