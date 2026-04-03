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
  Line,
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
    case 'historical':        return 'rgba(91,127,255,0.15)'
    case 'current':           return '#5b7fff'
    case 'forecast-healthy':  return '#5b7fff'
    case 'forecast-lean':     return '#f5a623'
  }
}

function barStroke(type: ChartBar['type']): string {
  switch (type) {
    case 'historical':        return 'rgba(91,127,255,0.25)'
    case 'current':           return '#5b7fff'
    case 'forecast-healthy':  return '#5b7fff'
    case 'forecast-lean':     return '#f5a623'
  }
}

interface TooltipPayloadItem {
  value: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border-strong)',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
        color: 'var(--text)',
      }}
    >
      <div style={{ color: 'var(--text3)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 600 }}>
        {formatCurrency(payload[0].value, 'USD')}
      </div>
    </div>
  )
}

export function CashFlowChart({ bars, averageLine }: CashFlowChartProps) {
  const isEmpty = bars.every(b => b.amount === 0)

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="section-label">Cash Flow</p>
        {averageLine > 0 && (
          <span className="text-xs flex items-center gap-1.5" style={{ color: 'var(--amber)' }}>
            <span
              style={{
                display: 'inline-block',
                width: 16,
                height: 1,
                borderTop: '1px dashed var(--amber)',
              }}
            />
            avg {formatCurrency(averageLine, 'USD')}
          </span>
        )}
      </div>

      {isEmpty ? (
        <div
          className="flex items-center justify-center"
          style={{ height: 200, color: 'var(--text3)', fontSize: 13 }}
        >
          Log payments to see your cash flow
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={bars} barCategoryGap="32%">
            <defs>
              <linearGradient id="cashflow-line-gradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(240,240,255,0.30)', fontSize: 11 }}
            />
            <YAxis hide />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
              {bars.map((bar, i) => (
                <Cell
                  key={i}
                  fill={barFill(bar.type)}
                  stroke={barStroke(bar.type)}
                  strokeWidth={1}
                />
              ))}
            </Bar>
            <Line
              type="monotone"
              dataKey="amount"
              stroke="url(#cashflow-line-gradient)"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#22d3ee', stroke: '#22d3ee' }}
              activeDot={{ r: 5, fill: '#22d3ee', stroke: '#22d3ee' }}
            />
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
      )}
    </div>
  )
}
