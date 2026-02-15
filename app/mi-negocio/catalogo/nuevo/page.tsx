/**
 * Página de Creación de Producto
 */

'use client';

import Header from '@/components/Header';
import { ToastContainer } from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import ProductForm from '../components/ProductForm';

export default function NewProductPage() {
    const { toasts, removeToast } = useToast();

    return (
        <div className="h-screen flex flex-col bg-[var(--bg-secondary)] overflow-hidden">
            <Header />
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            <div className="flex-1 overflow-y-auto px-4 py-4 md:py-6">
                <div className="max-w-5xl mx-auto">
                    <div className="mb-4">
                        <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Nuevo Producto</h1>
                        <p className="text-slate-500 text-sm">Agrega un nuevo producto a tu catálogo manualmente.</p>
                    </div>

                    <ProductForm mode="create" />
                </div>
            </div>
        </div>
    );
}
