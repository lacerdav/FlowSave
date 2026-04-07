'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

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
      className="sidebar-shell inset-x-0 top-14 border-b md:bottom-0 md:left-0 md:right-auto md:w-[220px] md:border-b-0 md:border-r"
    >
      <div aria-hidden className="sidebar-divider hidden md:block" />
      <nav className="relative flex gap-2 overflow-x-auto px-4 py-3 md:flex-col md:gap-2 md:px-4 md:py-6">
        {navLinks.map(({ href, label }) => {
          const isActive =
            pathname === href ||
            (href !== '/dashboard' && pathname.startsWith(href))

          return (
            <Link
              key={href}
              href={href}
              data-active={isActive ? 'true' : undefined}
              className="nav-link shrink-0 whitespace-nowrap rounded-xl px-4 py-2 text-[13px] md:justify-start"
            >
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
