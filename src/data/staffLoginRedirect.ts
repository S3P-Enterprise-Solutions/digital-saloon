/** Post sign-in destination for staff login (admin vs employee). */
export function staffLoginDestination(options: {
  redirect?: string
  isOperator: boolean
  role?: string | null
}): string {
  if (options.redirect?.startsWith('/')) {
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
