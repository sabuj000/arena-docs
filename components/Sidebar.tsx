'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { nav } from '../lib/nav'

export function Sidebar() {
  const pathname = usePathname()
  return (
    <nav className="sidebar" aria-label="Documentation">
      <Link href="/" className="sidebar-brand">
        Arena API
      </Link>
      {nav.map((group) => (
        <div key={group.title} className="sidebar-group">
          <p className="sidebar-group-title">{group.title}</p>
          <ul>
            {group.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={pathname === item.href ? 'active' : undefined}
                  aria-current={pathname === item.href ? 'page' : undefined}
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}
