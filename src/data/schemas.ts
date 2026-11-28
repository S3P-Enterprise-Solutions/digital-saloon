import * as v from 'valibot'

/** Search params that are missing or invalid fall back instead of failing the route. */
export function optionalSearchParam<TSchema extends v.GenericSchema>(schema: TSchema) {
  return v.optional(v.fallback(schema, undefined))
}

export const userRoleSchema = v.picklist(['user', 'admin', 'employee'] as const)
export type UserRole = v.InferOutput<typeof userRoleSchema>

export const userProfileSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  displayName: v.pipe(v.string(), v.minLength(1), v.maxLength(80)),
  role: userRoleSchema,
  isPrimaryAdmin: v.optional(v.boolean()),
  createdAt: v.string(),
})
export type UserProfile = v.InferOutput<typeof userProfileSchema>

export const salonSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
  address: v.pipe(v.string(), v.minLength(1), v.maxLength(240)),
  phone: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
  email: v.pipe(v.string(), v.email()),
  timezone: v.pipe(v.string(), v.minLength(1), v.maxLength(64)),
  vatId: v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(40))),
})
export type Salon = v.InferOutput<typeof salonSchema>

/** Fields an admin may edit; the timezone drives slot math and stays fixed. */
export const salonDetailsSchema = v.omit(salonSchema, ['timezone'])
export type SalonDetails = v.InferOutput<typeof salonDetailsSchema>

export const confirmationModeSchema = v.picklist(['AUTOMATIC', 'MANUAL'] as const)
export type ConfirmationMode = v.InferOutput<typeof confirmationModeSchema>

export const bookingSettingsSchema = v.object({
  confirmationMode: confirmationModeSchema,
  slotIntervalMinutes: v.pipe(v.number(), v.integer(), v.minValue(5), v.maxValue(60)),
  minAdvanceBookingMinutes: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(10080)),
  maxAdvanceBookingDays: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(365)),
  pendingExpirationHours: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(168)),
})
export type BookingSettings = v.InferOutput<typeof bookingSettingsSchema>

export const serviceSchema = v.object({
  nameDe: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
  nameIt: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
  descriptionDe: v.pipe(v.string(), v.maxLength(1000)),
  descriptionIt: v.pipe(v.string(), v.maxLength(1000)),
  categoryDe: v.optional(v.pipe(v.string(), v.maxLength(80))),
  categoryIt: v.optional(v.pipe(v.string(), v.maxLength(80))),
  durationMinutes: v.pipe(v.number(), v.integer(), v.minValue(5), v.maxValue(480)),
  durationMaxMinutes: v.optional(v.pipe(v.number(), v.integer(), v.minValue(5), v.maxValue(480))),
  priceCents: v.pipe(v.number(), v.integer(), v.minValue(0)),
  priceMaxCents: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
  /** When non-empty, only these employee UIDs can perform the service. Empty/omitted = any employee. */
  allowedEmployeeIds: v.optional(v.array(v.pipe(v.string(), v.minLength(1)))),
  active: v.boolean(),
  /** Lower values appear first in booking, price list, and admin. */
  sortOrder: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(9999)),
  createdAt: v.string(),
  updatedAt: v.string(),
})
export type Service = v.InferOutput<typeof serviceSchema>

export const reservationStatusSchema = v.picklist([
  'PENDING',
  'CONFIRMED',
  'DECLINED',
  'EXPIRED',
  'CANCELLED',
  'COMPLETED',
] as const)
export type ReservationStatus = v.InferOutput<typeof reservationStatusSchema>

export const reservationSourceSchema = v.picklist(['ONLINE', 'MANUAL'] as const)
export type ReservationSource = v.InferOutput<typeof reservationSourceSchema>

export const reservationSchema = v.object({
  firstName: v.pipe(v.string(), v.minLength(1), v.maxLength(80)),
  lastName: v.pipe(v.string(), v.minLength(1), v.maxLength(80)),
  phone: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
  email: v.nullable(v.pipe(v.string(), v.email())),
  notes: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(1000)))),
  serviceId: v.pipe(v.string(), v.minLength(1)),
  serviceIds: v.optional(v.array(v.pipe(v.string(), v.minLength(1)))),
  serviceName: v.pipe(v.string(), v.minLength(1)),
  durationMinutes: v.pipe(v.number(), v.integer(), v.minValue(5)),
  priceCents: v.pipe(v.number(), v.integer(), v.minValue(0)),
  startAt: v.string(),
  endAt: v.string(),
  status: reservationStatusSchema,
  source: reservationSourceSchema,
  managementTokenHash: v.pipe(v.string(), v.minLength(1)),
  internalNote: v.nullable(v.pipe(v.string(), v.maxLength(2000))),
  googleCalendarEventId: v.optional(v.nullable(v.string())),
  employeeId: v.optional(v.nullable(v.string())),
  employeeName: v.optional(v.nullable(v.string())),
  idempotencyKey: v.nullable(v.pipe(v.string(), v.minLength(1), v.maxLength(128))),
  createdAt: v.string(),
  updatedAt: v.string(),
})
export type Reservation = v.InferOutput<typeof reservationSchema>

export const timeIntervalSchema = v.object({
  start: v.pipe(v.string(), v.regex(/^\d{2}:\d{2}$/)),
  end: v.pipe(v.string(), v.regex(/^\d{2}:\d{2}$/)),
})
export type TimeInterval = v.InferOutput<typeof timeIntervalSchema>

export const weekdaySchema = v.picklist([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const)
export type Weekday = v.InferOutput<typeof weekdaySchema>

export const openingHoursSchema = v.object({
  intervals: v.array(timeIntervalSchema),
})
export type OpeningHours = v.InferOutput<typeof openingHoursSchema>

export const holidaySchema = v.object({
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
  startDate: v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/)),
  endDate: v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/)),
})
export type Holiday = v.InferOutput<typeof holidaySchema>

export const dayExceptionSchema = v.object({
  date: v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/)),
  intervals: v.array(timeIntervalSchema),
  closed: v.boolean(),
})
export type DayException = v.InferOutput<typeof dayExceptionSchema>

export const blockedSlotSchema = v.object({
  startAt: v.string(),
  endAt: v.string(),
  reason: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(500)))),
  createdAt: v.string(),
  source: v.optional(v.picklist(['MANUAL', 'GOOGLE_CALENDAR'] as const)),
  employeeId: v.optional(v.nullable(v.string())),
  googleEventId: v.optional(v.string()),
  title: v.optional(v.string()),
  allDay: v.optional(v.boolean()),
  updatedAt: v.optional(v.string()),
})
export type BlockedSlot = v.InferOutput<typeof blockedSlotSchema>

export const homepageImageSchema = v.object({
  id: v.pipe(v.string(), v.minLength(1), v.maxLength(80)),
  src: v.pipe(v.string(), v.minLength(1), v.maxLength(2000)),
  altDe: v.pipe(v.string(), v.maxLength(200)),
  altIt: v.pipe(v.string(), v.maxLength(200)),
})
export type HomepageImage = v.InferOutput<typeof homepageImageSchema>

export const homepageCustomSectionSchema = v.object({
  id: v.pipe(v.string(), v.minLength(1), v.maxLength(80)),
  titleDe: v.pipe(v.string(), v.minLength(1), v.maxLength(160)),
  titleIt: v.pipe(v.string(), v.minLength(1), v.maxLength(160)),
  bodyDe: v.pipe(v.string(), v.maxLength(2000)),
  bodyIt: v.pipe(v.string(), v.maxLength(2000)),
  imageUrl: v.optional(v.pipe(v.string(), v.maxLength(2000))),
})
export type HomepageCustomSection = v.InferOutput<typeof homepageCustomSectionSchema>

export const homepageBuiltinSectionKeySchema = v.picklist([
  'hero',
  'services',
  'styles',
  'stylists',
  'visit',
] as const)
export type HomepageBuiltinSectionKey = v.InferOutput<typeof homepageBuiltinSectionKeySchema>

export const homepageConfigSchema = v.object({
  hiddenSections: v.array(homepageBuiltinSectionKeySchema),
  galleryImages: v.optional(v.array(homepageImageSchema)),
  customSections: v.array(homepageCustomSectionSchema),
})
export type HomepageConfig = v.InferOutput<typeof homepageConfigSchema>

export const employeeSchema = v.object({
  firstName: v.pipe(v.string(), v.minLength(1), v.maxLength(80)),
  lastName: v.pipe(v.string(), v.minLength(1), v.maxLength(80)),
  displayName: v.pipe(v.string(), v.minLength(1), v.maxLength(80)),
  email: v.pipe(v.string(), v.email()),
  photoUrl: v.optional(v.nullable(v.string())),
  active: v.boolean(),
  authDisabled: v.boolean(),
  serviceIds: v.array(v.pipe(v.string(), v.minLength(1))),
  createdAt: v.string(),
  updatedAt: v.string(),
  removedAt: v.optional(v.nullable(v.string())),
})
export type Employee = v.InferOutput<typeof employeeSchema>

export const activityActionSchema = v.picklist([
  'page_view',
  'reservation_created',
  'reservation_viewed',
  'reservation_cancelled',
  'reservation_rescheduled',
  'admin_login',
  'admin_login_failed',
  'admin_logout',
  'admin_reservation_created',
  'admin_reservation_confirmed',
  'admin_reservation_declined',
  'admin_reservation_cancelled',
  'admin_reservation_updated',
  'admin_reservation_completed',
  'admin_demo_mode_toggled',
  'admin_staff_created',
] as const)
export type ActivityAction = v.InferOutput<typeof activityActionSchema>

export const activitySourceSchema = v.picklist(['client', 'server'] as const)
export type ActivitySource = v.InferOutput<typeof activitySourceSchema>

export const activityActorTypeSchema = v.picklist([
  'anonymous',
  'user',
  'admin',
  'operator',
] as const)
export type ActivityActorType = v.InferOutput<typeof activityActorTypeSchema>

export const activityDetailValueSchema = v.nullable(v.union([v.string(), v.number(), v.boolean()]))

export const activityLogSchema = v.object({
  createdAt: v.string(),
  action: activityActionSchema,
  source: activitySourceSchema,
  ip: v.string(),
  userAgent: v.string(),
  browser: v.string(),
  path: v.nullable(v.string()),
  sessionId: v.nullable(v.string()),
  actorType: activityActorTypeSchema,
  actorUid: v.nullable(v.string()),
  actorEmail: v.nullable(v.string()),
  details: v.nullable(v.record(v.string(), activityDetailValueSchema)),
})
export type ActivityLog = v.InferOutput<typeof activityLogSchema>
