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

/** Aggregates amounts per currency and returns a human-readable label.
 *  e.g. "R$400.00 + $64.60" or "$0.00" when empty */
function multiCurrencyLabel(
  map: Map<string, number>,
  fallbackCurrency = 'USD',
): string {
  if (map.size === 0) return formatCurrency(0, fallbackCurrency)
  return Array.from(map.entries())
    .map(([cur, total]) => formatCurrency(Math.round(total * 100) / 100, cur))
    .join(' + ')
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

  // ── Client lookup: id → { name, color, currency } ───────────────────────────
  const clientMap = new Map<string, { name: string; color: string; currency: string }>(
    clients.map((c, i) => [
      c.id,
      { name: c.name, color: CLIENT_COLORS[i % CLIENT_COLORS.length], currency: c.currency },
    ])
  )

  // ── Primary (dominant) currency for single-currency contexts ────────────────
  const primaryCurrency = payments[0]?.currency ?? 'USD'

  // ── Current month payments ───────────────────────────────────────────────────
  const currentMonthPmts = payments.filter(
    p => p.received_at >= monthStart && p.received_at <= monthEnd
  )

  // ── Per-currency aggregates for this month ──────────────────────────────────
  const monthByCurrency = currentMonthPmts.reduce((map, p) => {
    map.set(p.currency, (map.get(p.currency) ?? 0) + p.amount)
    return map
  }, new Map<string, number>())

  const totalThisMonth = currentMonthPmts.reduce((s, p) => s + p.amount, 0)

  // ── Tax reserve per currency ────────────────────────────────────────────────
  const taxByCurrency = new Map<string, number>()
  for (const [cur, total] of monthByCurrency) {
    taxByCurrency.set(cur, total * (settings.tax_reserve_pct / 100))
  }

  // ── Salary gap (primary currency — target has no currency field) ─────────────
  const salaryGap = settings.target_monthly_salary - totalThisMonth

  // ── Pending projects ─────────────────────────────────────────────────────────
  const pendingProjects = projects.filter(
    p => p.status === 'pending' || p.status === 'confirmed'
  )
  const pendingCount = pendingProjects.length
  const pendingByCurrency = pendingProjects.reduce((map, p) => {
    const cur = p.client_id ? (clientMap.get(p.client_id)?.currency ?? 'USD') : 'USD'
    map.set(cur, (map.get(cur) ?? 0) + p.expected_amount)
    return map
  }, new Map<string, number>())

  // ── Last month delta ─────────────────────────────────────────────────────────
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

  // ── Empty state banner ───────────────────────────────────────────────────────
  const showEmptyBanner =
    settings.onboarding_completed &&
    ((clientCount ?? 0) === 0 || (paymentCount ?? 0) === 0)

  // ── Metric labels ────────────────────────────────────────────────────────────
  const monthTotalLabel = multiCurrencyLabel(monthByCurrency, primaryCurrency)
  const taxTotalLabel   = multiCurrencyLabel(taxByCurrency, primaryCurrency)
  const pendingLabel    = pendingCount > 0
    ? multiCurrencyLabel(pendingByCurrency, primaryCurrency)
    : ''

  return (
    <div className="space-y-10 pb-20">
      <div className="fade-up dashboard-hero">
        <p className="page-subtitle page-kicker">
          Overview
        </p>
        <h1 className="dashboard-anchor page-title-gradient mt-5">Dashboard</h1>
        <p className="dashboard-summary">
          A clear view of what arrived, what is still pending, and how this month is
          tracking against the target you set.
        </p>
      </div>

      {showEmptyBanner && (
        <div
          className="fade-up mx-auto flex max-w-3xl flex-wrap items-center gap-x-3 gap-y-1 rounded-xl px-5 py-4"
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

      <div className="fade-up-section grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="This Month"
          value={monthTotalLabel}
          subtitle={
            monthDeltaPct !== null
              ? `${monthDeltaPct >= 0 ? '+' : ''}${monthDeltaPct}% vs last month`
              : undefined
          }
          subtitleColor={
            monthDeltaPct !== null && monthDeltaPct >= 0
              ? 'var(--green)'
              : monthDeltaPct !== null
              ? 'var(--red)'
              : undefined
          }
        />
        <MetricCard
          label="Tax Reserve"
          value={taxTotalLabel}
          valueColor="var(--amber)"
          subtitle={`${settings.tax_reserve_pct}% of received`}
        />
        <MetricCard
          label="Salary Gap"
          value={
            salaryGap <= 0
              ? `+${formatCurrency(Math.abs(salaryGap), primaryCurrency)}`
              : formatCurrency(salaryGap, primaryCurrency)
          }
          valueColor={salaryGap <= 0 ? 'var(--green)' : 'var(--red)'}
          subtitle={
            salaryGap <= 0
              ? 'Surplus this month'
              : `${formatCurrency(settings.target_monthly_salary, primaryCurrency)} target`
          }
        />
        <MetricCard
          label="Pending"
          value={pendingLabel}
          valueColor="var(--accent2)"
          subtitle={
            pendingCount > 0
              ? `${pendingCount} ${pendingCount === 1 ? 'project' : 'projects'}`
              : undefined
          }
          isEmpty={pendingCount === 0}
          emptyMessage="No upcoming payments"
          emptyAction={
            <Link href="/projects" style={{ color: 'var(--accent2)' }}>
              Add a project →
            </Link>
          }
        />
      </div>

      <div className="fade-up-section-2 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
        <CashFlowChart bars={chartBars} averageLine={averageLine} />
        <RecentPayments payments={recentPayments} />
      </div>

      <div className="fade-up-section-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TaxReserveCard
          items={taxItems}
          taxPct={settings.tax_reserve_pct}
        />
        <SalaryProgress
          received={totalThisMonth}
          target={settings.target_monthly_salary}
          currency={primaryCurrency}
        />
      </div>
    </div>
  )
}
