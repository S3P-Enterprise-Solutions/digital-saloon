/** Same-origin app path only: `/…` but not `//evil.com` protocol-relative URLs. */
export function isSafeAppRedirect(path: string): boolean {
  return /^\/(?!\/)/.test(path)
}

/** Post sign-in destination for staff login (admin vs employee). */
export function staffLoginDestination(options: {
  redirect?: string
  isOperator: boolean
  role?: string | null
}): string {
  if (options.redirect && isSafeAppRedirect(options.redirect)) {
    return options.redirect
  }
  if (options.isOperator) {
    return '/admin'
  }
  if (options.role === 'employee') {
    return '/employee'
  }
  return '/admin'
}
