import { useState, useEffect, useCallback } from 'react';

interface GeolocationData {
    latitude: number;
    longitude: number;
    accuracy: number;
    distrito?: string;
    provincia?: string;
    departamento?: string;
}

interface UseGeolocationReturn {
    location: GeolocationData | null;
    locationText: string;
    error: string | null;
    isLoading: boolean;
    requestLocation: () => void;
}

// Reverse geocoding (coordenadas → ubicación textual)
async function reverseGeocode(lat: number, lon: number): Promise<{ distrito?: string; provincia?: string; departamento?: string }> {
    try {
        // Usar Nominatim (OpenStreetMap) - gratis y sin API key
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'Buscadis/1.0'
                }
            }
        );

        if (!response.ok) throw new Error('Failed to reverse geocode');

        const data = await response.json();
        const address = data.address || {};

        return {
            distrito: address.suburb || address.neighbourhood || address.hamlet || address.village,
            provincia: address.city || address.town || address.municipality,
            departamento: address.state || address.region
        };
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return {};
    }
}

export function useGeolocation(autoRequest: boolean = false): UseGeolocationReturn {
    const [location, setLocation] = useState<GeolocationData | null>(null);
    const [locationText, setLocationText] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const requestLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setError('Tu navegador no soporta geolocalización');
            setLocationText('');
            return;
        }

        setIsLoading(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude, accuracy } = position.coords;

                // Obtener nombres de ubicación
                const addressDetails = await reverseGeocode(latitude, longitude);

                const locationData: GeolocationData = {
                    latitude,
                    longitude,
                    accuracy,
                    ...addressDetails
                };

                setLocation(locationData);

                // Construir texto de ubicación
                const parts = [
                    addressDetails.distrito,
                    addressDetails.provincia,
                    addressDetails.departamento
                ].filter(Boolean);

                setLocationText(parts.length > 0 ? parts.join(', ') : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                setIsLoading(false);
            },
            (err) => {
                console.error('Geolocation error:', err);

                let errorMessage = 'No se pudo obtener tu ubicación';
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        errorMessage = 'Permiso de ubicación denegado';
                        break;
                    case err.POSITION_UNAVAILABLE:
                        errorMessage = 'Ubicación no disponible';
                        break;
                    case err.TIMEOUT:
                        errorMessage = 'Tiempo de espera agotado';
                        break;
                }

                setError(errorMessage);
                setLocationText('');
                setIsLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // Cache por 5 minutos
            }
        );
    }, []);

    // NO auto-request anymore
    // useEffect(() => {
    //   if (autoRequest) {
    //     requestLocation();
    //   }
    // }, [autoRequest, requestLocation]);

    return {
        location,
        locationText,
        error,
        isLoading,
        requestLocation
    };
}
