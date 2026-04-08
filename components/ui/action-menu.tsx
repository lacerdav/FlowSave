'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, m, useReducedMotion } from 'framer-motion'
import { MoreHorizontal } from 'lucide-react'
import { calcFloatPos } from '@/lib/floating'
import type { FloatStyle } from '@/lib/floating'

// ActionMenu panels are narrow — max ~11rem wide, height depends on item count.
const PANEL_WIDTH = 176 // 11rem
const ITEM_HEIGHT = 36  // px per menu item
const PANEL_PADDING = 16 // vertical padding

export interface ActionMenuItem {
  label: string
  onSelect: () => void | Promise<void>
  tone?: 'default' | 'success' | 'warning' | 'danger'
  disabled?: boolean
}

interface Props {
  items: ActionMenuItem[]
  label: string
  triggerClassName?: string
  panelClassName?: string
}

const ease = [0.22, 1, 0.36, 1] as const

export function ActionMenu({
  items,
  label,
  triggerClassName,
  panelClassName,
}: Props) {
  const shouldReduceMotion = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [panelStyle, setPanelStyle] = useState<FloatStyle>({ position: 'fixed' })
  const [openUpward, setOpenUpward] = useState(false)
  const [mounted, setMounted] = useState(false)
  const rootRef  = useRef<HTMLDivElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const panelId = useId()

  useEffect(() => { setMounted(true) }, [])

  const estimatedPanelHeight = items.length * ITEM_HEIGHT + PANEL_PADDING

  const recalcPos = useCallback(() => {
    if (!rootRef.current) return
    const rect = rootRef.current.getBoundingClientRect()
    const { style, openUpward: up } = calcFloatPos(rect, estimatedPanelHeight, PANEL_WIDTH, 'right')
    setPanelStyle(style)
    setOpenUpward(up)
  }, [estimatedPanelHeight])

  useEffect(() => {
    if (!open) return

    recalcPos()

    function handlePointerDown(event: MouseEvent) {
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

    function handleScroll() { setOpen(false) }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', handleScroll, true)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [open, recalcPos])

  const panel = (
    <AnimatePresence initial={false}>
      {open ? (
        <m.div
          ref={panelRef}
          id={panelId}
          key="menu"
          role="menu"
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96, y: openUpward ? 6 : -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.97, y: openUpward ? 4 : -4 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.16, ease }}
          style={panelStyle}
          className={['action-menu-panel-portal', panelClassName].filter(Boolean).join(' ')}
        >
          {items.map(item => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              className="action-menu-item"
              data-tone={item.tone ?? 'default'}
              onClick={() => {
                if (item.disabled) return
                setOpen(false)
                item.onSelect()
              }}
            >
              {item.label}
            </button>
          ))}
        </m.div>
      ) : null}
    </AnimatePresence>
  )

  return (
    <div ref={rootRef} className="action-menu-root">
      <m.button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen(prev => !prev)}
        className={['action-menu-trigger', triggerClassName].filter(Boolean).join(' ')}
        whileHover={shouldReduceMotion ? undefined : { y: -1, scale: 1.03 }}
        whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.16, ease }}
      >
        <MoreHorizontal className="size-4" />
      </m.button>

      {mounted ? createPortal(panel, document.body) : null}
    </div>
  )
}
