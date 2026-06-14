import Link from 'next/link';

export default function PromocionarPendientePage() {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <p className="text-4xl mb-3">⏳</p>
      <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">Pago pendiente</h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-sm">
        Tu pago está en revisión. Te avisaremos cuando la promoción quede activa.
      </p>
      <Link href="/" className="px-6 py-3 rounded-full bg-[var(--brand-blue)] text-white font-semibold">
        Ir al inicio
      </Link>
    </main>
  );
}
