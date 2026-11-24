const DEFAULT_SALON_ID = 'pilot'
const DEFAULT_TIMEZONE = 'Europe/Vienna'

export function getSalonId(): string {
  const fromEnv = process.env.SALON_ID
  if (typeof fromEnv === 'string' && fromEnv.trim().length > 0) {
    return fromEnv.trim()
  }
  return DEFAULT_SALON_ID
}

export function getDefaultTimezone(): string {
  return DEFAULT_TIMEZONE
}

export const functionsRegion = 'europe-west8' as const

export function getBrandKey(): 'kimm' | 'salon1500' | 'hairboutique' {
  const fromEnv = process.env.BRAND?.trim().toLowerCase()
  if (fromEnv === 'salon1500') return 'salon1500'
  if (fromEnv === 'hairboutique') return 'hairboutique'
  if (getSalonId() === 'salon1500') return 'salon1500'
  if (getSalonId() === 'hairboutique') return 'hairboutique'
  return 'kimm'
}

export function getOperatorCredentials(): { email: string; password: string } | null {
  const envEmail = process.env.OPERATOR_EMAIL?.trim().toLowerCase()
  const envPassword = process.env.OPERATOR_PASSWORD
  if (envEmail && envPassword) {
    return { email: envEmail, password: envPassword }
  }
  if (process.env.FUNCTIONS_EMULATOR === 'true') {
    return {
      email: envEmail || 'operator@salonflow.local',
      password: envPassword || 'SalonFlowOperator!2026',
    }
  }
  return null
}
