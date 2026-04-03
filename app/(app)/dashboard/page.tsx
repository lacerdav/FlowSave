import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { computeForecast } from '@/lib/forecast'
import { formatCurrency } from '@/lib/utils'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { CashFlowChart, type ChartBar } from '@/components/dashboard/CashFlowChart'
import { RecentPayments, type PaymentItem } from '@/components/dashboard/RecentPayments'
import { TaxReserveCard, type TaxReserveItem } from '@/components/dashboard/TaxReserveCard'
import { SalaryProgress } from '@/components/dashboard/SalaryProgress'
import type { Client, Payment, Project, Settings } from '@/types'

const CLIENT_COLORS = [
  '#5b7fff', '#22d87a', '#f5a623', '#ff5b7f',
  '#a78bfa', '#34d399', '#f87171', '#60a5fa',
]

function monthLabel(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short' })
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}`
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: settingsRow },
    { data: clientRows },
    { data: paymentRows },
    { data: projectRows },
    { count: clientCount },
    { count: paymentCount },
  ] = await Promise.all([
    supabase.from('settings').select('*').eq('user_id', user.id).single(),
    supabase.from('clients').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
    supabase.from('payments').select('*').eq('user_id', user.id).order('received_at', { ascending: false }),
    supabase.from('projects').select('*').eq('user_id', user.id),
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('payments').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  const settings: Settings = settingsRow ?? {
    user_id: user.id,
    target_monthly_salary: 0,
    tax_reserve_pct: 25,
    survival_budget: 0,
    onboarding_completed: false,
    lean_alert_sent_at: null,
    ai_insight_cache: null,
    ai_insight_cached_at: null,
    updated_at: new Date().toISOString(),
  }

  const clients: Client[] = clientRows ?? []
  const payments: Payment[] = paymentRows ?? []
  const projects: Project[] = projectRows ?? []

  // ── Date helpers ────────────────────────────────────────────────────────────
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const cy = today.getFullYear()
  const cm = today.getMonth()
  const monthStart = new Date(cy, cm, 1).toISOString().split('T')[0]
  const monthEnd   = new Date(cy, cm + 1, 0).toISOString().split('T')[0]

  // ── Client lookup: id → { name, color } ─────────────────────────────────────
  const clientMap = new Map<string, { name: string; color: string }>(
    clients.map((c, i) => [c.id, { name: c.name, color: CLIENT_COLORS[i % CLIENT_COLORS.length] }])
  )

  // ── Current month payments ───────────────────────────────────────────────────
  const currentMonthPmts = payments.filter(
    p => p.received_at >= monthStart && p.received_at <= monthEnd
  )

  // ── Metric card values ───────────────────────────────────────────────────────
  const totalThisMonth = currentMonthPmts.reduce((s, p) => s + p.amount, 0)
  const taxReserve     = totalThisMonth * (settings.tax_reserve_pct / 100)
  const salaryGap      = settings.target_monthly_salary - totalThisMonth
  const pendingCount   = projects.filter(
    p => p.status === 'pending' || p.status === 'confirmed'
  ).length
  const pendingAmount  = projects
    .filter(p => p.status === 'pending' || p.status === 'confirmed')
    .reduce((s, p) => s + p.expected_amount, 0)

  // Last month total for delta
  const lmStart = new Date(cy, cm - 1, 1).toISOString().split('T')[0]
  const lmEnd   = new Date(cy, cm, 0).toISOString().split('T')[0]
  const lastMonthTotal = payments
    .filter(p => p.received_at >= lmStart && p.received_at <= lmEnd)
    .reduce((s, p) => s + p.amount, 0)

  const monthDeltaPct =
    lastMonthTotal > 0
      ? Math.round(((totalThisMonth - lastMonthTotal) / lastMonthTotal) * 100)
      : null

  // ── Forecast (for chart) ─────────────────────────────────────────────────────
  const forecast = computeForecast(payments, projects, settings, today)

  // ── Chart bars ───────────────────────────────────────────────────────────────
  const pmtByMonth = new Map<string, number>()
  for (const p of payments) {
    const d = new Date(p.received_at + 'T00:00:00')
    const k = dateKey(d)
    pmtByMonth.set(k, (pmtByMonth.get(k) ?? 0) + p.amount)
  }

  const chartBars: ChartBar[] = []
  const historicalAmounts: number[] = []

  for (let i = 3; i >= 1; i--) {
    const d = new Date(cy, cm - i, 1)
    const amt = pmtByMonth.get(dateKey(d)) ?? 0
    if (amt > 0) {
      historicalAmounts.push(amt)
      chartBars.push({ label: monthLabel(d), amount: amt, type: 'historical' })
    }
  }

  chartBars.push({
    label: monthLabel(today),
    amount: pmtByMonth.get(dateKey(today)) ?? 0,
    type: 'current',
  })

  for (let i = 0; i < 2; i++) {
    const f = forecast[i]
    if (f) {
      chartBars.push({
        label: monthLabel(f.month),
        amount: Math.round(f.projected),
        type: f.isLean ? 'forecast-lean' : 'forecast-healthy',
      })
    }
  }

  const nonZero = historicalAmounts.filter(v => v > 0)
  const averageLine =
    nonZero.length > 0
      ? Math.round(nonZero.reduce((a, b) => a + b, 0) / nonZero.length)
      : 0

  // ── Recent payments (last 10) ────────────────────────────────────────────────
  const recentPayments: PaymentItem[] = payments.slice(0, 10).map(p => {
    const client = p.client_id ? clientMap.get(p.client_id) : undefined
    return {
      id: p.id,
      clientName: client?.name ?? 'Unknown client',
      clientColor: client?.color ?? 'var(--text3)',
      amount: p.amount,
      currency: p.currency,
      receivedAt: p.received_at,
      isPast: p.received_at <= todayStr,
    }
  })

  // ── Tax reserve breakdown ────────────────────────────────────────────────────
  const taxItems: TaxReserveItem[] = currentMonthPmts.map(p => {
    const client = p.client_id ? clientMap.get(p.client_id) : undefined
    return {
      id: p.id,
      clientName: client?.name ?? 'Unknown client',
      amountReceived: p.amount,
      reserveAmount: Math.round(p.amount * (settings.tax_reserve_pct / 100) * 100) / 100,
      currency: p.currency,
    }
  })

  // ── Dominant currency (first payment, fallback USD) ───────────────────────────
  const currency = payments[0]?.currency ?? 'USD'

  // ── Empty state banner ───────────────────────────────────────────────────────
  const showEmptyBanner =
    settings.onboarding_completed &&
    ((clientCount ?? 0) === 0 || (paymentCount ?? 0) === 0)

  return (
    <div className="space-y-6">
      <h1 className="page-title">Dashboard</h1>

      {/* Empty state banner */}
      {showEmptyBanner && (
        <div
          className="rounded-xl p-4 flex flex-wrap gap-x-3 gap-y-1 items-center"
          style={{
            background: 'var(--amber-dim)',
            border: '1px solid var(--amber)',
            color: 'var(--amber)',
            fontSize: 13,
          }}
        >
          <span>Your dashboard is empty —</span>
          {(clientCount ?? 0) === 0 && (
            <Link
              href="/clients"
              className="underline font-medium"
              style={{ color: 'var(--amber)' }}
            >
              Add a client →
            </Link>
          )}
          {(paymentCount ?? 0) === 0 && (
            <Link
              href="/payments"
              className="underline font-medium"
              style={{ color: 'var(--amber)' }}
            >
              Log a payment →
            </Link>
          )}
        </div>
      )}

      {/* Metric cards — 2×2 on mobile, 4 columns on lg */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="This Month"
          value={formatCurrency(totalThisMonth, currency)}
          subtitle={
            monthDeltaPct !== null
              ? `${monthDeltaPct >= 0 ? '+' : ''}${monthDeltaPct}% vs last month`
              : ''
          }
          subtitleColor={
            monthDeltaPct !== null && monthDeltaPct >= 0
              ? 'var(--green)'
              : monthDeltaPct !== null
              ? 'var(--red)'
              : 'var(--text3)'
          }
        />
        <MetricCard
          label="Tax Reserve"
          value={formatCurrency(taxReserve, currency)}
          valueColor="var(--green)"
          subtitle={`${settings.tax_reserve_pct}% of received`}
        />
        <MetricCard
          label="Salary Gap"
          value={
            salaryGap <= 0
              ? `+${formatCurrency(Math.abs(salaryGap), currency)} surplus`
              : `${formatCurrency(salaryGap, currency)} short`
          }
          valueColor={salaryGap <= 0 ? 'var(--green)' : 'var(--red)'}
          subtitle={`Target: ${formatCurrency(settings.target_monthly_salary, currency)}`}
        />
        <MetricCard
          label="Pending"
          value={formatCurrency(pendingAmount, currency)}
          valueColor="var(--amber)"
          subtitle={`${pendingCount} ${pendingCount === 1 ? 'project' : 'projects'}`}
        />
      </div>

      {/* Chart + Recent payments — chart wider on lg */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
        <CashFlowChart bars={chartBars} averageLine={averageLine} />
        <RecentPayments payments={recentPayments} />
      </div>

      {/* Tax reserve + Salary progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TaxReserveCard
          items={taxItems}
          taxPct={settings.tax_reserve_pct}
        />
        <SalaryProgress
          received={totalThisMonth}
          target={settings.target_monthly_salary}
          currency={currency}
        />
      </div>
    </div>
  )
}
