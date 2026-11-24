import type { BrandProfile } from '../types'

export const hairboutiqueProfile: BrandProfile = {
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
}
