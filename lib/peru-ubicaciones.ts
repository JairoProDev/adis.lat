// Datos de ubicación de Perú: Departamentos, Provincias y Distritos principales
// Basado en datos oficiales del INEI

export interface Departamento {
  nombre: string;
  provincias: Provincia[];
}

export interface Provincia {
  nombre: string;
  distritos: string[];
}

// Datos principales de Perú (principales ciudades y distritos)
export const PERU_UBICACIONES: Departamento[] = [
  {
    nombre: 'Lima',
    provincias: [
      {
        nombre: 'Lima',
        distritos: [
          'Cercado de Lima', 'Ate', 'Barranco', 'Breña', 'Callao', 'Carabayllo', 'Chaclacayo',
          'Chorrillos', 'Cieneguilla', 'Comas', 'El Agustino', 'Independencia', 'Jesús María',
          'La Molina', 'La Victoria', 'Lince', 'Los Olivos', 'Lurigancho', 'Lurín', 'Magdalena del Mar',
          'Miraflores', 'Pachacámac', 'Pucusana', 'Pueblo Libre', 'Puente Piedra', 'Punta Hermosa',
          'Punta Negra', 'Rímac', 'San Bartolo', 'San Borja', 'San Isidro', 'San Juan de Lurigancho',
          'San Juan de Miraflores', 'San Luis', 'San Martín de Porres', 'San Miguel', 'Santa Anita',
          'Santa María del Mar', 'Santa Rosa', 'Santiago de Surco', 'Surquillo', 'Villa El Salvador',
          'Villa María del Triunfo'
        ]
      },
      {
        nombre: 'Callao',
        distritos: [
          'Bellavista', 'Callao', 'Carmen de la Legua Reynoso', 'La Perla', 'La Punta', 'Ventanilla'
        ]
      }
    ]
  },
  {
    nombre: 'Cusco',
    provincias: [
      {
        nombre: 'Cusco',
        distritos: [
          'Cusco', 'Ccorca', 'Poroy', 'San Jerónimo', 'San Sebastian', 'Santiago', 'Saylla', 'Wanchaq'
        ]
      },
      {
        nombre: 'Urubamba',
        distritos: [
          'Chinchero', 'Huayllabamba', 'Machupicchu', 'Maras', 'Ollantaytambo', 'Urubamba', 'Yucay'
        ]
      }
    ]
  },
  {
    nombre: 'Arequipa',
    provincias: [
      {
        nombre: 'Arequipa',
        distritos: [
          'Arequipa', 'Alto Selva Alegre', 'Cayma', 'Cerro Colorado', 'Characato', 'Chiguata',
          'Jacobo Hunter', 'La Joya', 'Mariano Melgar', 'Miraflores', 'Mollebaya', 'Paucarpata',
          'Pocsi', 'Polobaya', 'Quequeña', 'Sabandía', 'Sachaca', 'San Juan de Siguas',
          'San Juan de Tarucani', 'Santa Isabel de Siguas', 'Santa Rita de Siguas', 'Socabaya',
          'Tiabaya', 'Uchumayo', 'Vitor', 'Yanahuara', 'Yarabamba', 'Yura'
        ]
      }
    ]
  },
  {
    nombre: 'La Libertad',
    provincias: [
      {
        nombre: 'Trujillo',
        distritos: [
          'Trujillo', 'El Porvenir', 'Florencia de Mora', 'Huanchaco', 'La Esperanza', 'Laredo',
          'Moche', 'Poroto', 'Salaverry', 'Simbal', 'Victor Larco Herrera'
        ]
      }
    ]
  },
  {
    nombre: 'Piura',
    provincias: [
      {
        nombre: 'Piura',
        distritos: [
          'Piura', 'Castilla', 'Catacaos', 'Cura Mori', 'El Tallan', 'La Arena', 'La Unión',
          'Las Lomas', 'Tambo Grande', 'Veintiséis de Octubre'
        ]
      }
    ]
  },
  {
    nombre: 'Lambayeque',
    provincias: [
      {
        nombre: 'Chiclayo',
        distritos: [
          'Chiclayo', 'Chongoyape', 'Eten', 'Eten Puerto', 'José Leonardo Ortiz', 'La Victoria',
          'Lagunas', 'Monsefú', 'Nueva Arica', 'Oyotún', 'Picsi', 'Pimentel', 'Reque',
          'Santa Rosa', 'Saña', 'Cayalti', 'Patapo', 'Pomalca', 'Pucalá', 'Tuman'
        ]
      }
    ]
  },
  {
    nombre: 'Ancash',
    provincias: [
      {
        nombre: 'Huaraz',
        distritos: [
          'Huaraz', 'Cochabamba', 'Colcabamba', 'Huanchay', 'Independencia', 'Jangas',
          'La Libertad', 'Olleros', 'Pampas Grande', 'Pariacoto', 'Pira', 'Tarica'
        ]
      }
    ]
  },
  {
    nombre: 'Ica',
    provincias: [
      {
        nombre: 'Ica',
        distritos: [
          'Ica', 'La Tinguiña', 'Los Aquijes', 'Ocucaje', 'Pachacutec', 'Parcona',
          'Pueblo Nuevo', 'Salas', 'San José de Los Molinos', 'San Juan Bautista',
          'Santiago', 'Subtanjalla', 'Tate', 'Yauca del Rosario'
        ]
      }
    ]
  },
  {
    nombre: 'Junín',
    provincias: [
      {
        nombre: 'Huancayo',
        distritos: [
          'Huancayo', 'Carhuacallanga', 'Chacapampa', 'Chicche', 'Chilca', 'Chongos Alto',
          'Chupuro', 'Colca', 'Cullhuas', 'El Tambo', 'Huacrapuquio', 'Hualhuas',
          'Huancan', 'Huasicancha', 'Huayucachi', 'Ingenio', 'Pariahuanca', 'Pilcomayo',
          'Pucara', 'Quichuay', 'Quilcas', 'San Agustín', 'San Jerónimo de Tunan',
          'Santo Domingo de Acobamba', 'Sapallanga', 'Saño', 'Sicaya', 'Viques'
        ]
      }
    ]
  },
  {
    nombre: 'Cajamarca',
    provincias: [
      {
        nombre: 'Cajamarca',
        distritos: [
          'Cajamarca', 'Asunción', 'Cospan', 'Cumbemayo', 'Chontali', 'Encañada',
          'Jesús', 'Llacanora', 'Los Baños del Inca', 'Magdalena', 'Matara',
          'Namora', 'San Juan', 'San Pablo', 'San Marcos', 'San Miguel', 'San Sebastián'
        ]
      }
    ]
  },
  {
    nombre: 'Puno',
    provincias: [
      {
        nombre: 'Puno',
        distritos: [
          'Puno', 'Acora', 'Amantani', 'Atuncolla', 'Capachica', 'Chucuito', 'Coata',
          'Huata', 'Mañazo', 'Paucarcolla', 'Pichacani', 'Platería', 'San Antonio',
          'Tiquillaca', 'Vilque', 'Ácora'
        ]
      }
    ]
  },
  {
    nombre: 'Tacna',
    provincias: [
      {
        nombre: 'Tacna',
        distritos: [
          'Tacna', 'Alto de la Alianza', 'Calana', 'Ciudad Nueva', 'Coronel Gregorio Albarracín Lanchipa',
          'Inclan', 'La Yarada Los Palos', 'Pachía', 'Palca', 'Pocollay', 'Sama',
          'Coronel Andrés Avelino Cáceres', 'Chucatamani'
        ]
      }
    ]
  },
  {
    nombre: 'Ayacucho',
    provincias: [
      {
        nombre: 'Huamanga',
        distritos: [
          'Ayacucho', 'Acos Vinchos', 'Carmen Alto', 'Chiara', 'Ocros', 'Pacaycasa',
          'Quinua', 'San Juan Bautista', 'San Miguel', 'Santiago de Pischa', 'Socos',
          'Tambillo', 'Vinchos', 'Jesús Nazareno', 'Andrés Avelino Cáceres Dorregaray'
        ]
      }
    ]
  },
  {
    nombre: 'Amazonas',
    provincias: [
      {
        nombre: 'Chachapoyas',
        distritos: [
          'Chachapoyas', 'Asunción', 'Balsas', 'Cheto', 'Chiliquin', 'Chuquibamba',
          'Granada', 'Huancas', 'La Jalca', 'Leimebamba', 'Levanto', 'Magdalena',
          'Mariscal Castilla', 'Molinopampa', 'Montevideo', 'Olleros', 'Quinjalca',
          'San Francisco de Daguas', 'San Isidro de Maino', 'Soloco', 'Sonche'
        ]
      }
    ]
  },
  {
    nombre: 'San Martín',
    provincias: [
      {
        nombre: 'Moyobamba',
        distritos: [
          'Moyobamba', 'Calzada', 'Habana', 'Jepelacio', 'Soritor', 'Yantalo'
        ]
      }
    ]
  },
  {
    nombre: 'Ucayali',
    provincias: [
      {
        nombre: 'Coronel Portillo',
        distritos: [
          'Callería', 'Campoverde', 'Iparía', 'Masisea', 'Yarinacocha', 'Nueva Requena'
        ]
      }
    ]
  },
  {
    nombre: 'Loreto',
    provincias: [
      {
        nombre: 'Maynas',
        distritos: [
          'Iquitos', 'Alto Nanay', 'Fernando Lores', 'Indiana', 'Las Amazonas',
          'Mazán', 'Napo', 'Punchana', 'Torres Causana', 'Belen', 'San Juan Bautista'
        ]
      }
    ]
  }
];

// Función helper para obtener departamentos
export function getDepartamentos(): string[] {
  return PERU_UBICACIONES.map(d => d.nombre);
}

// Función helper para obtener provincias de un departamento
export function getProvincias(departamento: string): string[] {
  const dept = PERU_UBICACIONES.find(d => d.nombre === departamento);
  return dept ? dept.provincias.map(p => p.nombre) : [];
}

// Función helper para obtener distritos de un departamento y provincia
export function getDistritos(departamento: string, provincia: string): string[] {
  const dept = PERU_UBICACIONES.find(d => d.nombre === departamento);
  if (!dept) return [];
  
  const prov = dept.provincias.find(p => p.nombre === provincia);
  return prov ? prov.distritos : [];
}

// Función helper para buscar coordenadas aproximadas (puedes expandir esto con datos reales)
export function getCoordenadasAproximadas(departamento: string, provincia: string, distrito: string): { lat: number; lng: number } | null {
  // Coordenadas aproximadas de ciudades principales
  const coordenadas: Record<string, { lat: number; lng: number }> = {
    'Lima-Lima-Cercado de Lima': { lat: -12.0464, lng: -77.0428 },
    'Lima-Callao-Callao': { lat: -12.0566, lng: -77.1181 },
    'Cusco-Cusco-Cusco': { lat: -13.5319, lng: -71.9675 },
    'Arequipa-Arequipa-Arequipa': { lat: -16.4090, lng: -71.5375 },
    'La Libertad-Trujillo-Trujillo': { lat: -8.1116, lng: -79.0288 },
    'Piura-Piura-Piura': { lat: -5.1945, lng: -80.6328 },
    'Lambayeque-Chiclayo-Chiclayo': { lat: -6.7766, lng: -79.8443 },
    'Ancash-Huaraz-Huaraz': { lat: -9.5300, lng: -77.5300 },
    'Ica-Ica-Ica': { lat: -14.0680, lng: -75.7280 },
    'Junín-Huancayo-Huancayo': { lat: -12.0670, lng: -75.2040 },
    'Cajamarca-Cajamarca-Cajamarca': { lat: -7.1617, lng: -78.5128 },
    'Puno-Puno-Puno': { lat: -15.8402, lng: -70.0219 },
    'Tacna-Tacna-Tacna': { lat: -18.0066, lng: -70.2463 },
    'Ayacucho-Huamanga-Ayacucho': { lat: -13.1588, lng: -74.2236 },
  };

  const key = `${departamento}-${provincia}-${distrito}`;
  return coordenadas[key] || null;
}









