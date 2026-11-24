/** Parse booking/admin URL search into a deduped list of service ids. */
export function parseSelectedServiceIds(search: {
  serviceId?: string
  serviceIds?: string
}): string[] {
  if (search.serviceIds) {
    return Array.from(
      new Set(
        search.serviceIds
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    )
  }
  if (search.serviceId) return [search.serviceId]
  return []
}

/** Serialize service ids for URL search (`undefined` when empty). */
export function serializeServiceIds(ids: readonly string[]): string | undefined {
  return ids.length > 0 ? ids.join(',') : undefined
}
