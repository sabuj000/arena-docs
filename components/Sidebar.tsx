'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { nav } from '../lib/nav'

export function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Close the menu after navigating to another page.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Close the menu with the Escape key.
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <header className="topbar">
        <Link href="/" className="topbar-brand">
          Arena API
        </Link>
        <button
          type="button"
          className="menu-button"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </header>
      <nav
        id="site-nav"
        className="sidebar"
        data-open={open ? 'true' : 'false'}
        aria-label="Documentation"
      >
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
    </>
  )
}
