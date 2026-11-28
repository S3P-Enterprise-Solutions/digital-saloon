import { httpsCallable } from 'firebase/functions'
import * as v from 'valibot'

import { firebaseFunctions } from '../firebase'
import { customerSchema, type Customer } from './schemas'

const customerReservationHistorySchema = v.object({
  kind: v.literal('reservation'),
  id: v.string(),
  reservationId: v.string(),
  startAt: v.string(),
  endAt: v.string(),
  durationMinutes: v.number(),
  serviceName: v.string(),
  status: v.string(),
  employeeName: v.nullable(v.string()),
  notes: v.nullable(v.string()),
  internalNote: v.nullable(v.string()),
})

const customerCalendarHistorySchema = v.object({
  kind: v.literal('googleCalendar'),
  id: v.string(),
  startAt: v.string(),
  endAt: v.string(),
  durationMinutes: v.number(),
  title: v.string(),
  description: v.nullable(v.string()),
  employeeId: v.nullable(v.string()),
})

const customerHistoryItemSchema = v.variant('kind', [
  customerReservationHistorySchema,
  customerCalendarHistorySchema,
])
export type CustomerHistoryItem = v.InferOutput<typeof customerHistoryItemSchema>

const listCustomersResponseSchema = v.object({
  customers: v.array(customerSchema),
})

const getCustomerDetailResponseSchema = v.object({
  customer: customerSchema,
  history: v.array(customerHistoryItemSchema),
})
export type CustomerDetailResponse = v.InferOutput<typeof getCustomerDetailResponseSchema>

const saveCustomerResponseSchema = v.object({
  customer: customerSchema,
})

export type SaveCustomerInput = {
  customerId?: string | null
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  stylistNotes: string | null
}

export async function listCustomers(search?: string): Promise<Customer[]> {
  const call = httpsCallable<{ search?: string }, unknown>(firebaseFunctions, 'listCustomers')
  const result = await call(search ? { search } : {})
  return v.parse(listCustomersResponseSchema, result.data).customers
}

export async function getCustomerDetail(customerId: string): Promise<CustomerDetailResponse> {
  const call = httpsCallable<{ customerId: string }, unknown>(
    firebaseFunctions,
    'getCustomerDetail',
  )
  const result = await call({ customerId })
  return v.parse(getCustomerDetailResponseSchema, result.data)
}

export async function saveCustomer(input: SaveCustomerInput): Promise<Customer> {
  const call = httpsCallable<SaveCustomerInput, unknown>(firebaseFunctions, 'saveCustomer')
  const result = await call(input)
  return v.parse(saveCustomerResponseSchema, result.data).customer
}

export async function archiveCustomer(customerId: string): Promise<void> {
  const call = httpsCallable<{ customerId: string }, unknown>(firebaseFunctions, 'archiveCustomer')
  await call({ customerId })
}
