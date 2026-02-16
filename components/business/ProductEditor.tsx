
import { useState } from 'react';
import { IconBox, IconImage, IconTrash, IconCheck, IconX } from '@/components/Icons';
import { uploadProductImage, updateCatalogProduct, createCatalogProduct } from '@/lib/business';
import { useToast } from '@/hooks/useToast';

interface ProductEditorProps {
    product?: any;
    businessProfileId: string;
    userId: string;
    onSave: (product: any) => void;
    onCancel: () => void;
}

export function ProductEditor({ product, businessProfileId, userId, onSave, onCancel }: ProductEditorProps) {
    const [loading, setLoading] = useState(false);
    const { success, error } = useToast();
    const [formData, setFormData] = useState({
        title: product?.title || '',
        description: product?.description || '',
        price: product?.price || '',
        category: product?.category || '',
        images: product?.images || [], // Expecting array of objects { url: string } or strings
    });

    // Normalize images to array of strings for UI logic simplicity, fix on save
    // Actually schema says images is JSONB. Let's assume array of strings or objects.
    // BentoCard uses `images?.[0]` assuming string or object with url.
    // Let's standardise on array of strings for the editor state if possible, or support objects.
    // Existing data from import might be [{url: ...}].

    const getImageUrl = (img: any) => typeof img === 'string' ? img : img?.url;

    const handleImageUpload = async (file: File) => {
        setLoading(true);
        try {
            const url = await uploadProductImage(file, userId);
            if (url) {
                // Add to images
                // If existing images are objects, we might want to keep that structure?
                // For now, push object { url, type: 'uploaded' }
                const newImage = { url, type: 'uploaded', created_at: new Date().toISOString() };
                setFormData(prev => ({
                    ...prev,
                    images: [...(prev.images || []), newImage]
                }));
                success('Imagen subida');
            } else {
                error('Error al subir imagen');
            }
        } catch (e) {
            console.error(e);
            error('Error al subir imagen');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.title) {
            error('El título es obligatorio');
            return;
        }

        setLoading(true);
        try {
            const productData = {
                title: formData.title,
                description: formData.description,
                price: parseFloat(formData.price) || 0,
                category: formData.category,
                images: formData.images,
                business_profile_id: businessProfileId,
                status: 'published' // Default to published
            };

            let savedProduct;
            if (product?.id) {
                // Update
                savedProduct = await updateCatalogProduct(product.id, productData);
                if (!savedProduct) throw new Error('No se pudo actualizar el producto');
                success('Producto actualizado');
            } else {
                // Create
                savedProduct = await createCatalogProduct(productData);
                if (!savedProduct) throw new Error('No se pudo crear el producto');
                success('Producto creado');
            }

            onSave(savedProduct);
        } catch (e: any) {
            console.error(e);
            error(e.message || 'Error al guardar producto');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm animate-in fade-in duration-200">
            <h3 className="font-bold text-lg mb-4 text-slate-800">
                {product ? 'Editar Producto' : 'Nuevo Producto'}
            </h3>

            <div className="space-y-4">
                {/* Images */}
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">Imágenes</label>
                    <div className="flex flex-wrap gap-2">
                        {formData.images.map((img: any, idx: number) => (
                            <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 group">
                                <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                                <button
                                    onClick={() => {
                                        const newImages = [...formData.images];
                                        newImages.splice(idx, 1);
                                        setFormData({ ...formData, images: newImages });
                                    }}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <IconTrash size={12} />
                                </button>
                            </div>
                        ))}
                        <label className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <IconImage size={20} className="text-slate-400 mb-1" />
                                    <span className="text-[9px] text-slate-400 font-bold">AÑADIR</span>
                                </>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={loading}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleImageUpload(file);
                                }}
                            />
                        </label>
                    </div>
                </div>

                {/* Title */}
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Nombre del producto</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:border-blue-500 outline-none"
                        placeholder="Ej. Zapatillas Nike Air"
                    />
                </div>

                {/* Price & Category */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Precio (S/)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">S/</span>
                            <input
                                type="number"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:border-blue-500 outline-none"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Categoría</label>
                        <input
                            type="text"
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:border-blue-500 outline-none"
                            placeholder="Ej. Calzado"
                        />
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Descripción</label>
                    <textarea
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:border-blue-500 outline-none resize-none h-24"
                        placeholder="Detalles del producto..."
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm shadow-blue-200"
                    >
                        {loading ? 'Guardando...' : (
                            <>
                                <IconCheck size={16} />
                                Guardar
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
