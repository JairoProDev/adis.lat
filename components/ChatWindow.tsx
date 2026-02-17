import React, { useEffect, useRef } from 'react';
import { useChat } from '@/hooks/useChat';
import { FaTimes, FaUserCircle, FaPaperPlane } from 'react-icons/fa';
import { formatTimeAgo } from '@/utils/date';

interface ChatWindowProps {
    conversationId: string;
    onClose: () => void;
}

export default function ChatWindow({ conversationId, onClose }: ChatWindowProps) {
    const { messages, loading, sending, sendMessage, user } = useChat(conversationId);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [inputValue, setInputValue] = React.useState('');

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;
        await sendMessage(inputValue);
        setInputValue('');
    };

    return (
        <div className="fixed bottom-0 right-4 w-80 md:w-96 bg-white dark:bg-zinc-800 rounded-t-xl shadow-2xl border border-gray-100 dark:border-zinc-700 z-50 flex flex-col h-[450px] animate-slide-up">
            {/* Header */}
            <div className="p-3 border-b border-gray-100 dark:border-zinc-700 flex justify-between items-center bg-blue-600 text-white rounded-t-xl">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <FaUserCircle />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">Chat</h4>
                        <div className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                            <span className="text-xs opacity-80">En línea</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                    <FaTimes />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-zinc-900" ref={scrollRef}>
                {loading && messages.length === 0 ? (
                    <div className="flex justify-center p-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm mt-10">
                        <p>Comienza la conversación</p>
                        <p className="text-xs mt-2 opacity-70">Tu mensaje será enviado al vendedor.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {messages.map((msg) => {
                            const isMe = user?.id === msg.sender_id;

                            return (
                                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className={`
                                max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm
                                ${isMe
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : 'bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-100 dark:border-zinc-700'
                                        }
                            `}>
                                        {msg.content}
                                    </div>
                                    <span className="text-[10px] text-gray-400 mt-1 px-1">
                                        {formatTimeAgo(msg.created_at)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 border-t border-gray-100 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                <div className="relative flex items-center gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 bg-gray-100 dark:bg-zinc-900 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim() || sending}
                        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <FaPaperPlane size={14} />
                    </button>
                </div>
            </form>
        </div>
    );
}
