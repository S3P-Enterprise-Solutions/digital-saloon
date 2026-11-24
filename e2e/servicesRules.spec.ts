import { expect, test, type APIRequestContext } from '@playwright/test'

import { demoProjectId, emulatorHost, emulatorPorts } from '../src/data/emulatorPorts'
import {
  getService,
  restoreServices,
  snapshotServices,
  type ServiceSnapshot,
} from './firestoreAdmin'
import { demoAccount } from './helpers'

const guestAccount = { email: 'guest@example.com', password: 'password123' } as const

const authUrl = `http://${emulatorHost}:${emulatorPorts.auth}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`
const documentsUrl = `http://${emulatorHost}:${emulatorPorts.firestore}/v1/projects/${demoProjectId}/databases/(default)/documents`
const haircutPath = 'salons/pilot/services/haircut'

type FieldValue = string | number | boolean

function toFirestoreFields(data: Record<string, FieldValue>): Record<string, object> {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => {
      if (typeof value === 'boolean') return [key, { booleanValue: value }]
      if (typeof value === 'number') return [key, { integerValue: String(value) }]
      return [key, { stringValue: value }]
    }),
  )
}

async function signIn(
  request: APIRequestContext,
  account: { email: string; password: string },
): Promise<string> {
  const response = await request.post(authUrl, {
    data: { email: account.email, password: account.password, returnSecureToken: true },
  })
  expect(response.ok(), `sign-in as ${account.email}`).toBe(true)
  const body = (await response.json()) as { idToken: string }
  return body.idToken
}

async function writeStatus(
  request: APIRequestContext,
  token: string | null,
  path: string,
  data: Record<string, FieldValue>,
): Promise<number> {
  const response = await request.patch(`${documentsUrl}/${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    data: { fields: toFirestoreFields(data) },
  })
  return response.status()
}

async function deleteStatus(
  request: APIRequestContext,
  token: string | null,
  path: string,
): Promise<number> {
  const response = await request.delete(`${documentsUrl}/${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return response.status()
}

async function readStatus(
  request: APIRequestContext,
  token: string | null,
  path: string,
): Promise<number> {
  const response = await request.get(`${documentsUrl}/${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return response.status()
}

async function currentHaircut(): Promise<Record<string, FieldValue>> {
  const service = await getService('haircut')
  if (!service) throw new Error('Seeded haircut service missing')
  return {
    nameDe: String(service.nameDe),
    nameIt: String(service.nameIt),
    descriptionDe: String(service.descriptionDe ?? ''),
    descriptionIt: String(service.descriptionIt ?? ''),
    durationMinutes: Number(service.durationMinutes),
    priceCents: Number(service.priceCents),
    active: Boolean(service.active),
    sortOrder: Number(service.sortOrder ?? 0),
    createdAt: String(service.createdAt),
    updatedAt: String(service.updatedAt),
  }
}

test.describe('Firestore-Regeln für Leistungen', () => {
  test.describe.configure({ mode: 'serial' })

  let adminToken = ''
  let guestToken = ''
  let servicesSnapshot: ServiceSnapshot

  test.beforeAll(async ({ request }) => {
    adminToken = await signIn(request, demoAccount)
    guestToken = await signIn(request, guestAccount)
    servicesSnapshot = await snapshotServices()
  })

  test.beforeEach(async () => {
    await restoreServices(servicesSnapshot)
  })

  test.afterAll(async () => {
    await restoreServices(servicesSnapshot)
  })

  test('aktive Leistungen sind öffentlich lesbar', async ({ request }) => {
    expect(await readStatus(request, null, haircutPath)).toBe(200)
  })

  test('Admin darf gültige Leistungen speichern', async ({ request }) => {
    const next = {
      ...(await currentHaircut()),
      nameDe: 'Herrenschnitt aktualisiert',
      nameIt: 'Taglio uomo aggiornato',
      priceCents: 2900,
      updatedAt: '2026-11-17T00:00:00.000Z',
    }
    expect(await writeStatus(request, adminToken, haircutPath, next)).toBe(200)
    expect(await getService('haircut')).toMatchObject({
      nameDe: 'Herrenschnitt aktualisiert',
      nameIt: 'Taglio uomo aggiornato',
      priceCents: 2900,
    })
  })

  test('Gäste und Anonyme dürfen nichts ändern', async ({ request }) => {
    const next = { ...(await currentHaircut()), priceCents: 1 }
    expect(await writeStatus(request, guestToken, haircutPath, next)).toBe(403)
    expect(await writeStatus(request, null, haircutPath, next)).toBe(403)
    expect((await getService('haircut'))?.priceCents).toBe(2200)
  })

  test('niemand darf Leistungen löschen', async ({ request }) => {
    expect(await deleteStatus(request, adminToken, haircutPath)).toBe(403)
    expect(await getService('haircut')).not.toBeNull()
  })

  const invalidCases: Array<
    [string, (base: Record<string, FieldValue>) => Record<string, FieldValue>]
  > = [
    ['leerer deutscher Name', (base) => ({ ...base, nameDe: '' })],
    ['leerer italienischer Name', (base) => ({ ...base, nameIt: '' })],
    ['Name zu lang', (base) => ({ ...base, nameDe: 'x'.repeat(121) })],
    ['Dauer zu kurz', (base) => ({ ...base, durationMinutes: 4 })],
    ['Dauer zu lang', (base) => ({ ...base, durationMinutes: 481 })],
    ['negativer Preis', (base) => ({ ...base, priceCents: -1 })],
    ['Preis als Text', (base) => ({ ...base, priceCents: '2600' })],
    ['createdAt ändern', (base) => ({ ...base, createdAt: '2099-01-01T00:00:00.000Z' })],
    ['zusätzliches Feld', (base) => ({ ...base, surprise: 'x' })],
  ]

  for (const [label, build] of invalidCases) {
    test(`lehnt ab: ${label}`, async ({ request }) => {
      const before = await getService('haircut')
      expect(
        await writeStatus(request, adminToken, haircutPath, build(await currentHaircut())),
      ).toBe(403)
      expect(await getService('haircut')).toEqual(before)
    })
  }
})
