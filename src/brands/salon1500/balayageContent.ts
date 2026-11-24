import type { BalayageContent } from '../../features/balayage/content'

export const salon1500BalayageContent: BalayageContent = {
  appearance: {
    scriptFont: '"Luxurious Script", "Cormorant SC", Georgia, serif',
    bodyFont: '"Roboto Condensed", "Helvetica Neue", Arial, sans-serif',
    accent: '#DFBFA4',
    surface: '#FAF6F2',
    ink: '#000000',
    muted: '#54595F',
  },
  heroImageUrls: [
    'https://salon1500.it/wp-content/uploads/2024/01/Balayage-3-Models-scaled.jpg',
    'https://salon1500.it/wp-content/uploads/2024/01/Balayage-Balkon-scaled.jpg',
    'https://salon1500.it/wp-content/uploads/2024/01/Balayage-Studio-Haare-fliegen-scaled.jpg',
    'https://salon1500.it/wp-content/uploads/2024/01/Balayage-Zaun-scaled.jpg',
  ],
  packages: [
    {
      id: 'balayage-xs',
      size: 'XS',
      title: 'Paket XS',
      subtitleDe: 'Dezente Lichtreflexe & Face-Framing',
      subtitleIt: 'Riflessi delicati e face-framing',
      duration: '180 min',
      price: '140€',
      includesDe: [
        'Typgerechte Beratung',
        'Partielles Balayage / Face-Framing',
        'Glossing & Finish',
      ],
      includesIt: [
        'Consulenza personalizzata',
        'Balayage parziale / face-framing',
        'Glossing e finish',
      ],
    },
    {
      id: 'balayage-s',
      size: 'S',
      title: 'Paket S',
      subtitleDe: 'Natürliches Balayage für feines bis mittleres Haar',
      subtitleIt: 'Balayage naturale per capelli fini o medi',
      duration: '180 min',
      price: '150€',
      includesDe: ['Typgerechte Beratung', 'Klassisches Balayage', 'Glossing, Pflege & Föhnen'],
      includesIt: ['Consulenza personalizzata', 'Balayage classico', 'Glossing, cura e piega'],
    },
    {
      id: 'balayage-m',
      size: 'M',
      title: 'Paket M',
      subtitleDe: 'Mehrdimensionale Farbverläufe & Intensivpflege',
      subtitleIt: 'Sfumature multidimensionali e cura intensiva',
      duration: '210 min',
      price: '170€-180€',
      includesDe: [
        'Ausführliche Farbberatung',
        'Full Balayage & Root Shadow',
        'Glossing, Intensivpflege & Styling',
      ],
      includesIt: [
        'Consulenza colore dedicata',
        'Full Balayage e root shadow',
        'Glossing, trattamento e styling',
      ],
    },
    {
      id: 'balayage-l',
      size: 'L',
      title: 'Paket L',
      subtitleDe: 'Komplett-Transformation für langes oder kräftiges Haar',
      subtitleIt: 'Trasformazione completa per capelli lunghi o folti',
      duration: '240 – 300 min',
      price: '200€-250€',
      includesDe: [
        'Umfassende Farb- & Schnittberatung',
        'Full Balayage (High-Density)',
        'Glossing, Bond-Care & Styling',
      ],
      includesIt: [
        'Consulenza colore e taglio',
        'Full Balayage alta densità',
        'Glossing, bond-care e styling',
      ],
    },
  ],
}
