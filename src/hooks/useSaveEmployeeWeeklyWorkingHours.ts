import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'

import {
  callSaveEmployeeWorkingHours,
  type SaveEmployeeWorkingHoursInput,
} from '../data/employeeAdminApi'
import type { WeeklyDraft } from '../data/openingHoursForm'
import { getSalonId } from '../data/salonConfig'
import { weekdaySchema } from '../data/schemas'

import { queryKeyOf } from './queryKeys'

/** Single weekday save (for employee self-service in Task 8). */
export function useSaveEmployeeWorkingHours(): UseMutationResult<
  void,
  Error,
  SaveEmployeeWorkingHoursInput
> {
  return useMutation({
    mutationFn: callSaveEmployeeWorkingHours,
  })
}

export type SaveEmployeeWeeklyWorkingHoursInput = {
  employeeUid: string
  draft: WeeklyDraft
}

export function useSaveEmployeeWeeklyWorkingHours(): UseMutationResult<
  void,
  Error,
  SaveEmployeeWeeklyWorkingHoursInput
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ employeeUid, draft }) => {
      for (const weekday of weekdaySchema.options) {
        await callSaveEmployeeWorkingHours({
          employeeUid,
          weekday,
          intervals: draft[weekday],
        })
      }
    },
    onSuccess: (_, { employeeUid }) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeyOf('employeeWorkingHours', getSalonId(), employeeUid),
      })
    },
  })
}
