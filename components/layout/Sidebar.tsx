'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/clients', label: 'Clients' },
  { href: '/payments', label: 'Payments' },
  { href: '/projects', label: 'Projects' },
  { href: '/settings', label: 'Settings' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="fixed left-0 top-14 h-[calc(100vh-56px)] w-[200px] flex flex-col py-4 overflow-y-auto"
      style={{ borderRight: '1px solid var(--border)', background: 'var(--bg)' }}
    >
      <nav className="flex flex-col gap-0.5 px-3">
        {navLinks.map(({ href, label }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'font-medium'
                  : 'hover:bg-[var(--surface)]'
              )}
              style={{
                color: isActive ? 'var(--accent2)' : 'var(--text2)',
                background: isActive ? 'var(--accent-dim)' : undefined,
              }}
            >
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
