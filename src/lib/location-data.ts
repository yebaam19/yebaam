/**
 * Data de ubicaciones para el formulario de registro
 * En producción, esto debería venir de una API como:
 * - REST Countries API: https://restcountries.com/
 * - GeoNames: https://www.geonames.org/
 * - Google Places API
 */

export interface Country {
  code: string;
  name: string;
  states: State[];
}

export interface State {
  code: string;
  name: string;
  cities: string[];
}

// Data estática para empezar (luego se puede migrar a API)
export const COUNTRIES: Country[] = [
  {
    code: 'CO',
    name: 'Colombia',
    states: [
      {
        code: 'ANT',
        name: 'Antioquia',
        cities: ['Medellín', 'Envigado', 'Bello', 'Itagüí', 'Rionegro', 'Sabaneta']
      },
      {
        code: 'CUN',
        name: 'Cundinamarca',
        cities: ['Bogotá', 'Soacha', 'Chía', 'Zipaquirá', 'Facatativá', 'Fusagasugá']
      },
      {
        code: 'VAC',
        name: 'Valle del Cauca',
        cities: ['Cali', 'Palmira', 'Buenaventura', 'Tuluá', 'Cartago', 'Buga']
      },
      {
        code: 'ATL',
        name: 'Atlántico',
        cities: ['Barranquilla', 'Soledad', 'Malambo', 'Puerto Colombia', 'Sabanalarga']
      },
      {
        code: 'SAN',
        name: 'Santander',
        cities: ['Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta', 'Barrancabermeja']
      },
      {
        code: 'BOL',
        name: 'Bolívar',
        cities: ['Cartagena', 'Magangué', 'Turbaco', 'Arjona', 'El Carmen de Bolívar']
      }
    ]
  },
  {
    code: 'MX',
    name: 'México',
    states: [
      {
        code: 'CMX',
        name: 'Ciudad de México',
        cities: ['Ciudad de México']
      },
      {
        code: 'JAL',
        name: 'Jalisco',
        cities: ['Guadalajara', 'Zapopan', 'Tlaquepaque', 'Tonalá', 'Puerto Vallarta']
      },
      {
        code: 'NLE',
        name: 'Nuevo León',
        cities: ['Monterrey', 'San Pedro Garza García', 'Guadalupe', 'San Nicolás']
      }
    ]
  },
  {
    code: 'AR',
    name: 'Argentina',
    states: [
      {
        code: 'BA',
        name: 'Buenos Aires',
        cities: ['Buenos Aires', 'La Plata', 'Mar del Plata', 'Bahía Blanca']
      },
      {
        code: 'CBA',
        name: 'Córdoba',
        cities: ['Córdoba', 'Villa María', 'Río Cuarto', 'San Francisco']
      }
    ]
  },
  {
    code: 'CL',
    name: 'Chile',
    states: [
      {
        code: 'RM',
        name: 'Región Metropolitana',
        cities: ['Santiago', 'Puente Alto', 'Maipú', 'La Florida', 'Las Condes']
      },
      {
        code: 'VAL',
        name: 'Valparaíso',
        cities: ['Valparaíso', 'Viña del Mar', 'Quilpué', 'Villa Alemana']
      }
    ]
  },
  {
    code: 'PE',
    name: 'Perú',
    states: [
      {
        code: 'LIM',
        name: 'Lima',
        cities: ['Lima', 'Callao', 'San Juan de Lurigancho', 'San Martín de Porres']
      },
      {
        code: 'ARE',
        name: 'Arequipa',
        cities: ['Arequipa', 'Cayma', 'Cerro Colorado', 'Yanahuara']
      }
    ]
  },
  {
    code: 'VE',
    name: 'Venezuela',
    states: [
      {
        code: 'DC',
        name: 'Distrito Capital',
        cities: ['Caracas']
      },
      {
        code: 'ZUL',
        name: 'Zulia',
        cities: ['Maracaibo', 'Cabimas', 'Ciudad Ojeda', 'San Francisco']
      }
    ]
  },
  {
    code: 'EC',
    name: 'Ecuador',
    states: [
      {
        code: 'PIC',
        name: 'Pichincha',
        cities: ['Quito', 'Cayambe', 'Sangolquí', 'Machachi']
      },
      {
        code: 'GUA',
        name: 'Guayas',
        cities: ['Guayaquil', 'Durán', 'Milagro', 'Daule']
      }
    ]
  },
  {
    code: 'ES',
    name: 'España',
    states: [
      {
        code: 'MAD',
        name: 'Madrid',
        cities: ['Madrid', 'Móstoles', 'Alcalá de Henares', 'Fuenlabrada']
      },
      {
        code: 'CAT',
        name: 'Cataluña',
        cities: ['Barcelona', 'Hospitalet de Llobregat', 'Badalona', 'Terrassa']
      }
    ]
  },
  {
    code: 'US',
    name: 'Estados Unidos',
    states: [
      {
        code: 'CA',
        name: 'California',
        cities: ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose', 'Sacramento']
      },
      {
        code: 'NY',
        name: 'New York',
        cities: ['New York City', 'Buffalo', 'Rochester', 'Albany', 'Syracuse']
      },
      {
        code: 'TX',
        name: 'Texas',
        cities: ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth']
      }
    ]
  }
];

// Helper functions
export function getCountries(): Country[] {
  return COUNTRIES;
}

export function getStatesByCountry(countryCode: string): State[] {
  const country = COUNTRIES.find(c => c.code === countryCode);
  return country?.states || [];
}

export function getCitiesByState(countryCode: string, stateCode: string): string[] {
  const country = COUNTRIES.find(c => c.code === countryCode);
  const state = country?.states.find(s => s.code === stateCode);
  return state?.cities || [];
}

export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find(c => c.code === code);
}

export function getStateByCode(countryCode: string, stateCode: string): State | undefined {
  const country = getCountryByCode(countryCode);
  return country?.states.find(s => s.code === stateCode);
}
