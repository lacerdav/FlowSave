'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface Props {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  checkboxLabel?: string
  onConfirm: (rememberChoice: boolean) => Promise<void> | void
  onClose: () => void
}

export function ConfirmActionModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  checkboxLabel,
  onConfirm,
  onClose,
}: Props) {
  const [rememberChoice, setRememberChoice] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) {
      setRememberChoice(false)
      setLoading(false)
    }
  }, [open])

  async function handleConfirm() {
    setLoading(true)
    try {
      await onConfirm(rememberChoice)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={nextOpen => !nextOpen && !loading && onClose()}>
      <DialogContent
        className="sm:max-w-[430px]"
        style={{
          background: 'linear-gradient(180deg, rgba(15, 20, 45, 0.98) 0%, rgba(9, 13, 31, 0.96) 100%)',
          border: '1px solid rgba(148, 174, 252, 0.20)',
          boxShadow: '0 32px 80px rgba(2, 6, 20, 0.56), 0 0 40px rgba(50, 78, 168, 0.14)',
        }}
      >
        <DialogHeader className="space-y-2">
          <DialogTitle className="dialog-title-premium">
            {title}
          </DialogTitle>
          <p className="dialog-subtitle">
            {description}
          </p>
        </DialogHeader>

        <div className="space-y-5">
          {checkboxLabel ? (
            <label className="confirm-checkbox">
              <input
                type="checkbox"
                checked={rememberChoice}
                onChange={event => setRememberChoice(event.target.checked)}
                disabled={loading}
              />
              <span>{checkboxLabel}</span>
            </label>
          ) : null}

          <div className="form-cta-row" data-align="center">
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="primary-cta-button h-11 min-w-[11rem] px-6 font-medium"
            >
              {loading ? 'Working…' : confirmLabel}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={loading}
              className="h-10 px-4"
              style={{ color: 'var(--text3)' }}
            >
              {cancelLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
