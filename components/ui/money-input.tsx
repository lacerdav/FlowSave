'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { cn, formatMoneyInputValue, getCurrencySymbol, parseMoneyInput } from '@/lib/utils'
import type { Currency } from '@/types'

interface MoneyInputProps extends Omit<React.ComponentProps<'input'>, 'type' | 'value' | 'onChange'> {
  value: number | null
  onValueChange: (value: number | null) => void
  currency?: Currency | string
  wrapperClassName?: string
  inputClassName?: string
}

const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(function MoneyInput(
  {
    value,
    onValueChange,
    currency = 'USD',
    className,
    wrapperClassName,
    inputClassName,
    inputMode = 'numeric',
    placeholder = '0.00',
    ...props
  },
  ref
) {
  return (
    <div className={cn('money-input-wrap', wrapperClassName)}>
      <span className="money-input-symbol">
        {getCurrencySymbol(currency)}
      </span>
      <Input
        ref={ref}
        type="text"
        inputMode={inputMode}
        placeholder={placeholder}
        value={value == null ? '' : formatMoneyInputValue(value, currency)}
        onChange={event => onValueChange(parseMoneyInput(event.target.value))}
        className={cn(
          'money-input money-input-field pl-9 tabular-nums',
          currency === 'BRL' ? 'pl-11' : undefined,
          className,
          inputClassName
        )}
        {...props}
      />
    </div>
  )
})

export { MoneyInput }
