import type * as React from 'react'

import type { BlockedSlotWithId } from '../data/blockedSlots'
import type { ReservationStatus } from '../data/schemas'
import {
  formatBookedTime,
  hhmmOfMinute,
  type PlannerBlockedEntry,
  type PlannerDay,
  type PlannerEntry,
  type WeekPlan,
} from '../data/weekPlanner'
import { useLocale } from '../i18n'
import type { MessageKey } from '../i18n'
import {
  BlockedEntry,
  DayColumn,
  DayHeader,
  Entry,
  GutterHeader,
  HourGutter,
  Legend,
  NowLine,
  OpenBand,
  PlannerGrid,
  PlannerScroller,
  pixelsPerMinute,
} from './WeekPlanner.styles'

export type WeekPlannerProps = {
  plan: WeekPlan
  onSelectReservation: (reservationId: string, anchorEl: HTMLElement) => void
  onSelectBlockedSlot?: (slot: BlockedSlotWithId) => void
}

const entryClass: Partial<Record<ReservationStatus, string>> = {
  CONFIRMED: 'is-confirmed',
  PENDING: 'is-pending',
  COMPLETED: 'is-completed',
}

const compactEntryHeight = 44
const detailedEntryHeight = 60

function dateAt(dateYmd: string): Date {
  return new Date(`${dateYmd}T12:00:00.000Z`)
}

type PlannerEntryButtonProps = {
  entry: PlannerEntry
  gridStartMinute: number
  onSelect: (reservationId: string, anchorEl: HTMLElement) => void
}

const PlannerEntryButton: React.FunctionComponent<PlannerEntryButtonProps> = ({
  entry,
  gridStartMinute,
  onSelect,
}) => {
  const { t } = useLocale()
  const { reservation } = entry
  const time = `${hhmmOfMinute(entry.startMinute)}–${hhmmOfMinute(entry.endMinute)}`
  const name = `${reservation.firstName} ${reservation.lastName}`
  const serviceLabel = reservation.employeeName
    ? `${reservation.serviceName} · ${reservation.employeeName}`
    : reservation.serviceName
  const status = t(`status.${reservation.status}` as MessageKey)
  const height = Math.max((entry.endMinute - entry.startMinute) * pixelsPerMinute - 2, 22)
  const widthShare = 100 / entry.laneCount

  return (
    <Entry
      type="button"
      className={entryClass[reservation.status]}
      aria-label={`${time}, ${name}, ${serviceLabel}, ${status}`}
      title={`${time}\n${name}\n${serviceLabel}\n${status}`}
      style={{
        top: (entry.startMinute - gridStartMinute) * pixelsPerMinute + 1,
        height,
        left: `calc(${entry.lane * widthShare}% + 2px)`,
        width: `calc(${widthShare}% - 4px)`,
        flexDirection: height < compactEntryHeight ? 'row' : 'column',
        alignItems: height < compactEntryHeight ? 'center' : 'flex-start',
        gap: height < compactEntryHeight ? 6 : 1,
      }}
      onClick={(event) => {
        onSelect(reservation.id, event.currentTarget)
      }}
    >
      <span className="entry-time">{hhmmOfMinute(entry.startMinute)}</span>
      <span className="entry-name">{name}</span>
      {height >= detailedEntryHeight ? <span className="entry-service">{serviceLabel}</span> : null}
    </Entry>
  )
}

type PlannerDayColumnProps = {
  day: PlannerDay
  gridStartMinute: number
  gridEndMinute: number
  nowMinute: number | null
  onSelectReservation: (reservationId: string, anchorEl: HTMLElement) => void
  onSelectBlockedSlot?: (slot: BlockedSlotWithId) => void
}

const PlannerBlockedBlock: React.FunctionComponent<{
  entry: PlannerBlockedEntry
  gridStartMinute: number
  gridEndMinute: number
  onSelect?: (slot: BlockedSlotWithId) => void
}> = ({ entry, gridStartMinute, gridEndMinute, onSelect }) => {
  const { t } = useLocale()
  const clampedStart = Math.max(entry.startMinute, gridStartMinute)
  const clampedEnd = Math.min(entry.endMinute, gridEndMinute)
  if (clampedEnd <= clampedStart) return null
  const height = Math.max((clampedEnd - clampedStart) * pixelsPerMinute - 2, 20)
  const isPrivate = Boolean(entry.block.isPrivate)
  const label = entry.block.redacted
    ? t('admin.googleCalendarPrivateLabel')
    : entry.block.title || entry.block.reason || t('admin.googleCalendarEventFallback')
  const time = `${hhmmOfMinute(entry.startMinute)}–${hhmmOfMinute(entry.endMinute)}`
  return (
    <BlockedEntry
      type="button"
      className={isPrivate ? 'is-private' : undefined}
      aria-label={`${time}, ${label}`}
      title={`${time}\n${label}`}
      style={{
        top: (clampedStart - gridStartMinute) * pixelsPerMinute + 1,
        height,
      }}
      onClick={() => {
        onSelect?.(entry.block)
      }}
    >
      <span className="entry-time">{hhmmOfMinute(clampedStart)}</span>
      <span className="entry-name">{label}</span>
    </BlockedEntry>
  )
}

const PlannerDayColumn: React.FunctionComponent<PlannerDayColumnProps> = ({
  day,
  gridStartMinute,
  gridEndMinute,
  nowMinute,
  onSelectReservation,
  onSelectBlockedSlot,
}) => (
  <DayColumn data-date={day.dateYmd}>
    {day.openIntervals.map((interval) => (
      <OpenBand
        key={interval.startMinute}
        style={{
          top: (interval.startMinute - gridStartMinute) * pixelsPerMinute,
          height: (interval.endMinute - interval.startMinute) * pixelsPerMinute,
        }}
      />
    ))}
    {day.blockedEntries.map((entry) => (
      <PlannerBlockedBlock
        key={entry.block.id}
        entry={entry}
        gridStartMinute={gridStartMinute}
        gridEndMinute={gridEndMinute}
        onSelect={onSelectBlockedSlot}
      />
    ))}
    {day.entries.map((entry) => (
      <PlannerEntryButton
        key={entry.reservation.id}
        entry={entry}
        gridStartMinute={gridStartMinute}
        onSelect={onSelectReservation}
      />
    ))}
    {day.isToday && nowMinute !== null ? (
      <NowLine aria-hidden style={{ top: (nowMinute - gridStartMinute) * pixelsPerMinute }} />
    ) : null}
  </DayColumn>
)

export const WeekPlanner: React.FunctionComponent<WeekPlannerProps> = ({
  plan,
  onSelectReservation,
  onSelectBlockedSlot,
}) => {
  const { t, intlLocale } = useLocale()
  const gridStartMinute = plan.firstHour * 60
  const gridEndMinute = plan.lastHour * 60
  const bodyHeight = (gridEndMinute - gridStartMinute) * pixelsPerMinute
  const hours = Array.from(
    { length: plan.lastHour - plan.firstHour },
    (_, index) => plan.firstHour + index,
  )
  const nowMinute =
    plan.nowMinute !== null && plan.nowMinute >= gridStartMinute && plan.nowMinute <= gridEndMinute
      ? plan.nowMinute
      : null

  const weekdayFormat = new Intl.DateTimeFormat(intlLocale, { weekday: 'short', timeZone: 'UTC' })
  const dayNumberFormat = new Intl.DateTimeFormat(intlLocale, { day: 'numeric', timeZone: 'UTC' })
  const longDateFormat = new Intl.DateTimeFormat(intlLocale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })

  const dayTotal = (day: PlannerDay): string => {
    if (day.count === 0) {
      return day.openIntervals.length === 0 ? t('admin.closed') : t('admin.plannerDayFree')
    }
    const count =
      day.count === 1 ? t('admin.plannerCountOne') : t('admin.plannerCount', { count: day.count })
    return `${count}, ${formatBookedTime(day.bookedMinutes)}`
  }

  return (
    <div>
      <PlannerScroller>
        <PlannerGrid>
          <GutterHeader />
          {plan.days.map((day) => {
            const classes = [
              day.isToday ? 'is-today' : '',
              day.openIntervals.length === 0 ? 'is-closed' : '',
            ]
            return (
              <DayHeader
                key={day.dateYmd}
                className={classes.filter(Boolean).join(' ')}
                aria-label={longDateFormat.format(dateAt(day.dateYmd))}
                aria-current={day.isToday ? 'date' : undefined}
              >
                <span className="day-name">
                  <span className="day-number">{dayNumberFormat.format(dateAt(day.dateYmd))}</span>
                  {weekdayFormat.format(dateAt(day.dateYmd))}
                </span>
                <span className="day-total">{dayTotal(day)}</span>
              </DayHeader>
            )
          })}

          <HourGutter style={{ height: bodyHeight }} aria-hidden>
            {hours.map((hour) => (
              <span key={hour} style={{ top: (hour * 60 - gridStartMinute) * pixelsPerMinute }}>
                {hhmmOfMinute(hour * 60)}
              </span>
            ))}
          </HourGutter>
          {plan.days.map((day) => (
            <PlannerDayColumn
              key={day.dateYmd}
              day={day}
              gridStartMinute={gridStartMinute}
              gridEndMinute={gridEndMinute}
              nowMinute={day.isToday ? nowMinute : null}
              onSelectReservation={onSelectReservation}
              onSelectBlockedSlot={onSelectBlockedSlot}
            />
          ))}
        </PlannerGrid>
      </PlannerScroller>

      <Legend aria-label={t('admin.plannerLegend')}>
        <li>
          <span className="swatch is-confirmed" />
          {t('status.CONFIRMED')}
        </li>
        <li>
          <span className="swatch is-pending" />
          {t('status.PENDING')}
        </li>
        <li>
          <span className="swatch is-completed" />
          {t('status.COMPLETED')}
        </li>
        <li>
          <span className="swatch is-blocked" />
          {t('admin.googleCalendarLegend')}
        </li>
        <li>
          <span className="swatch is-closed" />
          {t('admin.closed')}
        </li>
      </Legend>
    </div>
  )
}
