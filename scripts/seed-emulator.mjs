import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

import { EMULATOR_HOST, EMULATOR_PORTS, PROJECT_ID } from './emulator-ports.mjs'
import { salonSeedConfig, seedSalonData } from './seed-salon-data.mjs'

process.env.FIREBASE_AUTH_EMULATOR_HOST ??= `${EMULATOR_HOST}:${EMULATOR_PORTS.auth}`
process.env.FIRESTORE_EMULATOR_HOST ??= `${EMULATOR_HOST}:${EMULATOR_PORTS.firestore}`

const GUEST_EMAIL = 'guest@example.com'
const GUEST_PASSWORD = 'password123'

async function ensureUser(auth, { email, password, displayName }) {
  try {
    return await auth.getUserByEmail(email)
  } catch {
    return await auth.createUser({
      email,
      password,
      displayName,
      emailVerified: true,
    })
  }
}

async function main() {
  initializeApp({ projectId: PROJECT_ID })
  const auth = getAuth()
  const firestore = getFirestore()
  const config = salonSeedConfig()

  const adminUser = await ensureUser(auth, {
    email: config.adminEmail,
    password: config.adminPassword,
    displayName: 'Salon Admin',
  })

  await firestore.collection('users').doc(adminUser.uid).set(
    {
      email: config.adminEmail,
      displayName: 'Salon Admin',
      role: 'admin',
      isPrimaryAdmin: true,
      createdAt: new Date().toISOString(),
    },
    { merge: true },
  )

  const guestUser = await ensureUser(auth, {
    email: GUEST_EMAIL,
    password: GUEST_PASSWORD,
    displayName: 'Guest User',
  })

  await firestore.collection('users').doc(guestUser.uid).set(
    {
      email: GUEST_EMAIL,
      displayName: 'Guest User',
      role: 'user',
      createdAt: new Date().toISOString(),
    },
    { merge: true },
  )

  await seedSalonData(firestore, config)

  console.log(`[seed] Admin: ${config.adminEmail} / ${config.adminPassword}`)
  console.log(`[seed] Non-admin: ${GUEST_EMAIL} / ${GUEST_PASSWORD}`)
  console.log(`[seed] Salon: ${config.salonId} (${config.name}, ${config.timezone})`)
}

main().catch((error) => {
  console.error('[seed] Failed:', error)
  process.exit(1)
})
