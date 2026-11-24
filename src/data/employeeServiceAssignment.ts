/** Toggles whether `serviceId` is in the employee's assigned service ids. */
export function toggleServiceAssignment(serviceIds: string[], serviceId: string): string[] {
  if (serviceIds.includes(serviceId)) {
    return serviceIds.filter((id) => id !== serviceId)
  }
  return [...serviceIds, serviceId]
}
