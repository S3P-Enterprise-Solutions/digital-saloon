/** Stable failure keys for employee admin callables → i18n. */

export type EmployeeCallableFailure =
  | 'firstNameInvalid'
  | 'lastNameInvalid'
  | 'emailInvalid'
  | 'passwordTooShort'
  | 'alreadyExists'
  | 'notFound'
  | 'featureDisabled'
  | 'authDisabledBookable'
  | 'mustBeAdmin'
  | 'failed'

function rawErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string') return message
  }
  if (error instanceof Error) return error.message
  return String(error)
}

/** Strip Firebase status suffixes like ` [400]` or `(functions/invalid-argument)`. */
export function normalizeCallableErrorMessage(message: string): string {
  return message
    .replace(/\s*\(functions\/[a-z-]+\)\s*$/i, '')
    .replace(/\s*\[\d{3}\]\s*$/g, '')
    .trim()
}

export function employeeCallableFailureOf(error: unknown): EmployeeCallableFailure {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code?: unknown }).code ?? '')
      : ''
  const message = normalizeCallableErrorMessage(rawErrorMessage(error)).toLowerCase()

  if (code === 'functions/already-exists' || message.includes('already exists')) {
    return 'alreadyExists'
  }
  if (code === 'functions/not-found' || message.includes('not found')) {
    return 'notFound'
  }
  if (message.includes('employee management is not enabled')) {
    return 'featureDisabled'
  }
  if (message.includes('must be an admin')) {
    return 'mustBeAdmin'
  }
  if (message.includes('auth-disabled') || message.includes('cannot be bookable')) {
    return 'authDisabledBookable'
  }
  if (
    message.includes('password must be at least') ||
    message.includes('password is required')
  ) {
    return 'passwordTooShort'
  }
  if (message.includes('valid email') || message.includes('email is required')) {
    return 'emailInvalid'
  }
  if (message.includes('firstname') || message.includes('first name')) {
    return 'firstNameInvalid'
  }
  if (message.includes('lastname') || message.includes('last name')) {
    return 'lastNameInvalid'
  }
  return 'failed'
}

export type EmployeeErrorTranslator = (
  key: `admin.employeesError.${EmployeeCallableFailure}`,
) => string

export function translateEmployeeCallableError(
  error: unknown,
  t: EmployeeErrorTranslator,
): string {
  return t(`admin.employeesError.${employeeCallableFailureOf(error)}`)
}
