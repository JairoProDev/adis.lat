'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { IconUpload, IconX, IconSparkles, IconCamera, IconFile, IconTable, IconCheck, IconArrowLeft } from '@/components/Icons';
import Header from '@/components/Header';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import type { WizardStep, ProcessingOptions } from '@/types/catalog';

export default function CatalogImportWizard() {
    const router = useRouter();
    const { success, error: showError, toasts, removeToast } = useToast();

    const [currentStep, setCurrentStep] = useState<WizardStep>('upload');
    const [files, setFiles] = useState<File[]>([]);
    const [options, setOptions] = useState<ProcessingOptions>({
        auto_enhance_images: true,
        generate_descriptions: true,
        detect_price: true,
        remove_backgrounds: false,
        upscale_images: false,
        generate_seo: true
    });
    const [cameraActive, setCameraActive] = useState(false);

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

        // TODO: Implementar upload y procesamiento
        setCurrentStep('processing');

        // Simular procesamiento
        setTimeout(() => {
            setCurrentStep('review');
        }, 3000);
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
                            number={1} title="Subir"
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
                        />
                    )}

                    {currentStep === 'processing' && (
                        <ProcessingStep />
                    )}

                    {currentStep === 'review' && (
                        <ReviewStep />
                    )}
                </div>
            </main>

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
}

// ============================================================
// STEP 1: UPLOAD
// ============================================================

function UploadStep({
    files,
    onDrop,
    getRootProps,
    getInputProps,
    isDragActive,
    removeFile,
    options,
    setOptions,
    onContinue
}: any) {
    return (
        <div className="p-6 md:p-10">
            {/* Drop Zone */}
            <div
                {...getRootProps()}
                className={`
          relative border-3 border-dashed rounded-2xl p-8 md:p-12 text-center cursor-pointer
          transition-all duration-200
          ${isDragActive
                        ? 'border-[var(--brand-blue)] bg-[var(--brand-blue)]/5 scale-[1.02]'
                        : 'border-[var(--border-color)] hover:border-[var(--brand-blue)] hover:bg-[var(--bg-secondary)]'
                    }
        `}
            >
                <input {...getInputProps()} />

                <div className="w-20 h-20 bg-gradient-to-br from-[var(--brand-blue)] to-[#3d8da3] rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <IconUpload size={40} className="text-white" />
                </div>

                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                    {isDragActive ? '¡Suelta los archivos aquí!' : 'Arrastra archivos o haz click'}
                </h3>

                <p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
                    Soportamos PDF, imágenes (JPG, PNG), Excel (.xlsx, .xls) y CSV
                </p>

                <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                    <div className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-secondary)] rounded-full">
                        <IconFile size={16} className="text-red-500" />
                        <span className="text-[var(--text-secondary)]">PDF</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-secondary)] rounded-full">
                        <IconUpload size={16} className="text-blue-500" />
                        <span className="text-[var(--text-secondary)]">Imágenes</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-secondary)] rounded-full">
                        <IconTable size={16} className="text-green-500" />
                        <span className="text-[var(--text-secondary)]">Excel/CSV</span>
                    </div>
                </div>
            </div>

            {/* Camera Option (Mobile) */}
            <div className="mt-4 md:hidden">
                <button
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--bg-secondary)] border-2 border-[var(--border-color)] rounded-xl hover:border-[var(--brand-blue)] transition-colors"
                >
                    <IconCamera size={20} />
                    <span className="font-medium">Tomar Foto con Cámara</span>
                </button>
            </div>

            {/* Selected Files */}
            {files.length > 0 && (
                <div className="mt-6">
                    <h4 className="font-bold text-[var(--text-primary)] mb-3">
                        Archivos seleccionados ({files.length})
                    </h4>
                    <div className="space-y-2">
                        {files.map((file, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-3 p-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]"
                            >
                                <div className="w-10 h-10 rounded-lg bg-[var(--brand-blue)]/10 flex items-center justify-center flex-shrink-0">
                                    {file.type.includes('pdf') ? (
                                        <IconFile size={20} className="text-red-500" />
                                    ) : file.type.includes('image') ? (
                                        <IconUpload size={20} className="text-blue-500" />
                                    ) : (
                                        <IconTable size={20} className="text-green-500" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-[var(--text-primary)] truncate">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-[var(--text-tertiary)]">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>

                                <button
                                    onClick={() => removeFile(index)}
                                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    <IconX size={18} className="text-red-500" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* AI Options */}
            <div className="mt-8 p-6 bg-gradient-to-br from-[var(--brand-blue)]/5 to-[#3d8da3]/5 rounded-2xl border border-[var(--brand-blue)]/20">
                <div className="flex items-center gap-2 mb-4">
                    <IconSparkles size={20} className="text-[var(--brand-blue)]" />
                    <h4 className="font-bold text-[var(--text-primary)]">Opciones de IA</h4>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                    <AIOption
                        label="Generar descripciones"
                        description="IA crea descripciones persuasivas"
                        checked={options.generate_descriptions}
                        onChange={(checked) => setOptions({ ...options, generate_descriptions: checked })}
                    />
                    <AIOption
                        label="Detectar precios"
                        description="Extrae precios automáticamente"
                        checked={options.detect_price}
                        onChange={(checked) => setOptions({ ...options, detect_price: checked })}
                    />
                    <AIOption
                        label="Mejorar imágenes"
                        description="Mejora calidad automáticamente"
                        checked={options.auto_enhance_images}
                        onChange={(checked) => setOptions({ ...options, auto_enhance_images: checked })}
                    />
                    <AIOption
                        label="Upscale de imágenes"
                        description="Aumenta resolución 4x"
                        checked={options.upscale_images}
                        onChange={(checked) => setOptions({ ...options, upscale_images: checked })}
                    />
                    <AIOption
                        label="Quitar fondos"
                        description="Remueve fondo de productos"
                        checked={options.remove_backgrounds}
                        onChange={(checked) => setOptions({ ...options, remove_backgrounds: checked })}
                    />
                    <AIOption
                        label="Optimizar SEO"
                        description="Genera keywords y meta tags"
                        checked={options.generate_seo}
                        onChange={(checked) => setOptions({ ...options, generate_seo: checked })}
                    />
                </div>
            </div>

            {/* Continue Button */}
            <button
                onClick={onContinue}
                disabled={files.length === 0}
                className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[var(--brand-blue)] to-[#3d8da3] text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
                <IconSparkles size={20} />
                <span>Procesar con IA</span>
            </button>
        </div>
    );
}

function AIOption({ label, description, checked, onChange }: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <label className="flex items-start gap-3 cursor-pointer group">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-2 border-[var(--border-color)] checked:bg-[var(--brand-blue)] checked:border-[var(--brand-blue)] cursor-pointer"
            />
            <div className="flex-1">
                <p className="font-medium text-[var(--text-primary)] group-hover:text-[var(--brand-blue)] transition-colors">
                    {label}
                </p>
                <p className="text-xs text-[var(--text-tertiary)]">
                    {description}
                </p>
            </div>
        </label>
    );
}

// ============================================================
// STEP 2: PROCESSING
// ============================================================

function ProcessingStep() {
    const [progress, setProgress] = useState(0);
    const [currentTask, setCurrentTask] = useState('Extrayendo productos...');

    // Simulate progress
    useState(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 5;
            });

            // Change task messages
            if (progress < 30) setCurrentTask('🔍 Extrayendo productos...');
            else if (progress < 60) setCurrentTask('🎨 Mejorando imágenes...');
            else if (progress < 90) setCurrentTask('📝 Generando descripciones...');
            else setCurrentTask('✅ Finalizando...');
        }, 200);

        return () => clearInterval(interval);
    });

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
                    {currentTask}
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
                <div className="mt-8 grid grid-cols-3 gap-4">
                    <div className="p-4 bg-[var(--bg-secondary)] rounded-xl">
                        <p className="text-2xl font-black text-[var(--text-primary)]">47</p>
                        <p className="text-xs text-[var(--text-tertiary)]">Productos</p>
                    </div>
                    <div className="p-4 bg-[var(--bg-secondary)] rounded-xl">
                        <p className="text-2xl font-black text-[var(--text-primary)]">130</p>
                        <p className="text-xs text-[var(--text-tertiary)]">Imágenes</p>
                    </div>
                    <div className="p-4 bg-[var(--bg-secondary)] rounded-xl">
                        <p className="text-2xl font-black text-[var(--text-primary)]">98%</p>
                        <p className="text-xs text-[var(--text-tertiary)]">Confianza</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// STEP 3: REVIEW
// ============================================================

function ReviewStep() {
    return (
        <div className="p-6 md:p-10">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconCheck size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2">
                    🎉 ¡Listo! 47 productos encontrados
                </h2>
                <p className="text-[var(--text-secondary)]">
                    Revisa y edita antes de publicar
                </p>
            </div>

            {/* Product Grid Preview */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} className="bg-[var(--bg-secondary)] rounded-xl p-3 border border-[var(--border-color)]">
                        <div className="aspect-square bg-gray-200 rounded-lg mb-2" />
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                            Producto {i}
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)]">S/ 99.90</p>
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col md:flex-row gap-3">
                <button className="flex-1 px-6 py-4 border-2 border-[var(--border-color)] rounded-2xl font-bold hover:border-[var(--brand-blue)] transition-colors">
                    Editar Productos
                </button>
                <button className="flex-1 px-6 py-4 bg-gradient-to-r from-[var(--brand-blue)] to-[#3d8da3] text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]">
                    Importar a Catálogo
                </button>
            </div>
        </div>
    );
}

// ============================================================
// STEP INDICATOR
// ============================================================

function StepIndicator({ number, title, active, completed }: {
    number: number;
    title: string;
    active: boolean;
    completed: boolean;
}) {
    return (
        <div className="flex flex-col items-center gap-2">
            <div className={`
        w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200
        ${completed
                    ? 'bg-[var(--brand-blue)] text-white'
                    : active
                        ? 'bg-[var(--brand-blue)] text-white scale-110'
                        : 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)]'
                }
      `}>
                {completed ? <IconCheck size={20} /> : number}
            </div>
            <span className={`text-xs font-medium ${active ? 'text-[var(--brand-blue)]' : 'text-[var(--text-tertiary)]'}`}>
                {title}
            </span>
        </div>
    );
}
