export type FamilyId =
  | 'caribe'
  | 'mexico'
  | 'andes'
  | 'cono_sur'
  | 'brasil'
  | 'latam'
  | 'iberica'
  | 'rock_metal'
  | 'pop'
  | 'hip_hop_rnb'
  | 'soul_funk'
  | 'jazz'
  | 'electronica'
  | 'clasica'
  | 'folk_country'
  | 'mundial'
  | 'cristiana'
  | 'otros';

export interface GenreFamily {
  id: FamilyId;
  label: string;
  defaultOpen: boolean;
}

export const GENRE_FAMILIES: readonly GenreFamily[] = [
  { id: 'caribe', label: 'Caribe', defaultOpen: true },
  { id: 'mexico', label: 'México', defaultOpen: true },
  { id: 'andes', label: 'Andes', defaultOpen: false },
  { id: 'cono_sur', label: 'Cono Sur', defaultOpen: false },
  { id: 'brasil', label: 'Brasil', defaultOpen: true },
  { id: 'latam', label: 'Latinoamericana', defaultOpen: false },
  { id: 'iberica', label: 'Ibérica', defaultOpen: false },
  { id: 'rock_metal', label: 'Rock & Metal', defaultOpen: false },
  { id: 'pop', label: 'Pop & alternativo', defaultOpen: false },
  { id: 'hip_hop_rnb', label: 'Hip hop & R&B', defaultOpen: false },
  { id: 'soul_funk', label: 'Soul, Funk & Disco', defaultOpen: false },
  { id: 'jazz', label: 'Jazz', defaultOpen: false },
  { id: 'electronica', label: 'Electrónica', defaultOpen: false },
  { id: 'clasica', label: 'Clásica', defaultOpen: false },
  { id: 'folk_country', label: 'Folk & Country', defaultOpen: false },
  { id: 'mundial', label: 'Mundial', defaultOpen: false },
  { id: 'cristiana', label: 'Cristiana', defaultOpen: false },
  { id: 'otros', label: 'Bandas sonoras y otros', defaultOpen: false },
] as const;

const FAMILY_BY_SLUG: Record<string, FamilyId> = {
  // Caribe
  salsa: 'caribe',
  son_cubano: 'caribe',
  bolero: 'caribe',
  mambo: 'caribe',
  chachacha: 'caribe',
  danzon: 'caribe',
  guaguanco: 'caribe',
  pachanga: 'caribe',
  timba: 'caribe',
  trova: 'caribe',
  nueva_trova: 'caribe',
  merengue: 'caribe',
  bachata: 'caribe',
  reggaeton: 'caribe',
  dembow: 'caribe',
  plena: 'caribe',
  bomba_puertorriquena: 'caribe',
  zouk: 'caribe',
  kompa: 'caribe',
  calypso: 'caribe',
  soca: 'caribe',
  dancehall: 'caribe',
  rocksteady: 'caribe',
  ska: 'caribe',
  reggae: 'caribe',
  reggae_en_espanol: 'caribe',
  dub: 'caribe',

  // México
  mariachi: 'mexico',
  ranchera: 'mexico',
  corrido: 'mexico',
  banda: 'mexico',
  norteno: 'mexico',
  huapango: 'mexico',
  son_jarocho: 'mexico',
  tejano: 'mexico',
  cumbia_sonidera: 'mexico',

  // Andes
  cumbia: 'andes',
  vallenato: 'andes',
  joropo: 'andes',
  llanera: 'andes',
  bambuco: 'andes',
  pasillo: 'andes',
  currulao: 'andes',
  mapale: 'andes',
  porro: 'andes',
  marinera: 'andes',
  huayno: 'andes',
  saya: 'andes',
  caporal: 'andes',
  festejo: 'andes',
  lando: 'andes',
  vals_criollo: 'andes',
  musica_afroperuana: 'andes',
  musica_andina: 'andes',
  musica_amazonica: 'andes',

  // Cono Sur
  tango: 'cono_sur',
  cueca: 'cono_sur',
  zamba: 'cono_sur',
  chacarera: 'cono_sur',
  carnavalito: 'cono_sur',
  candombe: 'cono_sur',
  milonga: 'cono_sur',
  cuarteto: 'cono_sur',
  cumbia_villera: 'cono_sur',
  polka_paraguaya: 'cono_sur',
  guarania: 'cono_sur',

  // Brasil
  bossa_nova: 'brasil',
  samba: 'brasil',
  pagode: 'brasil',
  forro: 'brasil',
  choro: 'brasil',
  frevo: 'brasil',
  axe: 'brasil',
  funk_carioca: 'brasil',
  sertanejo: 'brasil',
  mpb: 'brasil',
  tropicalia: 'brasil',
  maracatu: 'brasil',
  baiao: 'brasil',
  lambada: 'brasil',
  brega: 'brasil',

  // Latinoamericana general
  balada: 'latam',
  folclorica: 'latam',
  nueva_cancion: 'latam',
  musica_del_campo: 'latam',
  hip_hop_latino: 'latam',
  latin_trap: 'latam',
  latin_jazz: 'latam',
  musica_cristiana_es: 'latam',

  // Ibérica
  flamenco: 'iberica',
  fado: 'iberica',
  rumba_flamenca: 'iberica',
  copla: 'iberica',
  jota: 'iberica',

  // Rock & Metal
  rock_antiguo: 'rock_metal',
  rock: 'rock_metal',
  rock_alternativo: 'rock_metal',
  indie_rock: 'rock_metal',
  punk_rock: 'rock_metal',
  post_punk: 'rock_metal',
  hardcore_punk: 'rock_metal',
  hard_rock: 'rock_metal',
  heavy_metal: 'rock_metal',
  thrash_metal: 'rock_metal',
  death_metal: 'rock_metal',
  black_metal: 'rock_metal',
  doom_metal: 'rock_metal',
  progressive_rock: 'rock_metal',
  psychedelic_rock: 'rock_metal',
  grunge: 'rock_metal',
  garage_rock: 'rock_metal',
  shoegaze: 'rock_metal',
  emo: 'rock_metal',

  // Pop & alternativo
  pop: 'pop',
  pop_rock: 'pop',
  power_pop: 'pop',
  new_wave: 'pop',
  synth_pop: 'pop',

  // Hip hop & R&B
  hip_hop: 'hip_hop_rnb',
  trap: 'hip_hop_rnb',
  drill: 'hip_hop_rnb',
  rnb: 'hip_hop_rnb',

  // Soul, Funk & Disco
  soul: 'soul_funk',
  funk: 'soul_funk',
  disco: 'soul_funk',
  neo_soul: 'soul_funk',
  gospel: 'soul_funk',

  // Jazz
  jazz: 'jazz',
  bebop: 'jazz',
  swing: 'jazz',
  big_band: 'jazz',
  cool_jazz: 'jazz',
  free_jazz: 'jazz',
  hard_bop: 'jazz',
  fusion: 'jazz',
  smooth_jazz: 'jazz',
  acid_jazz: 'jazz',

  // Electrónica
  electronica: 'electronica',
  edm: 'electronica',
  house: 'electronica',
  deep_house: 'electronica',
  tech_house: 'electronica',
  techno: 'electronica',
  trance: 'electronica',
  drum_and_bass: 'electronica',
  dubstep: 'electronica',
  ambient: 'electronica',
  idm: 'electronica',
  trip_hop: 'electronica',
  industrial: 'electronica',
  synthwave: 'electronica',
  vaporwave: 'electronica',
  future_bass: 'electronica',

  // Clásica
  musica_clasica: 'clasica',
  barroco: 'clasica',
  romantica: 'clasica',
  modernismo_clasico: 'clasica',
  opera: 'clasica',
  coral: 'clasica',
  musica_sacra: 'clasica',
  canto_gregoriano: 'clasica',
  musica_de_camara: 'clasica',
  musica_sinfonica: 'clasica',
  ballet: 'clasica',

  // Folk & Country
  folk: 'folk_country',
  country: 'folk_country',
  bluegrass: 'folk_country',
  musica_celta: 'folk_country',
  klezmer: 'folk_country',
  musica_balcanica: 'folk_country',

  // Mundial
  musica_arabe: 'mundial',
  musica_hindu: 'mundial',
  musica_africana: 'mundial',
  afrobeat: 'mundial',
  highlife: 'mundial',
  musica_asiatica: 'mundial',
  musica_oriental: 'mundial',
  musica_china: 'mundial',
  musica_japonesa: 'mundial',
  k_pop: 'mundial',
  j_pop: 'mundial',
  mandopop: 'mundial',
  anime: 'mundial',
  world_music: 'mundial',

  // Cristiana
  musica_cristiana: 'cristiana',
  adoracion: 'cristiana',

  // Otros
  musica_infantil: 'otros',
  musica_de_cine: 'otros',
  musica_de_videojuegos: 'otros',
  spoken_word: 'otros',
  lounge: 'otros',
  easy_listening: 'otros',
};

const warned = new Set<string>();

export function genreFamilyOf(slug: string): FamilyId {
  const family = FAMILY_BY_SLUG[slug];
  if (family) return family;
  if (process.env.NODE_ENV !== 'production' && !warned.has(slug)) {
    warned.add(slug);
    console.warn(`[genre-families] no family mapping for slug "${slug}" — falling back to "otros"`);
  }
  return 'otros';
}

export function normalizeForSearch(s: string): string {
  return s
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}
