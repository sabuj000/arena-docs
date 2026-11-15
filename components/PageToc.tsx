'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState, type MouseEvent } from 'react'

type Heading = { id: string; text: string; level: 2 | 3 }

// Reads the h2 and h3 headings that have an id from the rendered page.
function useHeadings(): Heading[] {
  const pathname = usePathname()
  const [headings, setHeadings] = useState<Heading[]>([])

  useEffect(() => {
    const found = Array.from(
      document.querySelectorAll<HTMLHeadingElement>('main.content h2[id], main.content h3[id]'),
    ).map((heading) => ({
      id: heading.id,
      text: heading.textContent ?? '',
      level: heading.tagName === 'H2' ? (2 as const) : (3 as const),
    }))
    setHeadings(found)
  }, [pathname])

  return headings
}

// The id of the last heading that has scrolled past the top of the page.
function useActiveId(headings: Heading[]): string {
  const [active, setActive] = useState('')

  useEffect(() => {
    if (headings.length === 0) return
    let frame = 0
    const update = () => {
      let current = ''
      for (const heading of headings) {
        const element = document.getElementById(heading.id)
        if (element && element.getBoundingClientRect().top <= 100) current = heading.id
      }
      setActive(current)
    }
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
    }
  }, [headings])

  return active
}

// "On this page". The aside shows on wide screens. The inline version sits above the content on smaller ones.
export function PageToc({ variant }: { variant: 'aside' | 'inline' }) {
  const headings = useHeadings()
  const active = useActiveId(headings)
  if (headings.length < 2) return null

  const list = (
    <ul>
      {headings.map((heading) => (
        <li key={heading.id} className={heading.level === 3 ? 'toc-sub' : undefined}>
          <a
            href={`#${heading.id}`}
            className={active === heading.id ? 'active' : undefined}
            aria-current={active === heading.id ? 'location' : undefined}
            onClick={(event: MouseEvent<HTMLAnchorElement>) => {
              const details = event.currentTarget.closest('details')
              if (details) details.open = false
            }}
          >
            {heading.text}
          </a>
        </li>
      ))}
    </ul>
  )

  if (variant === 'inline') {
    return (
      <details className="toc-inline">
        <summary>On this page</summary>
        <nav aria-label="On this page">{list}</nav>
      </details>
    )
  }
  return (
    <aside className="toc" aria-label="On this page">
      <p className="toc-title">On this page</p>
      {list}
    </aside>
  )
}
