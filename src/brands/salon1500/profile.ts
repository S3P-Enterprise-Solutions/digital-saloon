import type { BrandProfile } from '../types'

export const salon1500Profile: BrandProfile = {
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
}
