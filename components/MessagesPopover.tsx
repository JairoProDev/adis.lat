import React from 'react';
import { useConversations } from '@/hooks/useConversations';
import { FaComments, FaSearch, FaUserCircle, FaPaperPlane, FaEnvelopeOpen } from 'react-icons/fa';
import { Conversation, Message } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';

interface MessagesPopoverProps {
    onClose: () => void;
    onOpenConversation: (conversationId: string) => void;
}

export default function MessagesPopover({ onClose, onOpenConversation }: MessagesPopoverProps) {
    const { conversations, unreadCount, loading } = useConversations();

    if (loading && conversations.length === 0) {
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
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FaEnvelopeOpen className="text-blue-500" />
                    Mensajes
                </h3>
                {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {unreadCount} nuevos
                    </span>
                )}
            </div>

            {/* Search (Optional) */}
            <div className="p-2 border-b border-gray-100 dark:border-zinc-700 bg-white dark:bg-zinc-900 sticky top-0 z-10">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Buscar mensajes..."
                        className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 dark:bg-zinc-800 border-none rounded-lg focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white placeholder-gray-400"
                    />
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 max-h-[400px]">
                {conversations.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        <div className="flex justify-center mb-3">
                            <FaComments size={32} className="opacity-20" />
                        </div>
                        <p className="text-sm">No tienes conversaciones activas</p>
                        <button className="mt-4 text-xs bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors">
                            Contactar a un vendedor
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50 dark:divide-zinc-700/50">
                        {conversations.map((conversation) => (
                            <div
                                key={conversation.id}
                                className={`p-4 hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer relative group ${conversation.unread_count && conversation.unread_count > 0 ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                onClick={() => onOpenConversation(conversation.id)}
                            >
                                <div className="flex gap-3 items-center">
                                    <div className="flex-shrink-0 relative">
                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-zinc-700 border border-gray-100 dark:border-zinc-600 shadow-sm flex items-center justify-center text-gray-400">
                                            {conversation.other_user?.avatar_url ? (
                                                <Image
                                                    src={conversation.other_user.avatar_url}
                                                    alt={conversation.other_user.nombre || 'Usuario'}
                                                    width={40}
                                                    height={40}
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <FaUserCircle size={24} />
                                            )}
                                        </div>
                                        {/* Status indicator (simulated) */}
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-zinc-800 rounded-full"></div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h4 className={`text-sm text-gray-900 dark:text-gray-100 truncate ${conversation.unread_count && conversation.unread_count > 0 ? 'font-bold' : 'font-medium'}`}>
                                                {conversation.other_user?.nombre || conversation.other_user?.email || 'Usuario Desconocido'}
                                            </h4>
                                            <span className="text-[10px] text-gray-400 font-medium flex-shrink-0 ml-2">
                                                {conversation.last_message_at ? formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true, locale: es }).replace('alrededor de ', '') : ''}
                                            </span>
                                        </div>
                                        <p className={`text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1 ${conversation.unread_count && conversation.unread_count > 0 ? 'text-gray-900 font-medium' : ''}`}>
                                            {conversation.last_message || <span className="italic opacity-70">Nueva conversación</span>}
                                        </p>
                                    </div>

                                    {conversation.unread_count && conversation.unread_count > 0 && (
                                        <div className="flex-shrink-0 self-center ml-2">
                                            <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold shadow-sm">
                                                {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                                            </div>
                                        </div>
                                    )}

                                    {(!conversation.unread_count || conversation.unread_count === 0) && (
                                        <div className="hidden group-hover:flex ml-2 text-gray-400 hover:text-blue-500 transition-colors">
                                            <FaPaperPlane size={14} />
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
                    Ver todos los mensajes
                </button>
            </div>
        </div>
    );
}
