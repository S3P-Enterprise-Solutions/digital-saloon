import { HttpsError } from 'firebase-functions/v2/https'

export type TimeInterval = { start: string; end: string }

function parseHm(value: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(value)
  if (!match) {
    throw new HttpsError('invalid-argument', 'Interval times must be HH:mm.')
  }
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) {
    throw new HttpsError('invalid-argument', 'Interval times must be HH:mm.')
  }
  return hours * 60 + minutes
}

/** Each interval must have start before end; sorted intervals must not overlap. */
export function assertValidIntervals(intervals: TimeInterval[]): void {
  if (!Array.isArray(intervals)) {
    throw new HttpsError('invalid-argument', 'Intervals must be an array.')
  }
  const sorted = [...intervals].sort((a, b) => parseHm(a.start) - parseHm(b.start))
  for (let i = 0; i < sorted.length; i += 1) {
    const { start, end } = sorted[i]
    const startMin = parseHm(start)
    const endMin = parseHm(end)
    if (startMin >= endMin) {
      throw new HttpsError('invalid-argument', 'Each interval must have start before end.')
    }
    if (i > 0) {
      const prevEnd = parseHm(sorted[i - 1].end)
      if (startMin < prevEnd) {
        throw new HttpsError('invalid-argument', 'Intervals must not overlap.')
      }
    }
  }
}