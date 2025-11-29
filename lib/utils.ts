export const formatFecha = (fecha: string, hora: string): string => {
  const date = new Date(`${fecha}T${hora}`);
  
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getWhatsAppUrl = (contacto: string, titulo: string, categoria: string, id: string): string => {
  const url = `${window.location.origin}/?aviso=${id}`;
  const mensajeBase = `Hola, vi tu aviso de ${categoria} "${titulo}" en ${url} y me interesa. ¿Podrías brindarme más información, por favor?`;
  const mensaje = encodeURIComponent(mensajeBase);
  const numero = contacto.replace(/\D/g, ''); // Solo números
  return `https://wa.me/${numero}?text=${mensaje}`;
};

export const copiarLink = (id: string): Promise<void> => {
  const url = `${window.location.origin}/?aviso=${id}`;
  return navigator.clipboard.writeText(url);
};

export const compartirNativo = async (id: string, titulo: string): Promise<void> => {
  const url = `${window.location.origin}/?aviso=${id}`;
  
  if (navigator.share) {
    try {
      await navigator.share({
        title: titulo,
        text: `Mira este aviso: ${titulo}`,
        url: url
      });
    } catch (err) {
      // Usuario canceló o error
      console.log('Error al compartir:', err);
    }
  } else {
    // Fallback: copiar al portapapeles
    await copiarLink(id);
  }
};

