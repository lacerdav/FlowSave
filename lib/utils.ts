import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Currency, PaymentPlanType } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const CURRENCY_LOCALE: Record<string, string> = {
  BRL: 'pt-BR',
  USD: 'en-US',
}

export const PLAN_TYPE_LABELS: Record<PaymentPlanType, string> = {
  one_time: 'One-time payment',
  weekly_installments: 'Weekly installments',
  monthly_installments: 'Monthly installments',
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat(CURRENCY_LOCALE[currency] ?? 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatMoneyInputValue(amount: number, currency: Currency | string = 'USD'): string {
  return new Intl.NumberFormat(CURRENCY_LOCALE[currency] ?? 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function getCurrencySymbol(currency: Currency | string = 'USD'): string {
  return new Intl.NumberFormat(CURRENCY_LOCALE[currency] ?? 'en-US', {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .formatToParts(0)
    .find(part => part.type === 'currency')?.value ?? currency
}

export function parseMoneyInput(value: string): number | null {
  const digits = value.replace(/\D/g, '')
  if (!digits) return null
  return Number(digits) / 100
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}
