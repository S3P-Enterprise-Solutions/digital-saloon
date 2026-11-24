import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  cancelReservationAdmin,
  completeReservationAdmin,
  confirmReservationAdmin,
  createManualReservationAdmin,
  declineReservationAdmin,
  updateManualReservationAdmin,
} from '../data/adminBookingApi'
import { fetchReservationsInRange } from '../data/reservations'
import { getSalonId } from '../data/salonConfig'
import { queryKeyOf } from './queryKeys'

export function useAdminReservations(rangeStartIso: string, rangeEndIso: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeyOf('adminReservations', getSalonId(), rangeStartIso, rangeEndIso),
    queryFn: () => fetchReservationsInRange(rangeStartIso, rangeEndIso),
    enabled,
  })
}

export function useAdminReservationActions() {
  const queryClient = useQueryClient()

  const invalidate = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: queryKeyOf('adminReservations') })
    await queryClient.invalidateQueries({ queryKey: queryKeyOf('adminReservation') })
  }

  const confirm = useMutation({
    mutationFn: confirmReservationAdmin,
    onSuccess: () => {
      void invalidate()
    },
  })
  const decline = useMutation({
    mutationFn: declineReservationAdmin,
    onSuccess: () => {
      void invalidate()
    },
  })
  const cancel = useMutation({
    mutationFn: cancelReservationAdmin,
    onSuccess: () => {
      void invalidate()
    },
  })
  const complete = useMutation({
    mutationFn: completeReservationAdmin,
    onSuccess: () => {
      void invalidate()
    },
  })
  const createManual = useMutation({
    mutationFn: createManualReservationAdmin,
    onSuccess: () => {
      void invalidate()
    },
  })
  const updateManual = useMutation({
    mutationFn: updateManualReservationAdmin,
    onSuccess: () => {
      void invalidate()
    },
  })

  return { confirm, decline, cancel, complete, createManual, updateManual }
}
