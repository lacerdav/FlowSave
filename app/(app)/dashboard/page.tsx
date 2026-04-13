import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { HeroMonthCard } from '@/components/dashboard/HeroMonthCard'
import { SalaryGapCard } from '@/components/dashboard/SalaryGapCard'
import { PendingCard } from '@/components/dashboard/PendingCard'
import { CashFlowChart, type ChartPoint } from '@/components/dashboard/CashFlowChart'
import { DashboardMotionShell } from '@/components/dashboard/DashboardMotionShell'
import { RecentPayments, type PaymentItem } from '@/components/dashboard/RecentPayments'
import type { Client, Payment, Project, ScheduleEntry, Settings } from '@/types'

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
    { data: scheduleRows },
    { count: clientCount },
    { count: paymentCount },
  ] = await Promise.all([
    supabase.from('settings').select('*').eq('user_id', user.id).single(),
    supabase.from('clients').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
    supabase.from('payments').select('*').eq('user_id', user.id).order('received_at', { ascending: false }),
    supabase.from('projects').select('*').eq('user_id', user.id),
    supabase.from('payment_schedule').select('*').eq('user_id', user.id).eq('status', 'scheduled').order('expected_date', { ascending: true }),
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
  const scheduleEntries: ScheduleEntry[] = scheduleRows ?? []

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

  // ── Pending: scheduled entries + unscheduled project fallback ───────────────
  const scheduledByCurrency = scheduleEntries.reduce((map, e) => {
    map.set(e.currency, (map.get(e.currency) ?? 0) + e.amount)
    return map
  }, new Map<string, number>())

  const projectIdsWithSchedule = new Set(scheduleEntries.map(e => e.project_id))
  const unscheduledProjects = projects.filter(
    p => (p.status === 'pending' || p.status === 'confirmed') &&
      !projectIdsWithSchedule.has(p.id)
  )
  const unscheduledByCurrency = unscheduledProjects.reduce((map, p) => {
    const cur = p.client_id ? (clientMap.get(p.client_id)?.currency ?? 'USD') : 'USD'
    map.set(cur, (map.get(cur) ?? 0) + (p.expected_amount ?? 0))
    return map
  }, new Map<string, number>())

  // Merge both currency maps
  const pendingByCurrency = new Map(scheduledByCurrency)
  for (const [cur, total] of unscheduledByCurrency) {
    pendingByCurrency.set(cur, (pendingByCurrency.get(cur) ?? 0) + total)
  }

  // ── This month's scheduled entries only ──────────────────────────────────────
  const thisMonthScheduledByCurrency = scheduleEntries
    .filter(e => e.expected_date >= monthStart && e.expected_date <= monthEnd)
    .reduce((map, e) => {
      map.set(e.currency, (map.get(e.currency) ?? 0) + e.amount)
      return map
    }, new Map<string, number>())

  const thisMonthPendingUsd = Math.round((thisMonthScheduledByCurrency.get('USD') ?? 0) * 100) / 100
  const thisMonthPendingBrl = Math.round((thisMonthScheduledByCurrency.get('BRL') ?? 0) * 100) / 100

  const pendingCount = scheduleEntries.length + unscheduledProjects.length

  // Pending subtitle
  const scheduledCount = scheduleEntries.length
  const unscheduledCount = unscheduledProjects.length
  const pendingSubtitle =
    scheduledCount > 0 && unscheduledCount > 0
      ? `${scheduledCount} scheduled · ${unscheduledCount} unscheduled`
      : scheduledCount > 0
      ? `${scheduledCount} scheduled ${scheduledCount === 1 ? 'entry' : 'entries'}`
      : unscheduledCount > 0
      ? `${unscheduledCount} ${unscheduledCount === 1 ? 'project' : 'projects'}`
      : undefined

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

  // ── Chart data: keep received, scheduled, and gap separate ──────────────────
  const pmtByMonth = new Map<string, number>()
  for (const p of payments) {
    const d = new Date(p.received_at + 'T00:00:00')
    const k = dateKey(d)
    pmtByMonth.set(k, (pmtByMonth.get(k) ?? 0) + p.amount)
  }

  const scheduledMonthMap = new Map<string, number>()
  for (const entry of scheduleEntries) {
    const d = new Date(entry.expected_date + 'T00:00:00')
    const k = dateKey(d)
    scheduledMonthMap.set(k, (scheduledMonthMap.get(k) ?? 0) + entry.amount)
  }

  const chartPoints: ChartPoint[] = []
  for (let i = 3; i >= 1; i--) {
    const month = new Date(cy, cm - i, 1)
    const key = dateKey(month)
    const received = Math.round((pmtByMonth.get(key) ?? 0) * 100) / 100
    const scheduled = Math.round((scheduledMonthMap.get(key) ?? 0) * 100) / 100
    const gap = Math.max(settings.target_monthly_salary - received - scheduled, 0)

    chartPoints.push({
      label: monthLabel(month),
      received,
      scheduled,
      gap: Math.round(gap * 100) / 100,
    })
  }

  for (let i = 0; i < 3; i++) {
    const month = new Date(cy, cm + i, 1)
    const key = dateKey(month)
    const received = Math.round((pmtByMonth.get(key) ?? 0) * 100) / 100
    const scheduled = Math.round((scheduledMonthMap.get(key) ?? 0) * 100) / 100
    const gap = Math.max(settings.target_monthly_salary - received - scheduled, 0)

    chartPoints.push({
      label: monthLabel(month),
      received,
      scheduled,
      gap: Math.round(gap * 100) / 100,
    })
  }

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

  // ── Empty state banner ───────────────────────────────────────────────────────
  const showEmptyBanner =
    settings.onboarding_completed &&
    ((clientCount ?? 0) === 0 || (paymentCount ?? 0) === 0)

  // ── Metric labels ────────────────────────────────────────────────────────────
  const monthTotalLabel = multiCurrencyLabel(monthByCurrency, primaryCurrency)
  const taxTotalLabel   = multiCurrencyLabel(taxByCurrency, primaryCurrency)
  const pendingUsdAmount = Math.round((pendingByCurrency.get('USD') ?? 0) * 100) / 100
  const pendingBrlAmount = Math.round((pendingByCurrency.get('BRL') ?? 0) * 100) / 100
  const monthPaymentCount = currentMonthPmts.length

  return (
    <DashboardMotionShell
      heroKicker="Overview"
      heroTitle="Dashboard"
      heroDescription={
        <>
          A clear view of what arrived, what is still pending, and how this month is
          tracking against the target you set.
        </>
      }
      emptyBanner={
        showEmptyBanner ? (
          <div
            className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-3 gap-y-1 rounded-xl px-5 py-4"
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
        ) : undefined
      }
      metricsRow={
        <div className="@container">
          <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2">
          <HeroMonthCard
            value={monthTotalLabel}
            badge={
              monthDeltaPct !== null
                ? `${monthDeltaPct >= 0 ? '+' : ''}${monthDeltaPct}% vs last month`
                : 'vs last month'
            }
            badgeTone={
              monthDeltaPct === null
                ? 'neutral'
                : monthDeltaPct >= 0
                ? 'positive'
                : 'negative'
            }
            subtitle={
              monthPaymentCount > 0
                ? `${monthPaymentCount} payment${monthPaymentCount === 1 ? '' : 's'} received`
                : 'No payments received yet'
            }
            taxLabel={taxTotalLabel}
            taxPct={settings.tax_reserve_pct}
          />
          <SalaryGapCard
            gap={salaryGap}
            target={settings.target_monthly_salary}
            received={totalThisMonth}
            currency={primaryCurrency}
          />
          <PendingCard
            thisMonthUsdAmount={thisMonthPendingUsd}
            thisMonthBrlAmount={thisMonthPendingBrl}
            usdAmount={pendingUsdAmount}
            brlAmount={pendingBrlAmount}
            pendingCount={pendingCount}
            subtitle={pendingSubtitle}
          />
          <RecentPayments payments={recentPayments} />
          </div>
        </div>
      }
      middleRow={
        <CashFlowChart points={chartPoints} currency={primaryCurrency} />
      }
    />
  )
}
