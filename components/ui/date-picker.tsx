'use client'

import { useEffect, useRef, useState } from 'react'
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  id?: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateLabel(value: string) {
  return parseDate(value).toLocaleDateString('en-US', {
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
}: DatePickerProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)
  const [monthCursor, setMonthCursor] = useState(() => parseDate(value))

  useEffect(() => {
    if (!open) {
      setMonthCursor(parseDate(value))
    }
  }, [open, value])

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const selectedDate = parseDate(value)
  const today = new Date()
  const days = getCalendarDays(monthCursor)

  function handleSelect(date: Date) {
    onChange(formatDateValue(date))
    setOpen(false)
  }

  function moveMonth(offset: number) {
    setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1))
  }

  return (
    <div ref={rootRef} className={cn('date-picker', className)}>
      <button
        id={id}
        type="button"
        className="date-picker-trigger"
        data-open={open ? 'true' : 'false'}
        onClick={() => setOpen((current) => !current)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <CalendarDaysIcon className="date-picker-trigger-icon" />
        <span className="date-picker-trigger-value">{formatDateLabel(value)}</span>
      </button>

      {open && (
        <div className="date-picker-panel" role="dialog" aria-label="Choose date">
          <div className="date-picker-header">
            <button
              type="button"
              className="date-picker-nav"
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
              className="date-picker-nav"
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
              const isSelected = isSameDay(date, selectedDate)
              const isToday = isSameDay(date, today)

              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  className="date-picker-day"
                  data-outside={isOutsideMonth ? 'true' : 'false'}
                  data-selected={isSelected ? 'true' : 'false'}
                  data-today={isToday ? 'true' : 'false'}
                  onClick={() => handleSelect(date)}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
