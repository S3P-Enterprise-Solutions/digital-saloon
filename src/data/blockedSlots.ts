import { collection, getDocs, orderBy, query, where } from 'firebase/firestore'
import * as v from 'valibot'

import { firestore } from '../firebase'
import { getSalonId } from './salonConfig'
import { blockedSlotsCollectionPath } from './salonPaths'
import { blockedSlotSchema, type BlockedSlot } from './schemas'

export type BlockedSlotWithId = BlockedSlot & { id: string }

/**
 * Fetches blocked slots overlapping `[rangeStartIso, rangeEndIso)`.
 * Queries `startAt < rangeEndIso` and filters `endAt > rangeStartIso` client-side
 * so multi-day / all-day events starting before the week still appear.
 */
export async function fetchBlockedSlotsInRange(
  rangeStartIso: string,
  rangeEndIso: string,
): Promise<BlockedSlotWithId[]> {
  const salonId = getSalonId()
  const snap = await getDocs(
    query(
      collection(firestore, blockedSlotsCollectionPath(salonId)),
      where('startAt', '<', rangeEndIso),
      orderBy('startAt', 'asc'),
    ),
  )

  const rangeStartMs = new Date(rangeStartIso).getTime()
  return snap.docs
    .map((docSnap) => ({
      id: docSnap.id,
      ...v.parse(blockedSlotSchema, docSnap.data()),
    }))
    .filter((slot) => new Date(slot.endAt).getTime() > rangeStartMs)
}
