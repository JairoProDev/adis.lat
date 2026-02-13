import Link from 'next/link';

export function EditorHeader({ progress = 0 }: { progress: number }) {
    return (
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 mb-6">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Editor Profesional</h1>
                    <p className="text-xs text-slate-500">Personaliza cada detalle de tu negocio</p>
                </div>
                <Link href="/mi-negocio" className="text-xs font-semibold text-blue-600 hover:underline">
                    Volver al Dashboard
                </Link>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-700 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <div className="flex justify-between mt-1">
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Nivel Principiante</span>
                <span className="text-[10px] font-bold text-blue-600">{progress}% Completado</span>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Nivel Avanzado</span>
            </div>
        </div>
    );
}
