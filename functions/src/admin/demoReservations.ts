import { createHash } from 'node:crypto'

export const DEMO_RESERVATION_FLAG = 'seededDemo'

export type DemoServiceInput = {
  id: string
  nameDe: string
  nameIt: string
  durationMinutes: number
  priceCents: number
}

export const FALLBACK_DEMO_SERVICES: DemoServiceInput[] = [
  {
    id: 'haircut-wash',
    nameDe: 'Waschen, Schneiden, Föhnen',
    nameIt: 'Lavaggio, taglio, piega',
    durationMinutes: 60,
    priceCents: 4800,
  },
  {
    id: 'haircut',
    nameDe: 'Herrenschnitt',
    nameIt: 'Taglio uomo',
    durationMinutes: 30,
    priceCents: 2600,
  },
  {
    id: 'coloring',
    nameDe: 'Farbe',
    nameIt: 'Colore',
    durationMinutes: 120,
    priceCents: 8500,
  },
  {
    id: 'blow-dry',
    nameDe: 'Föhnen',
    nameIt: 'Piega',
    durationMinutes: 45,
    priceCents: 3000,
  },
  {
    id: 'highlights',
    nameDe: 'Strähnen',
    nameIt: 'Colpi di sole',
    durationMinutes: 150,
    priceCents: 11000,
  },
]

const CUSTOMERS: ReadonlyArray<readonly [string, string]> = [
  ['Maria', 'Gruber'],
  ['Lukas', 'Pichler'],
  ['Giulia', 'Rossi'],
  ['Thomas', 'Hofer'],
  ['Sofia', 'Bianchi'],
  ['Elena', 'Kofler'],
  ['Marco', 'Ferrari'],
  ['Katharina', 'Thaler'],
  ['Stefan', 'Egger'],
  ['Laura', 'Gasser'],
  ['Matteo', 'Ricci'],
  ['Verena', 'Mair'],
]

const WEEK_TEMPLATE: ReadonlyArray<readonly [number, string, string]> = [
  [1, '08:30', 'haircut-wash'],
  [1, '10:00', 'haircut'],
  [1, '14:00', 'coloring'],
  [1, '16:30', 'blow-dry'],
  [2, '08:00', 'highlights'],
  [2, '11:00', 'haircut'],
  [2, '13:00', 'haircut-wash'],
  [2, '14:30', 'blow-dry'],
  [3, '09:00', 'coloring'],
  [3, '11:30', 'haircut'],
  [3, '14:00', 'haircut-wash'],
  [3, '16:00', 'haircut'],
  [3, '17:00', 'blow-dry'],
  [4, '08:00', 'haircut'],
  [4, '09:00', 'haircut-wash'],
  [4, '10:30', 'highlights'],
  [5, '08:00', 'blow-dry'],
  [5, '09:00', 'haircut-wash'],
  [5, '10:30', 'haircut'],
  [5, '13:00', 'coloring'],
]

const WEEK_OFFSETS = [-1, 0, 1, 2]

function partsInTimeZone(date: Date, timeZone: string): Record<string, number> {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const map: Record<string, number> = {}
  for (const part of parts) {
    if (part.type !== 'literal') map[part.type] = Number(part.value)
  }
  return map
}

function localYmd(date: Date, timeZone: string): string {
  const p = partsInTimeZone(date, timeZone)
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`
}

function addDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

function mondayOf(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return addDays(ymd, weekday === 0 ? -6 : 1 - weekday)
}

function zonedToUtc(ymd: string, hm: string, timeZone: string): Date {
  const [y, m, d] = ymd.split('-').map(Number)
  const [hour, minute] = hm.split(':').map(Number)
  const desired = Date.UTC(y, m - 1, d, hour, minute)
  let utc = desired
  for (let i = 0; i < 3; i += 1) {
    const p = partsInTimeZone(new Date(utc), timeZone)
    utc += desired - Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute)
  }
  return new Date(utc)
}

export type DemoEmployeeInput = {
  id: string
  displayName: string
}

export function buildDemoReservations(input: {
  now: Date
  timeZone: string
  services: DemoServiceInput[]
  employees?: readonly DemoEmployeeInput[]
}): Array<{ id: string; data: Record<string, unknown> }> {
  const servicePool = input.services.length > 0 ? input.services : FALLBACK_DEMO_SERVICES
  const shortServices = servicePool.filter((s) => s.durationMinutes <= 90)
  const fallbackPool = shortServices.length > 0 ? shortServices : servicePool
  const byId = new Map(servicePool.map((s) => [s.id, s]))
  const employees = input.employees ?? []
  const baseMonday = mondayOf(localYmd(input.now, input.timeZone))
  const createdAt = input.now.toISOString()
  const result: Array<{ id: string; data: Record<string, unknown> }> = []
  let seq = 0

  for (const weekOffset of WEEK_OFFSETS) {
    const monday = addDays(baseMonday, weekOffset * 7)
    WEEK_TEMPLATE.forEach(([dayOffset, startHm, preferredId], templateIndex) => {
      // Leave gaps so weeks look varied and days are not completely filled.
      if ((templateIndex + weekOffset * 3) % 5 === 0) return

      const service = byId.get(preferredId) ?? fallbackPool[seq % fallbackPool.length]
      const ymd = addDays(monday, dayOffset)
      const startAt = zonedToUtc(ymd, startHm, input.timeZone)
      const endAt = new Date(startAt.getTime() + service.durationMinutes * 60_000)
      const [firstName, lastName] = CUSTOMERS[seq % CUSTOMERS.length]
      const status =
        startAt.getTime() < input.now.getTime()
          ? 'COMPLETED'
          : seq % 6 === 4
            ? 'PENDING'
            : 'CONFIRMED'
      const source = seq % 3 === 0 ? 'MANUAL' : 'ONLINE'
      const employee = employees.length > 0 ? employees[seq % employees.length] : null
      const id = `demo-${ymd}-${startHm.replace(':', '')}`
      const tokenHash = createHash('sha256').update(`demo-token-${id}`).digest('hex')
      seq += 1

      result.push({
        id,
        data: {
          firstName,
          lastName,
          phone: `+39 348 ${String(1000000 + seq * 137).slice(0, 7)}`,
          email: null,
          serviceId: service.id,
          serviceName: `${service.nameDe} / ${service.nameIt}`,
          durationMinutes: service.durationMinutes,
          priceCents: service.priceCents,
          ...(employee ? { employeeId: employee.id, employeeName: employee.displayName } : {}),
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          status,
          source,
          managementTokenHash: tokenHash,
          internalNote: null,
          idempotencyKey: null,
          [DEMO_RESERVATION_FLAG]: true,
          createdAt,
          updatedAt: createdAt,
        },
      })
    })
  }

  return result
}
