'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { IconUpload, IconX, IconSparkles, IconCamera, IconFile, IconTable, IconCheck, IconArrowLeft } from '@/components/Icons';
import Header from '@/components/Header';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import type { WizardStep, ProcessingOptions, CatalogProduct } from '@/types/catalog';

export default function CatalogImportWizard() {
    const router = useRouter();
    const { success, error: showError, toasts, removeToast } = useToast();

    const [currentStep, setCurrentStep] = useState<WizardStep>('upload');
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [importId, setImportId] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [currentTask, setCurrentTask] = useState('');
    const [extractedProducts, setExtractedProducts] = useState<CatalogProduct[]>([]);
    const [options, setOptions] = useState<ProcessingOptions>({
        auto_enhance_images: true,
        generate_descriptions: true,
        detect_price: true,
        remove_backgrounds: false,
        upscale_images: false,
        generate_seo: true
    });

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(prev => [...prev, ...acceptedFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'text/csv': ['.csv']
        },
        multiple: true
    });

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleContinue = async () => {
        if (files.length === 0) {
            showError('Selecciona al menos un archivo');
            return;
        }

        try {
            setUploading(true);
            setCurrentStep('processing');

            // Step 1: Upload files
            const formData = new FormData();
            files.forEach(file => formData.append('files', file));

            const uploadRes = await fetch('/api/catalog/upload', {
                method: 'POST',
                body: formData
            });

            const uploadData = await uploadRes.json();

            if (!uploadData.success) {
                throw new Error(uploadData.error || 'Error al subir archivos');
            }

            // Step 2: Start processing
            const processRes = await fetch('/api/catalog/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    files: uploadData.files,
                    options
                })
            });

            const processData = await processRes.json();

            if (!processData.success) {
                throw new Error(processData.error || 'Error al iniciar procesamiento');
            }

            setImportId(processData.importId);

            // Step 3: Poll for progress
            pollImportStatus(processData.importId);

        } catch (error: any) {
            console.error('Import error:', error);
            showError(error.message || 'Error al importar productos');
            setCurrentStep('upload');
        } finally {
            setUploading(false);
        }
    };

    const pollImportStatus = async (id: string) => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/catalog/process?importId=${id}`);
                const data = await res.json();

                if (!data.success) {
                    clearInterval(interval);
                    throw new Error(data.error);
                }

                const importRecord = data.import;
                setProgress(importRecord.progress || 0);
                setCurrentTask(getCurrentTaskMessage(importRecord.current_step));

                if (importRecord.status === 'completed') {
                    clearInterval(interval);
                    setExtractedProducts(data.products || []);
                    setCurrentStep('review');
                    success(`¡${data.products?.length || 0} productos importados!`);
                } else if (importRecord.status === 'failed') {
                    clearInterval(interval);
                    throw new Error(importRecord.error_message || 'Error en procesamiento');
                }
            } catch (error: any) {
                clearInterval(interval);
                console.error('Poll error:', error);
                showError(error.message);
                setCurrentStep('upload');
            }
        }, 2000); // Poll every 2 seconds
    };

    const getCurrentTaskMessage = (step?: string) => {
        switch (step) {
            case 'uploading':
                return '📤 Subiendo archivos...';
            case 'extracting':
                return '🔍 Extrayendo productos con IA...';
            case 'enhancing':
                return '🎨 Mejorando imágenes...';
            case 'saving':
                return '💾 Guardando en catálogo...';
            default:
                return '⏳ Procesando...';
        }
    };

    const handleImportToLocal = async () => {
        success('Productos importados correctamente');
        router.push('/mi-negocio/catalogo');
    };

    return (
        <div className="min-h-screen bg-[var(--bg-secondary)]">
            <Header />

            <main className="max-w-5xl mx-auto px-4 py-6 md:py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-[var(--bg-primary)] rounded-lg transition-colors"
                        disabled={currentStep === 'processing'}
                    >
                        <IconArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-[var(--text-primary)]">
                            ✨ Importar Productos con IA
                        </h1>
                        <p className="text-sm md:text-base text-[var(--text-secondary)]">
                            De PDF a catálogo profesional en minutos
                        </p>
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-between max-w-2xl mx-auto">
                        <StepIndicator
                            number={1}
                            title="Subir"
                            active={currentStep === 'upload'}
                            completed={['processing', 'review', 'complete'].includes(currentStep)}
                        />
                        <div className="flex-1 h-1 bg-[var(--border-color)] mx-2" />
                        <StepIndicator
                            number={2}
                            title="Procesando"
                            active={currentStep === 'processing'}
                            completed={['review', 'complete'].includes(currentStep)}
                        />
                        <div className="flex-1 h-1 bg-[var(--border-color)] mx-2" />
                        <StepIndicator
                            number={3}
                            title="Revisar"
                            active={currentStep === 'review'}
                            completed={currentStep === 'complete'}
                        />
                    </div>
                </div>

                {/* Step Content */}
                <div className="bg-[var(--bg-primary)] rounded-3xl border-2 border-[var(--border-subtle)] overflow-hidden">
                    {currentStep === 'upload' && (
                        <UploadStep
                            files={files}
                            onDrop={onDrop}
                            getRootProps={getRootProps}
                            getInputProps={getInputProps}
                            isDragActive={isDragActive}
                            removeFile={removeFile}
                            options={options}
                            setOptions={setOptions}
                            onContinue={handleContinue}
                            uploading={uploading}
                        />
                    )}

                    {currentStep === 'processing' && (
                        <ProcessingStep
                            progress={progress}
                            currentTask={currentTask}
                            productsFound={extractedProducts.length}
                        />
                    )}

                    {currentStep === 'review' && (
                        <ReviewStep
                            products={extractedProducts}
                            onImport={handleImportToCatalog}
                        />
                    )}
                </div>
            </main>

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
}

// ... (rest of the components remain the same, just update ProcessingStep and ReviewStep signatures)

function ProcessingStep({ progress, currentTask, productsFound }: {
    progress: number;
    currentTask: string;
    productsFound: number;
}) {
    return (
        <div className="p-6 md:p-10 text-center">
            <div className="max-w-md mx-auto">
                {/* Animated Icon */}
                <div className="w-24 h-24 bg-gradient-to-br from-[var(--brand-blue)] to-[#3d8da3] rounded-full flex items-center justify-center mx-auto mb-6 relative">
                    <IconSparkles size={48} className="text-white animate-pulse" />
                    <div className="absolute inset-0 rounded-full border-4 border-[var(--brand-blue)] border-t-transparent animate-spin" />
                </div>

                <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2">
                    ✨ Magia en proceso...
                </h2>
                <p className="text-[var(--text-secondary)] mb-8">
                    {currentTask || 'Procesando con IA...'}
                </p>

                {/* Progress Bar */}
                <div className="w-full h-3 bg-[var(--bg-secondary)] rounded-full overflow-hidden mb-3">
                    <div
                        className="h-full bg-gradient-to-r from-[var(--brand-blue)] to-[#3d8da3] transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="text-sm font-bold text-[var(--brand-blue)]">
                    {progress}% completado
                </p>

                {/* Stats */}
                {productsFound > 0 && (
                    <div className="mt-8 p-4 bg-[var(--bg-secondary)] rounded-xl">
                        <p className="text-3xl font-black text-[var(--brand-blue)]">{productsFound}</p>
                        <p className="text-sm text-[var(--text-tertiary)]">Productos encontrados</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function ReviewStep({ products, onImport }: {
    products: CatalogProduct[];
    onImport: () => void;
}) {
    const router = useRouter();

    return (
        <div className="p-6 md:p-10">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconCheck size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2">
                    🎉 ¡Listo! {products.length} productos encontrados
                </h2>
                <p className="text-[var(--text-secondary)]">
                    Tus productos están listos en el catálogo
                </p>
            </div>

            {/* Product Grid Preview */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8 max-h-[400px] overflow-y-auto">
                {products.slice(0, 12).map(product => (
                    <div key={product.id} className="bg-[var(--bg-secondary)] rounded-xl p-3 border border-[var(--border-color)]">
                        {product.images[0] ? (
                            <img
                                src={product.images[0].url}
                                alt={product.title}
                                className="aspect-square bg-gray-200 rounded-lg mb-2 w-full object-cover"
                            />
                        ) : (
                            <div className="aspect-square bg-gray-200 rounded-lg mb-2" />
                        )}
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                            {product.title}
                        </p>
                        {product.price && (
                            <p className="text-xs text-[var(--brand-blue)] font-bold">
                                S/ {product.price.toFixed(2)}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            {products.length > 12 && (
                <p className="text-center text-sm text-[var(--text-tertiary)] mb-6">
                    +{products.length - 12} productos más...
                </p>
            )}

            {/* Actions */}
            <div className="flex flex-col md:flex-row gap-3">
                <button
                    onClick={() => router.push('/mi-negocio/catalogo')}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-[var(--brand-blue)] to-[#3d8da3] text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
                >
                    Ver Mi Catálogo
                </button>
            </div>
        </div>
    );
}

// Keep all other components (UploadStep, AIOption, StepIndicator) the same...
