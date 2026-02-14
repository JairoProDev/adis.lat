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
        <div className="min-h-screen bg-slate-50">
            <Header />
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900">Nuevo Producto</h1>
                    <p className="text-slate-600">Agrega un nuevo producto a tu catálogo manualmente.</p>
                </div>

                <ProductForm mode="create" />
            </div>
        </div>
    );
}
