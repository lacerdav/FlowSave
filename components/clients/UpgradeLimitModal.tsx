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
        style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border-strong)',
          color: 'var(--text)',
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--text)' }}>Client limit reached</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--text2)' }}>
            The free plan supports up to 2 clients. Upgrade to Pro to add unlimited clients.
          </p>

          <ul className="space-y-2 text-sm" style={{ color: 'var(--text2)' }}>
            {[
              'Unlimited clients',
              '3-month cash flow forecast',
              'Lean month alerts',
              'AI-powered insights',
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <span style={{ color: 'var(--green)' }}>✓</span>
                {feature}
              </li>
            ))}
          </ul>

          <div className="flex gap-3">
            <Button
              onClick={() => router.push('/upgrade')}
              className="flex-1 h-10 font-medium"
              style={{ background: 'var(--accent)', color: '#fff' }}
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
