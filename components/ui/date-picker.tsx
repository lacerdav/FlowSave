'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { calcFloatPos } from '@/lib/floating'
import type { FloatStyle } from '@/lib/floating'

// Approximate panel dimensions for collision detection.
// Panel CSS: width min(20rem,100vw-2rem) and ~340px tall (header + weekdays + 6-row grid + padding).
const PANEL_HEIGHT = 344
const PANEL_WIDTH  = 320

interface DatePickerProps {
  id?: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
  triggerClassName?: string
}

function parseDate(value: string): Date | null {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return isNaN(d.getTime()) ? null : d
}

function formatDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateLabel(value: string): string {
  const d = parseDate(value)
  if (!d) return 'Pick a date'
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function getCalendarDays(monthCursor: Date) {
  const firstDay = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1)
  const startOffset = firstDay.getDay()
  const gridStart = new Date(firstDay)
  gridStart.setDate(firstDay.getDate() - startOffset)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)
    return date
  })
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function DatePicker({
  id,
  value,
  onChange,
  disabled,
  className,
  triggerClassName,
}: DatePickerProps) {
  const rootRef  = useRef<HTMLDivElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [panelStyle, setPanelStyle] = useState<FloatStyle>({ position: 'fixed' })
  const [openUpward, setOpenUpward] = useState(false)
  const [monthCursor, setMonthCursor] = useState(() => parseDate(value) ?? new Date())

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!open) {
      setMonthCursor(parseDate(value) ?? new Date())
    }
  }, [open, value])

  const recalcPos = useCallback(() => {
    if (!rootRef.current) return
    const trigger = rootRef.current.getBoundingClientRect()
    const panelW = Math.min(PANEL_WIDTH, window.innerWidth - 32)
    const { style, openUpward: up } = calcFloatPos(trigger, PANEL_HEIGHT, panelW, 'left')
    setPanelStyle(style)
    setOpenUpward(up)
  }, [])

  useEffect(() => {
    if (!open) return

    recalcPos()

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node
      if (
        !rootRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    // Close + reposition on scroll/resize to avoid stale coordinates
    function handleScroll() { setOpen(false) }
    function handleResize() { recalcPos() }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleResize)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleResize)
    }
  }, [open, recalcPos])

  const selectedDate = parseDate(value)
  const today = new Date()
  const days = getCalendarDays(monthCursor)

  function isSelected(date: Date) {
    return selectedDate != null && isSameDay(date, selectedDate)
  }

  function handleSelect(date: Date) {
    onChange(formatDateValue(date))
    setOpen(false)
  }

  function moveMonth(offset: number) {
    setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1))
  }

  const panel = open ? (
    <div
      ref={panelRef}
      className="date-picker-panel-portal"
      role="dialog"
      aria-label="Choose date"
      style={panelStyle}
      // Animate direction matches resolved open direction
      data-open-upward={openUpward ? 'true' : 'false'}
    >
      <div className="date-picker-header">
        <button
          type="button"
          className="date-picker-nav interactive"
          onClick={() => moveMonth(-1)}
          aria-label="Previous month"
        >
          <ChevronLeftIcon className="size-4" />
        </button>
        <p className="date-picker-month">
          {monthCursor.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          })}
        </p>
        <button
          type="button"
          className="date-picker-nav interactive"
          onClick={() => moveMonth(1)}
          aria-label="Next month"
        >
          <ChevronRightIcon className="size-4" />
        </button>
      </div>

      <div className="date-picker-weekdays">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="date-picker-weekday">
            {label}
          </span>
        ))}
      </div>

      <div className="date-picker-grid">
        {days.map((date) => {
          const isOutsideMonth = date.getMonth() !== monthCursor.getMonth()
          const isDaySelected = isSelected(date)
          const isToday = isSameDay(date, today)

          return (
            <button
              key={date.toISOString()}
              type="button"
              className="date-picker-day interactive"
              data-outside={isOutsideMonth ? 'true' : 'false'}
              data-selected={isDaySelected ? 'true' : 'false'}
              data-today={isToday ? 'true' : 'false'}
              onClick={() => handleSelect(date)}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  ) : null

  return (
    <div ref={rootRef} className={cn('date-picker', className)}>
      <button
        id={id}
        type="button"
        className={cn('date-picker-trigger interactive', triggerClassName)}
        data-open={open ? 'true' : 'false'}
        onClick={() => setOpen((current) => !current)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <CalendarDaysIcon className="date-picker-trigger-icon" />
        <span className="date-picker-trigger-value">{formatDateLabel(value)}</span>
      </button>

      {mounted ? createPortal(panel, document.body) : null}
    </div>
  )
}
