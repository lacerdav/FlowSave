'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export interface ChartPoint {
  label: string
  received: number
  scheduled: number
  gap: number
}

interface CashFlowChartProps {
  points: ChartPoint[]
  currency?: string
}

type ChartMode = 'bars' | 'lines'

interface TooltipEntry {
  dataKey: 'received' | 'scheduled' | 'gap'
  value: number
  color: string
}

interface TooltipProps {
  active?: boolean
  label?: string
  payload?: TooltipEntry[]
  currency?: string
}

const SERIES_META = {
  received: {
    label: 'Received',
    color: '#22d87a',
    glow: '0 0 22px rgba(34, 216, 122, 0.22)',
  },
  scheduled: {
    label: 'Scheduled',
    color: '#7c96ff',
    glow: '0 0 22px rgba(124, 150, 255, 0.22)',
  },
  gap: {
    label: 'Gap',
    color: '#ff5b7f',
    glow: '0 0 22px rgba(255, 91, 127, 0.20)',
  },
} as const

function CustomTooltip({
  active,
  payload,
  label,
  currency = 'USD',
}: TooltipProps) {
  if (!active || !payload?.length) return null

  const visibleItems = payload.filter((item) => item.value > 0)

  if (visibleItems.length === 0) return null

  return (
    <div
      style={{
        minWidth: 156,
        borderRadius: 12,
        border: '1px solid var(--border-strong)',
        background: 'rgba(8, 11, 27, 0.96)',
        padding: '10px 12px',
        boxShadow: '0 18px 34px rgba(2, 6, 19, 0.28)',
      }}
    >
      <div
        style={{
          marginBottom: 6,
          fontSize: 10.5,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text3)',
        }}
      >
        {label}
      </div>

      <div className="space-y-2">
        {visibleItems.map((item) => {
          const meta = SERIES_META[item.dataKey]
          return (
            <div key={item.dataKey} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: meta.color, boxShadow: meta.glow }}
                />
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>{meta.label}</span>
              </div>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: meta.color }}>
                {formatCurrency(item.value, currency)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LegendPill({
  tone,
  label,
}: {
  tone: keyof typeof SERIES_META
  label: string
}) {
  const meta = SERIES_META[tone]

  return (
    <span className="chart-legend-pill" style={{ color: meta.color }}>
      <span
        aria-hidden
        className="chart-legend-pill__dot"
        style={{ background: meta.color, boxShadow: meta.glow }}
      />
      {label}
    </span>
  )
}

export function CashFlowChart({ points, currency = 'USD' }: CashFlowChartProps) {
  const [mode, setMode] = useState<ChartMode>('bars')
  const isEmpty = points.every((point) => point.received === 0 && point.scheduled === 0 && point.gap === 0)

  return (
    <div
      className="panel-surface card-interactive rounded-xl p-4 relative overflow-hidden"
      style={{ border: '1px solid var(--border)' }}
    >
      <div className="dashboard-card-glow" aria-hidden />

      <div className="relative flex flex-col gap-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <p className="metric-card__label">Cash Flow</p>
            <h2 className="dashboard-card-title">Cash flow by month</h2>
            <p className="dashboard-card-copy">Green received, blue scheduled, red gap.</p>
          </div>

          <div className="flex flex-col items-start gap-2 lg:items-end">
            <div className="segmented-toggle" aria-label="Chart visualization mode">
              <button
                type="button"
                className="segmented-toggle__button"
                data-active={mode === 'bars'}
                onClick={() => setMode('bars')}
              >
                Bars
              </button>
              <button
                type="button"
                className="segmented-toggle__button"
                data-active={mode === 'lines'}
                onClick={() => setMode('lines')}
              >
                Lines
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <LegendPill tone="received" label="Received" />
              <LegendPill tone="scheduled" label="Scheduled" />
              <LegendPill tone="gap" label="Gap" />
            </div>
          </div>
        </div>

        {isEmpty ? (
          <div
            className="flex min-h-[220px] flex-col items-center justify-center gap-2 text-center"
            style={{ color: 'var(--text2)' }}
          >
            <p className="text-[13px]">No cash-flow data yet</p>
            <p className="text-[11px]" style={{ color: 'var(--text3)' }}>
              Add a monthly target or schedule payments to reveal upcoming gaps.
            </p>
          </div>
        ) : (
          <div className="relative">
            <ResponsiveContainer width="100%" height={308}>
              <ComposedChart data={points} margin={{ top: 6, right: 2, left: 0, bottom: 0 }}>
                <defs>
                  <filter id="chartGlowGreen" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="rgba(34,216,122,0.38)" />
                  </filter>
                  <filter id="chartGlowBlue" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="rgba(124,150,255,0.42)" />
                  </filter>
                  <filter id="chartGlowRed" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="rgba(255,91,127,0.38)" />
                  </filter>
                </defs>

                <CartesianGrid
                  vertical={false}
                  stroke="rgba(240,240,255,0.06)"
                  strokeDasharray="4 8"
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(240,240,255,0.42)', fontSize: 11 }}
                />
                <YAxis
                  hide
                  domain={[0, 'dataMax + 200']}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.025)' }}
                  content={<CustomTooltip currency={currency} />}
                />

                {mode === 'bars' ? (
                  <>
                    <Bar
                      dataKey="received"
                      stackId="cash-flow"
                      radius={[6, 6, 0, 0]}
                      fill={SERIES_META.received.color}
                      stroke={SERIES_META.received.color}
                      filter="url(#chartGlowGreen)"
                    />
                    <Bar
                      dataKey="scheduled"
                      stackId="cash-flow"
                      radius={[6, 6, 0, 0]}
                      fill={SERIES_META.scheduled.color}
                      stroke={SERIES_META.scheduled.color}
                      filter="url(#chartGlowBlue)"
                    />
                    <Bar
                      dataKey="gap"
                      stackId="cash-flow"
                      radius={[6, 6, 0, 0]}
                      fill={SERIES_META.gap.color}
                      stroke={SERIES_META.gap.color}
                      filter="url(#chartGlowRed)"
                    />
                  </>
                ) : (
                  <>
                    <Line
                      type="monotone"
                      dataKey="received"
                      stroke={SERIES_META.received.color}
                      strokeWidth={2.5}
                      dot={{ r: 3.5, fill: SERIES_META.received.color, strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: SERIES_META.received.color, strokeWidth: 0 }}
                      filter="url(#chartGlowGreen)"
                    />
                    <Line
                      type="monotone"
                      dataKey="scheduled"
                      stroke={SERIES_META.scheduled.color}
                      strokeWidth={2.5}
                      dot={{ r: 3.5, fill: SERIES_META.scheduled.color, strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: SERIES_META.scheduled.color, strokeWidth: 0 }}
                      filter="url(#chartGlowBlue)"
                    />
                    <Line
                      type="monotone"
                      dataKey="gap"
                      stroke={SERIES_META.gap.color}
                      strokeWidth={2.5}
                      dot={{ r: 3.5, fill: SERIES_META.gap.color, strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: SERIES_META.gap.color, strokeWidth: 0 }}
                      filter="url(#chartGlowRed)"
                    />
                  </>
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
