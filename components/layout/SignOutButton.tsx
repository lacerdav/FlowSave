'use client'

import { m, useReducedMotion } from 'motion/react'
import { LogOutIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface SignOutButtonProps {
  collapsed: boolean
}

export function SignOutButton({ collapsed }: SignOutButtonProps) {
  const router = useRouter()
  const shouldReduceMotion = useReducedMotion()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="nav-link interactive shrink-0 rounded-[14px] md:mt-auto"
      aria-label="Sign out"
      title={collapsed ? 'Sign out' : undefined}
    >
      <LogOutIcon className="shell-icon nav-icon" />
      <m.span
        className="nav-label"
        initial={false}
        animate={{ opacity: collapsed ? 0 : 1 }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { duration: 0.1, ease: 'easeOut' }
        }
      >
        Sign out
      </m.span>
    </button>
  )
}
