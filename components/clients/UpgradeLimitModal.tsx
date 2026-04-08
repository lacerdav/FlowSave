'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface Props {
  open: boolean
  onClose: () => void
}

export function UpgradeLimitModal({ open, onClose }: Props) {
  const router = useRouter()

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="sm:max-w-[460px]"
        style={{
          background: 'linear-gradient(180deg, rgba(15, 20, 45, 0.98) 0%, rgba(9, 13, 31, 0.96) 100%)',
          border: '1px solid rgba(148, 174, 252, 0.20)',
          boxShadow: '0 32px 80px rgba(2, 6, 20, 0.56), 0 0 40px rgba(50, 78, 168, 0.14)',
        }}
      >
        <DialogHeader className="space-y-2">
          <DialogTitle className="dialog-title-premium">Client limit reached</DialogTitle>
          <p className="dialog-subtitle">
            Upgrade to Pro to keep your client roster growing without losing the premium flow of the app.
          </p>
        </DialogHeader>

        <div className="space-y-5">
          <ul className="space-y-2.5 text-sm" style={{ color: 'var(--text2)' }}>
            {[
              'Unlimited clients',
              '3-month cash flow forecast',
              'Lean month alerts',
              'AI-powered insights',
            ].map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2"
                style={{
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  background: 'rgba(255, 255, 255, 0.03)',
                }}
              >
                <span className="status-chip" data-tone="green">Pro</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <div className="form-cta-row" data-align="center">
            <Button
              onClick={() => router.push('/upgrade')}
              className="primary-cta-button h-11 min-w-[13rem] px-6 font-medium"
            >
              Upgrade to Pro — $19/mo
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              className="h-10 px-4"
              style={{ color: 'var(--text3)' }}
            >
              Maybe later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
