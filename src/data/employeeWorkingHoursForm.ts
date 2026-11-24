/** Shared weekly / interval validation for employee schedules (mirrors salon opening hours). */
export {
  defaultDayInterval,
  intervalIssues,
  weeklyDraftIsValid,
  weeklyDraftOf,
  type IntervalIssue,
  type WeeklyDraft,
} from './openingHoursForm'

import { intervalIssues } from './openingHoursForm'
import type { TimeInterval } from './schemas'

/** Day exception with custom open hours must have at least one valid interval. */
export function dayExceptionOpenIntervalsValid(
  closed: boolean,
  intervals: readonly TimeInterval[],
): boolean {
  if (closed) return true
  if (intervals.length === 0) return false
  return intervalIssues(intervals).every((issue) => !issue)
}
