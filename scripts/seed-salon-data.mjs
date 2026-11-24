/**
 * Seeds the single pilot salon tree used by SalonFlow emulator demos.
 * Configured via SEED_* env vars (see .env.example).
 */

import { DEMO_RESERVATION_FLAG, buildDemoReservations } from './seed-demo-week.mjs'

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

function envOr(name, fallback) {
  const value = process.env[name]
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback
}

export function salonSeedConfig() {
  const brand = envOr('SEED_BRAND', envOr('VITE_BRAND', 'kimm')).toLowerCase()
  const isSalon1500 = brand === 'salon1500'

  return {
    brand: isSalon1500 ? 'salon1500' : 'kimm',
    salonId: envOr('SEED_SALON_ID', envOr('VITE_SALON_ID', isSalon1500 ? 'salon1500' : 'pilot')),
    name: envOr('SEED_SALON_NAME', isSalon1500 ? 'Salon 1500' : 'KIMM Hair'),
    timezone: envOr('SEED_SALON_TIMEZONE', 'Europe/Vienna'),
    address: envOr(
      'SEED_SALON_ADDRESS',
      isSalon1500 ? 'Mauls 12A, 39040 Freienfeld (BZ)' : 'Via Piave 71, 39012 Meran',
    ),
    phone: envOr('SEED_SALON_PHONE', isSalon1500 ? '+39 349 5326663' : '+39 0473 449267'),
    email: envOr(
      'SEED_SALON_EMAIL',
      isSalon1500 ? 'salon1500.pruensterelisabeth@gmail.com' : 'hello@kimm-hair.local',
    ),
    vatId: envOr('SEED_SALON_VAT_ID', isSalon1500 ? '' : '01732550213'),
    adminEmail: envOr('SEED_ADMIN_EMAIL', 'admin@salonflow.local'),
    adminPassword: envOr('SEED_ADMIN_PASSWORD', 'password123'),
  }
}

/**
 * Replaces previously seeded demo reservations with a fresh set around today.
 * Skips demo slots that would overlap real (non-demo) bookings.
 */
async function seedDemoWeek(salonRef, services, timeZone) {
  const reservations = salonRef.collection('reservations')
  const existing = await reservations.get()
  const realBusy = []
  const batch = salonRef.firestore.batch()

  for (const doc of existing.docs) {
    const data = doc.data()
    if (data[DEMO_RESERVATION_FLAG] === true) {
      batch.delete(doc.ref)
    } else if (data.status === 'PENDING' || data.status === 'CONFIRMED') {
      realBusy.push({ startAt: String(data.startAt), endAt: String(data.endAt) })
    }
  }

  const demo = buildDemoReservations({ now: new Date(), timeZone, services }).filter(
    ({ data }) => !realBusy.some((busy) => data.startAt < busy.endAt && busy.startAt < data.endAt),
  )
  for (const { id, data } of demo) {
    batch.set(reservations.doc(id), data)
  }
  await batch.commit()
  console.log(`[seed] Demo reservations: ${demo.length} around the current week`)
}

/** @param {import('firebase-admin/firestore').Firestore} firestore */
export async function seedSalonData(firestore, config = salonSeedConfig()) {
  const now = new Date().toISOString()
  const salonRef = firestore.collection('salons').doc(config.salonId)

  await salonRef.set(
    {
      name: config.name,
      address: config.address,
      phone: config.phone,
      email: config.email,
      timezone: config.timezone,
      ...(config.vatId ? { vatId: config.vatId } : {}),
    },
    { merge: true },
  )

  await salonRef.collection('settings').doc('booking').set(
    {
      confirmationMode: 'AUTOMATIC',
      slotIntervalMinutes: 15,
      minAdvanceBookingMinutes: 60,
      maxAdvanceBookingDays: 60,
      pendingExpirationHours: 24,
    },
    { merge: true },
  )

  // Placeholder prices: confirm with the salon before going live.
  const services = [
    {
      id: 'blow-dry',
      nameDe: 'Waschen, föhnen',
      nameIt: 'Lavaggio e piega',
      descriptionDe: '',
      descriptionIt: '',
      categoryDe: 'Schnitt & Styling',
      categoryIt: 'Taglio e piega',
      durationMinutes: 30,
      priceCents: 2000,
      priceMaxCents: 3000,
    },
    {
      id: 'haircut-wash',
      nameDe: 'Damenhaarschnitt',
      nameIt: 'Taglio donna',
      descriptionDe: '',
      descriptionIt: '',
      categoryDe: 'Schnitt & Styling',
      categoryIt: 'Taglio e piega',
      durationMinutes: 45,
      priceCents: 3000,
    },
    {
      id: 'damenhaarschnitt-kurz',
      nameDe: 'Damenhaarschnitt kurz',
      nameIt: 'Taglio donna corto',
      descriptionDe: '',
      descriptionIt: '',
      categoryDe: 'Schnitt & Styling',
      categoryIt: 'Taglio e piega',
      durationMinutes: 45,
      priceCents: 4000,
    },
    {
      id: 'haircut',
      nameDe: 'Herrenhaarschnitt',
      nameIt: 'Taglio uomo',
      descriptionDe: '',
      descriptionIt: '',
      categoryDe: 'Schnitt & Styling',
      categoryIt: 'Taglio e piega',
      durationMinutes: 30,
      priceCents: 2200,
    },
    {
      id: 'kinderhaarschnitt',
      nameDe: 'Kinderhaarschnitt',
      nameIt: 'Taglio bambino',
      descriptionDe: '',
      descriptionIt: '',
      categoryDe: 'Schnitt & Styling',
      categoryIt: 'Taglio e piega',
      durationMinutes: 30,
      priceCents: 1500,
      priceMaxCents: 2000,
    },
    {
      id: 'coloring',
      nameDe: 'Ansatzfarbe',
      nameIt: 'Colore ricrescita',
      descriptionDe: '',
      descriptionIt: '',
      categoryDe: 'Farbe & Strähnen',
      categoryIt: 'Colore e mèches',
      durationMinutes: 90,
      priceCents: 4500,
    },
    {
      id: 'ansatz-und-laengen',
      nameDe: 'Ansatz & Längen',
      nameIt: 'Colore completo',
      descriptionDe: '',
      descriptionIt: '',
      categoryDe: 'Farbe & Strähnen',
      categoryIt: 'Colore e mèches',
      durationMinutes: 120,
      priceCents: 6000,
    },
    {
      id: 'ansatzfarbe-und-straehnen',
      nameDe: 'Ansatzfarbe & Strähnen',
      nameIt: 'Colore ricrescita e mèches',
      descriptionDe: '',
      descriptionIt: '',
      categoryDe: 'Farbe & Strähnen',
      categoryIt: 'Colore e mèches',
      durationMinutes: 135,
      priceCents: 6500,
    },
    {
      id: 'highlights',
      nameDe: 'Strähnen',
      nameIt: 'Mèches',
      descriptionDe: '',
      descriptionIt: '',
      categoryDe: 'Farbe & Strähnen',
      categoryIt: 'Colore e mèches',
      durationMinutes: 120,
      priceCents: 5000,
      priceMaxCents: 6000,
    },
    {
      id: 'glossing',
      nameDe: 'Glossing',
      nameIt: 'Glossing',
      descriptionDe: '',
      descriptionIt: '',
      categoryDe: 'Farbe & Strähnen',
      categoryIt: 'Colore e mèches',
      durationMinutes: 30,
      priceCents: 3000,
    },
    {
      id: 'pflanzenhaarfarbe',
      nameDe: 'Pflanzenhaarfarbe',
      nameIt: 'Tinta vegetale',
      descriptionDe: '',
      descriptionIt: '',
      categoryDe: 'Farbe & Strähnen',
      categoryIt: 'Colore e mèches',
      durationMinutes: 120,
      priceCents: 4000,
      priceMaxCents: 5000,
    },
    {
      id: 'dauerwelle-herren',
      nameDe: 'Dauerwelle Herren',
      nameIt: 'Permanente uomo',
      descriptionDe: '',
      descriptionIt: '',
      categoryDe: 'Dauerwelle & Styling',
      categoryIt: 'Permanente e styling',
      durationMinutes: 90,
      priceCents: 4000,
    },
    {
      id: 'dauerwelle-damen',
      nameDe: 'Dauerwelle Damen',
      nameIt: 'Permanente donna',
      descriptionDe: '',
      descriptionIt: '',
      categoryDe: 'Dauerwelle & Styling',
      categoryIt: 'Permanente e styling',
      durationMinutes: 120,
      priceCents: 5000,
      priceMaxCents: 8000,
    },
    {
      id: 'brautstyling-probe',
      nameDe: 'Brautstyling & Probe',
      nameIt: 'Acconciatura sposa e prova',
      descriptionDe: '',
      descriptionIt: '',
      categoryDe: 'Dauerwelle & Styling',
      categoryIt: 'Permanente e styling',
      durationMinutes: 180,
      priceCents: 25000,
      priceMaxCents: 35000,
    },
    {
      id: 'steckfrisur',
      nameDe: 'Steckfrisur',
      nameIt: 'Raccolto',
      descriptionDe: '',
      descriptionIt: '',
      categoryDe: 'Dauerwelle & Styling',
      categoryIt: 'Permanente e styling',
      durationMinutes: 45,
      priceCents: 2500,
    },
    {
      id: 'manikuere',
      nameDe: 'Maniküre',
      nameIt: 'Manicure',
      descriptionDe: '',
      descriptionIt: '',
      categoryDe: 'Beauty & Kosmetik',
      categoryIt: 'Beauty e cosmetica',
      durationMinutes: 45,
      priceCents: 2500,
    },
    {
      id: 'make-up',
      nameDe: 'Make Up',
      nameIt: 'Make-up',
      descriptionDe: '',
      descriptionIt: '',
      categoryDe: 'Beauty & Kosmetik',
      categoryIt: 'Beauty e cosmetica',
      durationMinutes: 45,
      priceCents: 2500,
      priceMaxCents: 3000,
    },
    {
      id: 'augenbrauen-zupfen',
      nameDe: 'Augenbrauen zupfen',
      nameIt: 'Sopracciglia (pinzetta)',
      descriptionDe: '',
      descriptionIt: '',
      categoryDe: 'Beauty & Kosmetik',
      categoryIt: 'Beauty e cosmetica',
      durationMinutes: 15,
      priceCents: 500,
    },
    {
      id: 'augenbrauen-faerben',
      nameDe: 'Augenbrauen färben',
      nameIt: 'Tinta sopracciglia',
      descriptionDe: '',
      descriptionIt: '',
      categoryDe: 'Beauty & Kosmetik',
      categoryIt: 'Beauty e cosmetica',
      durationMinutes: 15,
      priceCents: 500,
    },
    ...(config.brand === 'salon1500'
      ? [
          {
            id: 'balayage-xs',
            nameDe: 'Balayage Paket XS',
            nameIt: 'Balayage Pacchetto XS',
            descriptionDe: '“balayer” – to dye like an artist painting a masterpiece',
            descriptionIt: '“balayer” – to dye like an artist painting a masterpiece',
            categoryDe: 'Balayage',
            categoryIt: 'Balayage',
            durationMinutes: 180,
            priceCents: 14000,
          },
          {
            id: 'balayage-s',
            nameDe: 'Balayage Paket S',
            nameIt: 'Balayage Pacchetto S',
            descriptionDe: '“balayer” – to dye like an artist painting a masterpiece',
            descriptionIt: '“balayer” – to dye like an artist painting a masterpiece',
            categoryDe: 'Balayage',
            categoryIt: 'Balayage',
            durationMinutes: 180,
            priceCents: 15000,
          },
          {
            id: 'balayage-m',
            nameDe: 'Balayage Paket M',
            nameIt: 'Balayage Pacchetto M',
            descriptionDe: '“balayer” – to dye like an artist painting a masterpiece',
            descriptionIt: '“balayer” – to dye like an artist painting a masterpiece',
            categoryDe: 'Balayage',
            categoryIt: 'Balayage',
            durationMinutes: 210,
            priceCents: 17000,
            priceMaxCents: 18000,
          },
          {
            id: 'balayage-l',
            nameDe: 'Balayage Paket L',
            nameIt: 'Balayage Pacchetto L',
            descriptionDe: '“balayer” – to dye like an artist painting a masterpiece',
            descriptionIt: '“balayer” – to dye like an artist painting a masterpiece',
            categoryDe: 'Balayage',
            categoryIt: 'Balayage',
            durationMinutes: 270,
            priceCents: 20000,
            priceMaxCents: 25000,
          },
        ]
      : []),
  ]

  await seedDemoWeek(salonRef, services, config.timezone)

  const seededServiceIds = new Set(services.map((service) => service.id))
  for (const [index, service] of services.entries()) {
    const { id, ...fields } = service
    await salonRef
      .collection('services')
      .doc(id)
      .set({
        ...fields,
        sortOrder: index,
        active: true,
        createdAt: now,
        updatedAt: now,
      })
  }
  // Drop leftover services from tests so the public price list stays exact.
  const existingServices = await salonRef.collection('services').get()
  for (const doc of existingServices.docs) {
    if (!seededServiceIds.has(doc.id)) await doc.ref.delete()
  }

  const weekly = {
    monday: [],
    tuesday: [
      { start: '08:00', end: '12:00' },
      { start: '14:00', end: '18:00' },
    ],
    wednesday: [{ start: '08:00', end: '16:00' }],
    thursday: [{ start: '08:00', end: '18:00' }],
    friday: [{ start: '08:00', end: '18:00' }],
    saturday: [{ start: '08:00', end: '16:00' }],
    sunday: [],
  }

  for (const weekday of WEEKDAYS) {
    await salonRef
      .collection('openingHours')
      .doc(weekday)
      .set({ intervals: weekly[weekday] }, { merge: true })
  }

  await salonRef.collection('holidays').doc('national-demo').set(
    {
      name: 'National Holiday (demo)',
      startDate: '2026-05-01',
      endDate: '2026-05-01',
    },
    { merge: true },
  )

  await salonRef
    .collection('dayExceptions')
    .doc('2026-12-24')
    .set(
      {
        date: '2026-12-24',
        intervals: [{ start: '09:00', end: '12:00' }],
        closed: false,
      },
      { merge: true },
    )

  await salonRef.collection('blockedSlots').doc('demo-block').set(
    {
      startAt: '2026-04-07T12:00:00.000Z',
      endAt: '2026-04-07T13:00:00.000Z',
      reason: 'Staff meeting',
      createdAt: now,
    },
    { merge: true },
  )

  await salonRef.collection('reservations').doc('demo-confirmed').set(
    {
      firstName: 'Anna',
      lastName: 'Beispiel',
      phone: '+43 660 1111111',
      email: 'anna@example.com',
      serviceId: 'haircut',
      serviceName: 'Haircut',
      durationMinutes: 30,
      priceCents: 2500,
      startAt: '2026-04-08T08:00:00.000Z',
      endAt: '2026-04-08T08:30:00.000Z',
      status: 'CONFIRMED',
      source: 'ONLINE',
      managementTokenHash: 'seed-hash-demo-confirmed',
      internalNote: null,
      idempotencyKey: 'seed-demo-confirmed',
      createdAt: now,
      updatedAt: now,
    },
    { merge: true },
  )

  await salonRef.collection('reservations').doc('demo-pending').set(
    {
      firstName: 'Max',
      lastName: 'Mustermann',
      phone: '+43 660 2222222',
      email: null,
      serviceId: 'blow-dry',
      serviceName: 'Blow Dry',
      durationMinutes: 30,
      priceCents: 2000,
      startAt: '2026-04-08T09:00:00.000Z',
      endAt: '2026-04-08T09:30:00.000Z',
      status: 'PENDING',
      source: 'ONLINE',
      managementTokenHash: 'seed-hash-demo-pending',
      internalNote: null,
      idempotencyKey: 'seed-demo-pending',
      createdAt: now,
      updatedAt: now,
    },
    { merge: true },
  )

  // Stale pending used by expiry E2E (createdAt far in the past).
  const staleCreatedAt = '2020-01-01T00:00:00.000Z'
  await salonRef.collection('reservations').doc('demo-stale-pending').set(
    {
      firstName: 'Alt',
      lastName: 'Anfrage',
      phone: '+43 660 3333333',
      email: 'stale@example.com',
      serviceId: 'haircut',
      serviceName: 'Haircut',
      durationMinutes: 30,
      priceCents: 2500,
      startAt: '2026-05-01T08:00:00.000Z',
      endAt: '2026-05-01T08:30:00.000Z',
      status: 'PENDING',
      source: 'ONLINE',
      managementTokenHash: 'seed-hash-demo-stale-pending',
      internalNote: null,
      idempotencyKey: 'seed-demo-stale-pending',
      createdAt: staleCreatedAt,
      updatedAt: staleCreatedAt,
    },
    { merge: true },
  )
  await salonRef.collection('slotLocks').doc('2026-05-01T08-00-00-000Z').set(
    {
      reservationId: 'demo-stale-pending',
      startAt: '2026-05-01T08:00:00.000Z',
      endAt: '2026-05-01T08:30:00.000Z',
      createdAt: staleCreatedAt,
    },
    { merge: true },
  )
}
