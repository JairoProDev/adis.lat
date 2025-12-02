import { updateUserLocation } from './user';

/**
 * Obtiene la ubicación del usuario usando la Geolocation API del navegador
 */
export async function getCurrentLocation(): Promise<{ lat: number; lng: number; address?: string }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalización no está disponible en este navegador'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Intentar obtener la dirección usando reverse geocoding
        let address: string | undefined;
        try {
          // Usar Nominatim (OpenStreetMap) para reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'Adis.lat/1.0'
              }
            }
          );
          const data = await response.json();
          if (data.display_name) {
            address = data.display_name;
          }
        } catch (error) {
          console.warn('Error al obtener dirección:', error);
          // Continuar sin dirección
        }

        resolve({ lat, lng, address });
      },
      (error) => {
        reject(new Error(`Error al obtener ubicación: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

/**
 * Solicita permiso de ubicación y guarda la ubicación del usuario
 */
export async function requestAndSaveLocation(userId: string): Promise<{ lat: number; lng: number; address?: string }> {
  const location = await getCurrentLocation();
  
  // Guardar en el perfil del usuario
  await updateUserLocation(
    userId,
    location.address || `${location.lat}, ${location.lng}`,
    location.lat,
    location.lng
  );

  return location;
}

/**
 * Verifica si el navegador soporta geolocalización
 */
export function isGeolocationSupported(): boolean {
  return 'geolocation' in navigator;
}

/**
 * Obtiene la ubicación aproximada usando IP (fallback)
 */
export async function getLocationByIP(): Promise<{ lat: number; lng: number; address?: string }> {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    if (data.latitude && data.longitude) {
      return {
        lat: data.latitude,
        lng: data.longitude,
        address: `${data.city || ''}, ${data.region || ''}, ${data.country_name || ''}`.trim()
      };
    }
    
    throw new Error('No se pudo obtener ubicación por IP');
  } catch (error) {
    throw new Error('Error al obtener ubicación por IP');
  }
}






