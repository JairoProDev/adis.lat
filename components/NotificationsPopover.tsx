import React from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { FaBell, FaCheck, FaInfoCircle, FaHeart, FaCommentAlt, FaBullhorn } from 'react-icons/fa';
import { Notification, NotificationType } from '@/types';
import { formatTimeAgo } from '@/utils/date';

interface NotificationsPopoverProps {
    onClose: () => void;
}

export default function NotificationsPopover({ onClose }: NotificationsPopoverProps) {
    const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

    // Handle click outside (optional, usually handled by parent or overlay)

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case 'like': return <FaHeart className="text-red-500" />;
            case 'message': return <FaCommentAlt className="text-blue-500" />;
            case 'ad_approved': return <FaCheck className="text-green-500" />;
            case 'ad_rejected': return <FaInfoCircle className="text-red-500" />;
            case 'system':
            default: return <FaBullhorn className="text-yellow-500" />;
        }
    };

    if (loading && notifications.length === 0) {
        return (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl border border-gray-100 dark:border-zinc-700 p-4 z-50 animate-fade-in-down">
                <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl border border-gray-100 dark:border-zinc-700 overflow-hidden z-50 animate-fade-in-down flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-zinc-700 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-800/50 backdrop-blur-sm">
                <h3 className="font-bold text-gray-900 dark:text-white">Notificaciones</h3>
                {unreadCount > 0 && (
                    <button
                        onClick={() => markAllAsRead()}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                        Marcar todo leído
                    </button>
                )}
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        <div className="flex justify-center mb-3">
                            <FaBell size={32} className="opacity-20" />
                        </div>
                        <p className="text-sm">No tienes notificaciones nuevas</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50 dark:divide-zinc-700/50">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`p-4 hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer relative group ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                onClick={() => markAsRead(notification.id)}
                            >
                                <div className="flex gap-3">
                                    <div className="mt-1 flex-shrink-0">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-zinc-700 shadow-sm border border-gray-100 dark:border-zinc-600`}>
                                            {getIcon(notification.type)}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm text-gray-900 dark:text-gray-100 ${!notification.read ? 'font-semibold' : 'font-medium'}`}>
                                            {notification.title}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-1.5 font-medium">
                                            {formatTimeAgo(notification.created_at)}
                                        </p>
                                    </div>
                                    {!notification.read && (
                                        <div className="flex-shrink-0 self-center">
                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
                <button className="w-full py-2 text-xs font-medium text-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Ver todas las notificaciones
                </button>
            </div>
        </div>
    );
}
