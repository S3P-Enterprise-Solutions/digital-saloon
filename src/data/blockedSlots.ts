import { httpsCallable } from 'firebase/functions'
import * as v from 'valibot'

import { firebaseFunctions } from '../firebase'
import { blockedSlotSchema, type BlockedSlot } from './schemas'

export type BlockedSlotWithId = BlockedSlot & { id: string }

const blockedSlotWithIdSchema = v.intersect([
  v.object({ id: v.pipe(v.string(), v.minLength(1)) }),
  blockedSlotSchema,
])

const listBlockedSlotsResponseSchema = v.object({
  slots: v.array(blockedSlotWithIdSchema),
})

const setBlockedSlotPrivacyResponseSchema = v.object({
  slot: blockedSlotWithIdSchema,
})

/**
 * Fetches blocked slots / synced Google Calendar appointments overlapping `[rangeStartIso, rangeEndIso)`
 * via Cloud Function so private employee events are redacted server-side.
 */
export async function fetchBlockedSlotsInRange(
  rangeStartIso: string,
  rangeEndIso: string,
): Promise<BlockedSlotWithId[]> {
  const call = httpsCallable<{ rangeStartIso: string; rangeEndIso: string }, unknown>(
    firebaseFunctions,
    'listBlockedSlotsInRange',
  )
  const result = await call({ rangeStartIso, rangeEndIso })
  return v.parse(listBlockedSlotsResponseSchema, result.data).slots
}

export async function setBlockedSlotPrivacy(input: {
  slotId: string
  isPrivate: boolean
}): Promise<BlockedSlotWithId> {
  const call = httpsCallable<{ slotId: string; isPrivate: boolean }, unknown>(
    firebaseFunctions,
    'setBlockedSlotPrivacy',
  )
  const result = await call(input)
  return v.parse(setBlockedSlotPrivacyResponseSchema, result.data).slot
}
