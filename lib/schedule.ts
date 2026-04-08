/**
 * Pure schedule generation utility — no Supabase imports.
 * Given a PaymentPlanInput, deterministically produces the entries to create.
 */
import type { PaymentPlanInput } from '@/types'

export interface GeneratedEntry {
  expected_date: string  // YYYY-MM-DD
  amount: number
  label: string
}

/** Add N months to a date, clamping to end-of-month when the source day exceeds it. */
function addMonths(isoDate: string, months: number): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const result = new Date(y, m - 1 + months, d)
  // If day overflowed (e.g. Jan 31 + 1 month → Mar 3), clamp to last day of target month
  if (result.getDate() !== d) {
    result.setDate(0) // last day of previous month = last valid day
  }
  return formatDate(result)
}

/** Add N weeks (7 days each) to a date. */
function addWeeks(isoDate: string, weeks: number): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const base = new Date(y, m - 1, d)
  base.setDate(base.getDate() + weeks * 7)
  return formatDate(base)
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function generateScheduleEntries(input: PaymentPlanInput): GeneratedEntry[] {
  const { planType, totalAmount, firstDate, installmentCount = 1 } = input

  if (planType === 'one_time') {
    return [
      {
        expected_date: firstDate,
        amount: Math.round(totalAmount * 100) / 100,
        label: 'Payment',
      },
    ]
  }

  const count = Math.max(2, Math.min(installmentCount, 60))
  const baseAmount = Math.floor((totalAmount / count) * 100) / 100
  const remainder = Math.round((totalAmount - baseAmount * count) * 100) / 100

  return Array.from({ length: count }, (_, i) => {
    const date =
      planType === 'monthly_installments'
        ? addMonths(firstDate, i)
        : addWeeks(firstDate, i)

    // Last entry absorbs rounding remainder
    const amount =
      i === count - 1
        ? Math.round((baseAmount + remainder) * 100) / 100
        : baseAmount

    return {
      expected_date: date,
      amount,
      label: `Installment ${i + 1} of ${count}`,
    }
  })
}
