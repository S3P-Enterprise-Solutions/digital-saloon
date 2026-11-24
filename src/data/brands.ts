import type { Locale } from '../i18n'

export type BrandKey = 'kimm' | 'salon1500' | 'hairboutique'

export type BrandStylist = {
  name: string
  roleDe: string
  roleIt: string
  phone: string
  imageUrl?: string
  instagramUrl?: string
}

export type BrandGalleryItem = {
  src: string
  altDe: string
  altIt: string
}

export type BrandProfile = {
  key: BrandKey
  defaultSalonId: string
  name: string
  logoUrl?: string
  instagramUrl?: string
  instagramHandle?: string
  mapsUrl?: string
  facebookUrl?: string
  place: Record<Locale, string>
  heroIntro: Record<Locale, string>
  heroSlides: readonly string[]
  stylists: readonly BrandStylist[]
  gallery: readonly BrandGalleryItem[]
  colors: {
    primary: string
    primaryDeep: string
    accent: string
    accentDeep: string
    surface: string
    paper: string
    divider: string
  }
  typography: {
    fontFamily: string
    headingFontFamily: string
  }
}

export const BRANDS: Record<BrandKey, BrandProfile> = {
  kimm: {
    key: 'kimm',
    defaultSalonId: 'pilot',
    name: 'KIMM Hair',
    place: {
      de: 'Meran · Via Piave 71',
      it: 'Merano · Via Piave 71',
    },
    heroIntro: {
      de: 'Schnitt, Farbe und Pflege — ruhig, persönlich und ohne Hektik. Buche deinen Termin direkt online, ganz ohne Kundenkonto.',
      it: 'Taglio, colore e cura — con calma e attenzione personale. Prenota il tuo appuntamento online, senza account.',
    },
    stylists: [],
    heroSlides: [],
    gallery: [],
    colors: {
      primary: '#4A3631',
      primaryDeep: '#7A6862',
      accent: '#E2701F',
      accentDeep: '#B9540E',
      surface: '#F2EEEB',
      paper: '#FFFFFF',
      divider: 'rgba(74, 54, 49, 0.16)',
    },
    typography: {
      fontFamily: '"Archivo Variable", "Helvetica Neue", Arial, sans-serif',
      headingFontFamily: '"Archivo Variable", "Helvetica Neue", Arial, sans-serif',
    },
  },
  salon1500: {
    key: 'salon1500',
    defaultSalonId: 'salon1500',
    name: 'Salon 1500',
    logoUrl: 'https://salon1500.it/wp-content/uploads/2023/01/cropped-The-logo-schwarz-weiss.jpg',
    instagramUrl: 'https://www.instagram.com/salon_1500/',
    instagramHandle: '@salon_1500',
    place: {
      de: 'Mauls 12A · Freienfeld (BZ)',
      it: 'Mules 12A · Campo di Trens (BZ)',
    },
    heroIntro: {
      de: 'Es war einmal, im Jahre 1500, da gab es ein altes Zollhaus. Und daraus wurde… naja, seht’s euch selbst an!',
      it: 'C’era una volta, nel 1500, un’antica dogana. E ne è nato… beh, guardate voi stessi!',
    },
    heroSlides: [
      'https://salon1500.it/wp-content/uploads/2023/05/salon_1500_view-scaled.jpg',
      'https://salon1500.it/wp-content/uploads/2023/05/salon_1500_window-scaled-e1685106092584.jpg',
      'https://salon1500.it/wp-content/uploads/2023/05/salon_1500_dressing_stool-scaled.jpg',
      'https://salon1500.it/wp-content/uploads/2023/05/salon_1500_entrance-scaled.jpg',
      'https://salon1500.it/wp-content/uploads/2023/05/salon_1500_hairdresser-scaled.jpg',
    ],
    stylists: [
      {
        name: 'Elisabeth Prünster',
        roleDe: 'Friseurmeisterin, Make Up Artist',
        roleIt: 'Maestra parrucchiera, Make Up Artist',
        phone: '+39 349 5326663',
        imageUrl: 'https://salon1500.it/wp-content/uploads/2023/09/Elisabeth-Pruenster.jpg',
      },
      {
        name: 'Eleonora Pichler',
        roleDe: 'Friseurin, Coloristin, Visagistin',
        roleIt: 'Parrucchiera, Colorista, Visagista',
        phone: '+39 349 2863151',
        imageUrl: 'https://salon1500.it/wp-content/uploads/2023/09/Eleonora-Pichler-1.jpg',
        instagramUrl: 'https://www.instagram.com/elly_pichler_hair/',
      },
    ],
    gallery: [
      {
        src: 'https://salon1500.it/wp-content/uploads/2023/09/long-blonde-curly-balayage-scaled.jpeg',
        altDe: 'Langes blondes Balayage mit Locken',
        altIt: 'Balayage biondo lungo con onde',
      },
      {
        src: 'https://salon1500.it/wp-content/uploads/2023/09/woman-short-cut-brown-hair-scaled.jpeg',
        altDe: 'Moderner Kurzhaarschnitt in Braun',
        altIt: 'Taglio corto moderno castano',
      },
      {
        src: 'https://salon1500.it/wp-content/uploads/2023/09/blonde-standard-balayage-scaled.jpeg',
        altDe: 'Klassisches Blond-Balayage',
        altIt: 'Balayage biondo classico',
      },
      {
        src: 'https://salon1500.it/wp-content/uploads/2023/09/honey-blonde-hair-balayage.jpg',
        altDe: 'Honigblond Balayage',
        altIt: 'Balayage biondo miele',
      },
      {
        src: 'https://salon1500.it/wp-content/uploads/2023/09/white-blonde-hair-balayage-scaled.jpeg',
        altDe: 'Kühles Platin- & Weißblond',
        altIt: 'Biondo platino freddo',
      },
      {
        src: 'https://salon1500.it/wp-content/uploads/2023/09/brown-hair-with-blonde-balayage-scaled.jpeg',
        altDe: 'Braunes Haar mit blonden Balayage-Reflexen',
        altIt: 'Capelli castani con riflessi balayage biondi',
      },
      {
        src: 'https://salon1500.it/wp-content/uploads/2023/09/brown-hair-balayage-scaled.jpeg',
        altDe: 'Natürliches Braun-Balayage',
        altIt: 'Balayage castano naturale',
      },
      {
        src: 'https://salon1500.it/wp-content/uploads/2023/09/brown-hair-red-balayage-scaled.jpeg',
        altDe: 'Braun-Rot-Balayage',
        altIt: 'Balayage castano ramato',
      },
      {
        src: 'https://salon1500.it/wp-content/uploads/2023/09/orange-hair-balayage.jpg',
        altDe: 'Kupfer- & Orange-Balayage',
        altIt: 'Balayage rame e arancio',
      },
      {
        src: 'https://salon1500.it/wp-content/uploads/2023/09/Man-short-hair-blonde.jpg',
        altDe: 'Herrenhaarschnitt Kurz & Blond',
        altIt: 'Taglio uomo corto biondo',
      },
    ],
    colors: {
      primary: '#000000',
      primaryDeep: '#54595F',
      accent: '#DFBFA4',
      accentDeep: '#9A7656',
      surface: '#FAF6F2',
      paper: '#FFFFFF',
      divider: 'rgba(0, 0, 0, 0.14)',
    },
    typography: {
      fontFamily: '"Roboto Condensed", "Helvetica Neue", Arial, sans-serif',
      headingFontFamily: '"Cormorant SC", Georgia, serif',
    },
  },
  hairboutique: {
    key: 'hairboutique',
    defaultSalonId: 'hairboutique',
    name: 'Hairboutique OHG',
    logoUrl: '/hairboutique/logo.jpg',
    mapsUrl: 'https://share.google/c5eTEwBVNVrUw3FaK',
    place: {
      de: 'Sterzing · Frundsbergstraße 24/A',
      it: 'Vipiteno · Via Frundsberg 24/A',
    },
    heroIntro: {
      de: 'Haarschnitte, Colorationen und Styling im Herzen von Sterzing — persönlich, ruhig und mit Zeit für dich.',
      it: 'Tagli, colorazioni e styling nel cuore di Vipiteno — con attenzione, calma e cura personale.',
    },
    heroSlides: [
      '/hairboutique/wartebereich.jpg',
      '/hairboutique/waschbecken.jpg',
      '/hairboutique/hairstyle.jpeg',
    ],
    stylists: [
      {
        name: 'Doris Hofer',
        roleDe: 'Inhaberin & Stylistin',
        roleIt: 'Titolare & Stylist',
        phone: '+39 0472 055770',
      },
      {
        name: 'Nadja Gschliesser',
        roleDe: 'Inhaberin & Stylistin',
        roleIt: 'Titolare & Stylist',
        phone: '+39 0472 055770',
      },
    ],
    gallery: [
      {
        src: '/hairboutique/wartebereich.jpg',
        altDe: 'Wartebereich der Hairboutique OHG in Sterzing',
        altIt: 'Sala d’attesa di Hairboutique OHG a Vipiteno',
      },
      {
        src: '/hairboutique/waschbecken.jpg',
        altDe: 'Waschplätze und Pflegebereich im Studio',
        altIt: 'Area lavaggio e cura in salone',
      },
      {
        src: '/hairboutique/hairstyle.jpeg',
        altDe: 'Natürliche Wellen und Balayage-Styling',
        altIt: 'Onde naturali e styling balayage',
      },
      {
        src: '/hairboutique/team.jpeg',
        altDe: 'Das Team von Hairboutique OHG in Sterzing',
        altIt: 'Il team di Hairboutique OHG a Vipiteno',
      },
    ],
    colors: {
      primary: '#242C2B',
      primaryDeep: '#181E1D',
      accent: '#5A6664',
      accentDeep: '#242C2B',
      surface: '#E7ECEA',
      paper: '#F9FAFA',
      divider: 'rgba(36, 44, 43, 0.12)',
    },
    typography: {
      fontFamily: '"Plus Jakarta Sans", "Helvetica Neue", Arial, sans-serif',
      headingFontFamily: '"Plus Jakarta Sans", "Helvetica Neue", Arial, sans-serif',
    },
  },
}

export function getActiveBrandKey(): BrandKey {
  const raw =
    typeof import.meta.env.VITE_BRAND === 'string'
      ? import.meta.env.VITE_BRAND.trim().toLowerCase()
      : ''
  if (raw === 'salon1500') return 'salon1500'
  if (raw === 'hairboutique') return 'hairboutique'
  return 'kimm'
}

export function getActiveBrand(): BrandProfile {
  return BRANDS[getActiveBrandKey()]
}
