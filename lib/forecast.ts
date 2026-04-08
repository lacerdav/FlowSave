import type { Payment, ScheduleEntry, Settings, ForecastMonth } from '@/types'

export function computeForecast(
  payments: Payment[],
  scheduleEntries: ScheduleEntry[],
  settings: Settings,
  today: Date = new Date()
): ForecastMonth[] {
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth()

  // Group payments by YYYY-MM, excluding current month and future
  const monthMap = new Map<string, number>()
  for (const p of payments) {
    const d = new Date(p.received_at + 'T00:00:00')
    if (
      d.getFullYear() > currentYear ||
      (d.getFullYear() === currentYear && d.getMonth() >= currentMonth)
    ) continue
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthMap.set(key, (monthMap.get(key) ?? 0) + p.amount)
  }

  const totals = Array.from(monthMap.values())

  let baselineAvg: number
  let isEstimated: boolean

  if (totals.length === 0) {
    baselineAvg = settings.target_monthly_salary
    isEstimated = true
  } else {
    baselineAvg = totals.reduce((a, b) => a + b, 0) / totals.length
    isEstimated = totals.length < 3
  }

  const result: ForecastMonth[] = []

  for (let i = 1; i <= 3; i++) {
    const forecastDate = new Date(currentYear, currentMonth + i, 1)
    const fy = forecastDate.getFullYear()
    const fm = forecastDate.getMonth()

    const scheduled = scheduleEntries
      .filter(e => {
        if (e.status !== 'scheduled') return false
        const d = new Date(e.expected_date + 'T00:00:00')
        return d.getFullYear() === fy && d.getMonth() === fm
      })
      .reduce((sum, e) => sum + e.amount, 0)

    result.push({
      month: forecastDate,
      projected: baselineAvg + scheduled,
      isLean: (baselineAvg + scheduled) < settings.survival_budget,
      isEstimated,
    })
  }

  return result
}
