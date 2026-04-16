import Link from 'next/link';

export default function EliminarCuentaPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold">Eliminar cuenta o datos</h1>
        <p className="mt-3 text-slate-600">
          Para enviar tu solicitud oficial de eliminacion de cuenta o datos personales, usa el formulario de la
          pagina principal de privacidad:
        </p>
        <p className="mt-4">
          <Link href="/account-deletion" className="font-semibold text-blue-700 underline">
            https://buscadis.com/account-deletion
          </Link>
        </p>
      </div>
    </main>
  );
}
