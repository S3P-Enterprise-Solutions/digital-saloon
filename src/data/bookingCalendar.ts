/** Calendar helpers for the booking wizard (YYYY-MM-DD in salon timezone days). */

export function ymdFromParts(year: number, monthIndex: number, day: number): string {
  const month = String(monthIndex + 1).padStart(2, '0')
  const dayStr = String(day).padStart(2, '0')
  return `${year}-${month}-${dayStr}`
}

export function parseYmd(ymd: string): { year: number; monthIndex: number; day: number } {
  const [y, m, d] = ymd.split('-').map(Number)
  return { year: y!, monthIndex: m! - 1, day: d! }
}

export function addDays(ymd: string, delta: number): string {
  const { year, monthIndex, day } = parseYmd(ymd)
  const date = new Date(Date.UTC(year, monthIndex, day + delta))
  return ymdFromParts(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
}

/** Monday `YYYY-MM-DD` of the ISO week containing `ymd`. */
export function weekStartMondayYmd(ymd: string): string {
  const { year, monthIndex, day } = parseYmd(ymd)
  const weekday = new Date(Date.UTC(year, monthIndex, day)).getUTCDay()
  const offset = (weekday + 6) % 7
  return addDays(ymd, -offset)
}

/** Seven `YYYY-MM-DD` strings from Monday through Sunday for the week starting at `weekStartYmd`. */
export function weekDays(weekStartYmd: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStartYmd, index))
}

/** Earliest `YYYY-MM-DD` in `days` that is not in the past and has at least one slot. */
export function findEarliestAvailableDate(
  days: readonly string[],
  byDate: Map<string, string[]>,
  todayYmd: string,
): string | null {
  for (const ymd of days) {
    if (ymd < todayYmd) continue
    if ((byDate.get(ymd)?.length ?? 0) > 0) return ymd
  }
  return null
}

export function addMonths(ymd: string, delta: number): string {
  const { year, monthIndex, day } = parseYmd(ymd)
  const date = new Date(Date.UTC(year, monthIndex + delta, 1))
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()
  const clamped = Math.min(day, lastDay)
  return ymdFromParts(date.getUTCFullYear(), date.getUTCMonth(), clamped)
}

/** First and last `YYYY-MM-DD` of the calendar month containing `monthAnchorYmd`. */
export function monthBoundsYmd(monthAnchorYmd: string): { startYmd: string; endYmd: string } {
  const { year, monthIndex } = parseYmd(monthAnchorYmd)
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
  return {
    startYmd: ymdFromParts(year, monthIndex, 1),
    endYmd: ymdFromParts(year, monthIndex, lastDay),
  }
}

/**
 * Computes the slot query range for the visible month (clamped to `todayYmd`, or `null` for
 * past months) and whether `selectedDate` falls within that visible month.
 */
export function monthSlotQueryPlan(
  monthAnchorYmd: string,
  todayYmd: string,
  selectedDate: string | null,
): {
  monthQueryFrom: string | null
  monthQueryTo: string | null
  selectedDateInVisibleMonth: boolean
} {
  const { startYmd, endYmd } = monthBoundsYmd(monthAnchorYmd)
  const monthQueryFrom = endYmd < todayYmd ? null : startYmd < todayYmd ? todayYmd : startYmd
  const monthQueryTo = monthQueryFrom !== null ? endYmd : null
  const selectedDateInVisibleMonth =
    selectedDate !== null && selectedDate >= startYmd && selectedDate <= endYmd
  return { monthQueryFrom, monthQueryTo, selectedDateInVisibleMonth }
}

export function monthMatrix(year: number, monthIndex: number): Array<Array<string | null>> {
  const firstWeekday = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay()
  // Monday-first
  const offset = (firstWeekday + 6) % 7
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
  const cells: Array<string | null> = []
  for (let i = 0; i < offset; i += 1) cells.push(null)
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(ymdFromParts(year, monthIndex, day))
  }
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: Array<Array<string | null>> = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }
  return weeks
}

const viennaYmdFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Vienna',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function viennaTodayYmd(now = new Date()): string {
  return viennaYmdFormatter.format(now)
}

export function slotsByDate(slots: Array<{ startAt: string }>): Map<string, string[]> {
  const map = new Map<string, string[]>()
  for (const slot of slots) {
    const ymd = viennaYmdFormatter.format(new Date(slot.startAt))
    const list = map.get(ymd) ?? []
    list.push(slot.startAt)
    map.set(ymd, list)
  }
  return map
}
