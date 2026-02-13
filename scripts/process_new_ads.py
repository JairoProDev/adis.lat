import csv
import random
import re
from datetime import datetime, timedelta

# Configuración
INPUT_FILE = 'scripts/raw_ads_input.csv'
OUTPUT_FILE = 'nuevos_anuncios_semanales_v2.csv'

# Fechas: últimos 14 días (del 6 al 20 de diciembre 2025)
END_DATE = datetime(2025, 12, 20)
START_DATE = END_DATE - timedelta(days=14)

def random_date(start, end):
    """Genera una fecha y hora aleatoria entre start y end"""
    delta = end - start
    int_delta = (delta.days * 24 * 60 * 60) + delta.seconds
    random_second = random.randrange(int_delta)
    return start + timedelta(seconds=random_second)

def clean_text(text):
    if not text: return ""
    return text.strip()

def split_title_desc(text):
    """Intenta separar título de descripción basado en puntos o longitud"""
    if not text:
        return "", ""
    
    # Si hay un punto en los primeros 100 caracteres, usarlo como separador
    parts = text.split('.', 1)
    if len(parts) > 1 and len(parts[0]) < 100:
        return clean_text(parts[0]), clean_text(parts[1]) if len(parts) > 1 else ""
    
    # Si no, usar todo como título si es corto, o cortar arbitrariamente
    if len(text) < 60:
        return text, ""
    
    return text, "" # Todo al título si no hay separador claro

def split_contact_location(text):
    """Separa contacto de ubicación usando /"""
    if not text:
        return "", ""
    
    if '/' in text:
        parts = text.split('/', 1)
        return clean_text(parts[0]), clean_text(parts[1])
    
    # Si no hay /, asumir que es contacto
    return clean_text(text), ""

def process_ads():
    ads = []
    
    print(f"Leyendo {INPUT_FILE}...")
    
    try:
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            header = next(reader) # Saltar header
            
            for row in reader:
                if len(row) < 3:
                    continue
                    
                categoria = row[0]
                titulo_desc_raw = row[1]
                contacto_ubic_raw = row[2]
                
                titulo, descripcion = split_title_desc(titulo_desc_raw)
                contacto, ubicacion = split_contact_location(contacto_ubic_raw)
                
                # Si la descripción está vacía, usar parte del título o dejar vacío
                if not descripcion:
                    descripcion = titulo # Fallback
                
                # Generar fecha aleatoria
                dt = random_date(START_DATE, END_DATE)
                fecha_publicacion = dt.strftime('%Y-%m-%d')
                hora_publicacion = dt.strftime('%H:%M')
                
                ads.append({
                    'categoria': categoria.lower(), # Normalizar a minúsculas
                    'titulo': titulo,
                    'descripcion': titulo_desc_raw, # Usar el texto completo como descripción para no perder info
                    'contacto': contacto,
                    'ubicacion': ubicacion or "Cusco", # Default a Cusco si no hay info
                    'precio': 0, # Placeholder
                    'moneda': 'PEN',
                    'fecha_publicacion': fecha_publicacion,
                    'hora_publicacion': hora_publicacion
                })
                
    except Exception as e:
        print(f"Error leyendo archivo: {e}")
        return

    # Escribir CSV final
    print(f"Escribiendo {len(ads)} anuncios a {OUTPUT_FILE}...")
    
    with open(OUTPUT_FILE, 'w', newline='', encoding='utf-8') as f:
        # Definir columnas finales
        fieldnames = ['categoria', 'titulo', 'descripcion', 'contacto', 'ubicacion', 'precio', 'moneda', 'fecha_publicacion', 'hora_publicacion']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        
        writer.writeheader()
        for ad in ads:
            writer.writerow(ad)
            
    print("¡Proceso completado con éxito!")

if __name__ == '__main__':
    process_ads()
