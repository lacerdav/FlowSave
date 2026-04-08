/**
 * Shared viewport-aware positioning for portal-rendered overlays.
 * Used by DatePicker, ActionMenu, and any similar floating surfaces.
 */

const GAP = 8 // px between trigger and panel edge
const EDGE_MARGIN = 8 // minimum distance from viewport edges

export interface FloatStyle {
  position: 'fixed'
  top?: number
  bottom?: number
  left?: number
  right?: number
}

export interface FloatResult {
  style: FloatStyle
  openUpward: boolean
}

/**
 * Given the trigger's bounding rect and the panel's estimated dimensions,
 * return a fixed-position style that stays fully within the viewport.
 *
 * @param triggerRect  DOMRect from getBoundingClientRect() on the trigger
 * @param panelHeight  Estimated panel height in pixels
 * @param panelWidth   Estimated panel width in pixels
 * @param align        'right' → panel right edge aligns to trigger right edge (default)
 *                     'left'  → panel left edge aligns to trigger left edge
 */
export function calcFloatPos(
  triggerRect: DOMRect,
  panelHeight: number,
  panelWidth: number,
  align: 'left' | 'right' = 'right',
): FloatResult {
  const vw = window.innerWidth
  const vh = window.innerHeight

  // ── Vertical direction ───────────────────────────────────────────────────
  const spaceBelow = vh - triggerRect.bottom - GAP
  const spaceAbove = triggerRect.top - GAP
  // Open upward if there is not enough space below AND there is more space above
  const openUpward = spaceBelow < panelHeight && spaceAbove > spaceBelow

  let top: number | undefined
  let bottom: number | undefined

  if (openUpward) {
    bottom = vh - triggerRect.top + GAP
    // Clamp: panel must not extend above the top of the viewport
    const topEdge = vh - bottom - panelHeight
    if (topEdge < EDGE_MARGIN) {
      bottom = Math.min(bottom, vh - panelHeight - EDGE_MARGIN)
    }
  } else {
    top = triggerRect.bottom + GAP
    // Clamp: panel must not extend below the bottom of the viewport
    if (top + panelHeight > vh - EDGE_MARGIN) {
      top = Math.max(EDGE_MARGIN, vh - panelHeight - EDGE_MARGIN)
    }
  }

  // ── Horizontal alignment ─────────────────────────────────────────────────
  let left: number | undefined
  let right: number | undefined

  if (align === 'right') {
    // Panel right edge flush with trigger right edge
    right = vw - triggerRect.right
    // Clamp: panel must not overflow the left edge of the viewport
    const panelLeft = vw - right - panelWidth
    if (panelLeft < EDGE_MARGIN) {
      right = Math.max(EDGE_MARGIN, vw - panelWidth - EDGE_MARGIN)
    }
  } else {
    // Panel left edge flush with trigger left edge
    left = triggerRect.left
    // Clamp: panel must not overflow the right edge of the viewport
    if (left + panelWidth > vw - EDGE_MARGIN) {
      left = Math.max(EDGE_MARGIN, vw - panelWidth - EDGE_MARGIN)
    }
    // Also clamp left edge
    if (left < EDGE_MARGIN) left = EDGE_MARGIN
  }

  return {
    openUpward,
    style: {
      position: 'fixed',
      ...(top !== undefined ? { top } : {}),
      ...(bottom !== undefined ? { bottom } : {}),
      ...(left !== undefined ? { left } : {}),
      ...(right !== undefined ? { right } : {}),
    },
  }
}
