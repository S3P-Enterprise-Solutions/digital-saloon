import type { BrandProfile } from '../types'

export const kimmProfile: BrandProfile = {
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
}
