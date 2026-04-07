'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FolderKanbanIcon,
  HandCoinsIcon,
  LayoutGridIcon,
  Settings2Icon,
  UsersIcon,
} from 'lucide-react'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGridIcon },
  { href: '/clients', label: 'Clients', icon: UsersIcon },
  { href: '/payments', label: 'Payments', icon: HandCoinsIcon },
  { href: '/projects', label: 'Projects', icon: FolderKanbanIcon },
  { href: '/settings', label: 'Settings', icon: Settings2Icon },
]

interface SidebarProps {
  collapsed: boolean
}

export function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      id="app-sidebar"
      className="sidebar-shell inset-x-0 top-14 md:bottom-0 md:left-0 md:right-auto"
      data-collapsed={collapsed ? 'true' : 'false'}
    >
      <div aria-hidden className="sidebar-divider hidden md:block" />

      <nav className="relative flex gap-2 overflow-x-auto px-4 py-3 md:flex-col md:gap-2 md:px-4 md:py-5">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href ||
            (href !== '/dashboard' && pathname.startsWith(href))

          return (
            <Link
              key={href}
              href={href}
              data-active={isActive ? 'true' : undefined}
              className="nav-link shrink-0 rounded-[14px]"
              aria-label={label}
              title={collapsed ? label : undefined}
            >
              <Icon className="shell-icon nav-icon" />
              <span className="nav-label">{label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
