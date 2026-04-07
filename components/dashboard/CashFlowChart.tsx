'use client'

import { formatCurrency } from '@/lib/utils'
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from 'recharts'

export interface ChartBar {
  label: string
  amount: number
  type: 'historical' | 'current' | 'forecast-healthy' | 'forecast-lean'
}

interface CashFlowChartProps {
  bars: ChartBar[]
  averageLine: number
}

function barFill(type: ChartBar['type']): string {
  switch (type) {
    case 'historical':       return 'rgba(91,127,255,0.15)'
    case 'current':          return '#5b7fff'
    case 'forecast-healthy': return 'rgba(91,127,255,0.55)'
    case 'forecast-lean':    return '#f5a623'
  }
}

function barStroke(type: ChartBar['type']): string {
  switch (type) {
    case 'historical':       return 'rgba(91,127,255,0.30)'
    case 'current':          return '#5b7fff'
    case 'forecast-healthy': return 'rgba(91,127,255,0.70)'
    case 'forecast-lean':    return '#f5a623'
  }
}

interface TooltipPayloadItem {
  value: number
  payload: ChartBar
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const bar = payload[0].payload
  const isForecast = bar.type === 'forecast-healthy' || bar.type === 'forecast-lean'
  return (
    <div
      style={{
        background: 'rgba(8, 11, 27, 0.96)',
        border: '1px solid var(--border-strong)',
        borderRadius: 10,
        padding: '10px 14px',
        fontSize: 12,
        color: 'var(--text)',
        boxShadow: 'none',
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text3)',
          marginBottom: 4,
        }}
      >
        {label}
        {isForecast && (
          <span style={{ marginLeft: 6, color: 'var(--accent2)' }}>est.</span>
        )}
      </div>
      <div style={{ fontWeight: 600, fontSize: 14 }}>
        {formatCurrency(payload[0].value, 'USD')}
      </div>
      {bar.type === 'forecast-lean' && (
        <div style={{ marginTop: 3, fontSize: 10, color: 'var(--amber)' }}>
          Lean month
        </div>
      )}
    </div>
  )
}

export function CashFlowChart({ bars, averageLine }: CashFlowChartProps) {
  const isEmpty = bars.every(b => b.amount === 0)

  return (
    <div
      className="panel-surface card-interactive rounded-xl p-6 relative overflow-hidden"
      style={{
        border: '1px solid var(--border)',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          height: '50%',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(91,127,255,0.04) 0%, transparent 68%)',
          pointerEvents: 'none',
        }}
      />

      <div className="relative flex items-center justify-between mb-6">
        <div>
          <p className="card-label">Cash Flow</p>
          <p className="card-subtitle" style={{ marginTop: 4 }}>
            Six-month overview
          </p>
        </div>
        {averageLine > 0 && (
          <span
            className="flex items-center gap-1.5"
            style={{ fontSize: 11, color: 'var(--amber)' }}
          >
            <span
              aria-hidden
              style={{
                display: 'inline-block',
                width: 18,
                height: 0,
                borderTop: '1.5px dashed var(--amber)',
              }}
            />
            avg {formatCurrency(averageLine, 'USD')}
          </span>
        )}
      </div>

      {isEmpty ? (
        <div
          className="flex flex-col items-center justify-center gap-2"
          style={{ height: 240, color: 'var(--text2)', fontSize: 13 }}
        >
          <span>No data yet</span>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>
            Log payments to see your cash flow
          </span>
        </div>
      ) : (
        <div className="relative">
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={bars} barCategoryGap="28%" margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(240,240,255,0.30)', fontSize: 11 }}
              />
              <YAxis hide />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(255,255,255,0.025)', radius: 6 }}
              />
              <Bar dataKey="amount" radius={[5, 5, 0, 0]}>
                {bars.map((bar, i) => (
                  <Cell
                    key={i}
                    fill={barFill(bar.type)}
                    stroke={barStroke(bar.type)}
                    strokeWidth={1}
                  />
                ))}
              </Bar>
              {averageLine > 0 && (
                <ReferenceLine
                  y={averageLine}
                  stroke="var(--amber)"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
