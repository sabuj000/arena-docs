'use client'

import { OPEN_EVENT } from '../lib/search'

// Opens the search dialog. The dialog itself is rendered once, in the root layout.
export function SearchButton({ variant }: { variant: 'sidebar' | 'topbar' }) {
  return (
    <button
      type="button"
      className={`search-trigger search-trigger-${variant}`}
      aria-label="Search the docs"
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
    >
      <span>Search</span>
      {variant === 'sidebar' ? <kbd>/</kbd> : null}
    </button>
  )
}
