'use client';

import React, { useState } from 'react';
import { FaBullhorn, FaHeart, FaComment, FaShare, FaUserCircle, FaCheckCircle } from 'react-icons/fa';
import { Adiso } from '@/types';
import { formatTimeAgo } from '@/utils/date';

interface FeedPost {
    id: string;
    author: {
        name: string;
        avatar?: string;
        role: 'admin' | 'user' | 'system';
        isVerified?: boolean;
    };
    content: string;
    image?: string;
    timestamp: string;
    likes: number;
    comments: number;
    type: 'announcement' | 'ad_highlight' | 'status';
    adiso?: Adiso; // If highlighting an ad
}

const MOCK_POSTS: FeedPost[] = [
    {
        id: '1',
        author: { name: 'Equipo Buscadis', role: 'admin', isVerified: true },
        content: '¡Bienvenidos a la nueva versión de Buscadis! 🚀\nHemos actualizado nuestra plataforma para ofrecerte una mejor experiencia. Ahora puedes publicar anuncios con ubicación exacta, chatear con nuestro asistente IA y mucho más.\n\n¿Qué te parece el nuevo diseño?',
        timestamp: new Date().toISOString(),
        likes: 42,
        comments: 12,
        type: 'announcement',
        image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    },
    {
        id: '2',
        author: { name: 'Sistema', role: 'system' },
        content: '🔧 Mantenimiento programado: El próximo martes 20 realizaremos mejoras en el sistema de chat. El servicio podría interrumpirse brevemente durante la madrugada.',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        likes: 15,
        comments: 3,
        type: 'status'
    },
    {
        id: '3',
        author: { name: 'Cusco Noticias', role: 'user', isVerified: true },
        content: '📢 Se reporta tráfico intenso en Av. La Cultura por obras. Tomen precauciones si van a realizar entregas por la zona.',
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        likes: 89,
        comments: 45,
        type: 'status'
    }
];

export default function FeedView() {
    const [posts, setPosts] = useState<FeedPost[]>(MOCK_POSTS);

    const handleLike = (id: string) => {
        setPosts(prev => prev.map(p =>
            p.id === id ? { ...p, likes: p.likes + 1 } : p
        ));
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-20">
            {/* Create Post Input (Mock) */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-zinc-700">
                <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center text-gray-500">
                        <FaUserCircle size={24} />
                    </div>
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="¿Qué estás pensando, Jairo?"
                            className="w-full bg-gray-50 dark:bg-zinc-900 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-none"
                        />
                    </div>
                </div>
                <div className="flex justify-between mt-3 pt-3 border-t border-gray-100 dark:border-zinc-700">
                    <button className="flex items-center gap-2 text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-700 px-3 py-1.5 rounded-lg text-sm transition-colors">
                        📷 <span className="hidden sm:inline">Foto/Video</span>
                    </button>
                    <button className="flex items-center gap-2 text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-700 px-3 py-1.5 rounded-lg text-sm transition-colors">
                        😊 <span className="hidden sm:inline">Sentimiento</span>
                    </button>
                </div>
            </div>

            {/* Feed Stream */}
            {posts.map(post => (
                <article key={post.id} className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700 overflow-hidden">
                    {/* Header */}
                    <div className="p-4 flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
                            {post.author.name[0]}
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{post.author.name}</h3>
                                {post.author.isVerified && <FaCheckCircle className="text-blue-500 text-xs" />}
                                {post.type === 'announcement' && (
                                    <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-full font-medium">Oficial</span>
                                )}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                {formatTimeAgo(post.timestamp)} · <span title="Público">🌍</span>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-4 pb-3">
                        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line leading-relaxed">
                            {post.content}
                        </p>
                    </div>

                    {/* Media */}
                    {post.image && (
                        <div className="w-full relative aspect-video bg-gray-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={post.image} alt="Post content" className="w-full h-full object-cover" />
                        </div>
                    )}

                    {/* Stats */}
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-zinc-700 flex justify-between text-xs text-gray-500">
                        <span>{post.likes} me gusta</span>
                        <span>{post.comments} comentarios</span>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between px-2 py-1">
                        <button
                            onClick={() => handleLike(post.id)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded-lg text-gray-600 dark:text-gray-400 font-medium text-sm transition-colors active:scale-95"
                        >
                            <FaHeart className={post.likes > 0 ? "text-red-500" : ""} /> Me gusta
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded-lg text-gray-600 dark:text-gray-400 font-medium text-sm transition-colors">
                            <FaComment /> Comentar
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded-lg text-gray-600 dark:text-gray-400 font-medium text-sm transition-colors">
                            <FaShare /> Compartir
                        </button>
                    </div>
                </article>
            ))}

            <div className="text-center py-6 text-gray-400 text-sm">
                No hay más publicaciones por ahora
            </div>
        </div>
    );
}
