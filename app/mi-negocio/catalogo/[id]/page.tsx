/**
 * Página de Edición de Producto
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import { ToastContainer } from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import ProductForm from '../components/ProductForm';

export default function EditProductPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const { toasts, removeToast, error: showError } = useToast();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        try {
            if (!supabase) throw new Error('Supabase no está configurado');
            setLoading(true);
            const { data, error } = await supabase
                .from('catalog_products')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (error) throw error;
            setProduct(data);

        } catch (err: any) {
            showError('Error al cargar producto: ' + err.message);
            // Optional: redirect to table on error
            // setTimeout(() => router.push('/mi-negocio/catalogo/tabla'), 2000);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Header />
                <div className="flex items-center justify-center p-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Header />
                <div className="text-center p-20 text-slate-500">
                    Producto no encontrado.
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-[var(--bg-secondary)] overflow-hidden">
            <Header />
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            <div className="flex-1 overflow-y-auto px-4 py-4 md:py-6">
                <div className="max-w-5xl mx-auto">
                    <div className="mb-4">
                        <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Editar Producto</h1>
                        <p className="text-slate-500 text-sm">Modifica los detalles de tu producto.</p>
                    </div>

                    <ProductForm mode="edit" initialData={product} />
                </div>
            </div>
        </div>
    );
}
