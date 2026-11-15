'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Fragment, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react'
import { OPEN_EVENT, search, tokenize } from '../lib/search'
import type { SearchRecord } from '../lib/search-index'

let indexPromise: Promise<SearchRecord[]> | null = null

// The index is fetched once, the first time someone opens search.
function loadIndex(): Promise<SearchRecord[]> {
  if (!indexPromise) {
    indexPromise = fetch('/search-index.json')
      .then((response) => {
        if (!response.ok) throw new Error(`Search index returned ${response.status}`)
        return response.json() as Promise<SearchRecord[]>
      })
      .catch((error: unknown) => {
        indexPromise = null
        throw error
      })
  }
  return indexPromise
}

const escapeForRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function mark(text: string, terms: string[]): ReactNode {
  if (terms.length === 0) return text
  const pattern = new RegExp(`(${terms.map(escapeForRegExp).join('|')})`, 'gi')
  return text.split(pattern).map((part, index) =>
    index % 2 === 1 ? <mark key={index}>{part}</mark> : <Fragment key={index}>{part}</Fragment>,
  )
}

export function SearchDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [records, setRecords] = useState<SearchRecord[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [active, setActive] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const opener = useRef<HTMLElement | null>(null)

  // Open with the search buttons, the "/" key, or Ctrl or Cmd plus K.
  useEffect(() => {
    const show = () => {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      setOpen(true)
    }
    const onKey = (event: KeyboardEvent) => {
      const target = event.target
      const typing =
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      const shortcut = event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)
      const slash = event.key === '/' && !typing && !event.metaKey && !event.ctrlKey && !event.altKey
      if (shortcut || slash) {
        event.preventDefault()
        show()
      }
    }
    window.addEventListener(OPEN_EVENT, show)
    document.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener(OPEN_EVENT, show)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    document.documentElement.classList.add('search-open')
    input.current?.focus()
    loadIndex()
      .then((loaded) => {
        setRecords(loaded)
        setFailed(false)
      })
      .catch(() => setFailed(true))
    return () => document.documentElement.classList.remove('search-open')
  }, [open])

  const terms = useMemo(() => tokenize(query), [query])
  const hits = useMemo(() => (records ? search(records, query) : []), [records, query])

  useEffect(() => {
    document.getElementById(`search-option-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  function close() {
    setOpen(false)
    setQuery('')
    setActive(0)
    opener.current?.focus()
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      close()
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((index) => Math.min(index + 1, Math.max(hits.length - 1, 0)))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter') {
      const hit = hits[active]
      if (hit) {
        event.preventDefault()
        router.push(hit.record.url)
        close()
      }
    }
  }

  if (!open) return null

  let status = ''
  if (failed) status = 'Search is not available right now. Reload the page and try again.'
  else if (!records) status = 'Loading the search index…'
  else if (terms.length === 0) status = 'Search pages, parameters and error codes.'
  else if (hits.length === 0) status = `No results for “${query.trim()}”.`

  return (
    <div
      className="search-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close()
      }}
    >
      <div className="search-dialog" role="dialog" aria-modal="true" aria-label="Search the docs">
        <div className="search-field">
          <input
            ref={input}
            type="search"
            role="combobox"
            aria-expanded={hits.length > 0}
            aria-controls="search-results"
            aria-autocomplete="list"
            aria-activedescendant={hits.length > 0 ? `search-option-${active}` : undefined}
            placeholder="Search the docs"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActive(0)
            }}
            onKeyDown={onKeyDown}
          />
          <button type="button" className="search-close" onClick={close}>
            Esc
          </button>
        </div>
        <div className="search-body">
          {status ? <p className="search-status">{status}</p> : null}
          <ul id="search-results" role="listbox" aria-label="Search results">
            {hits.map((hit, index) => (
              <li key={hit.record.url} id={`search-option-${index}`} role="option" aria-selected={index === active}>
                <Link
                  href={hit.record.url}
                  className="search-hit"
                  data-active={index === active ? 'true' : 'false'}
                  onClick={close}
                  onMouseMove={() => setActive(index)}
                >
                  <span className="search-hit-title">
                    {hit.record.page}
                    {hit.record.section ? <span className="search-hit-sep"> › </span> : null}
                    {hit.record.section}
                  </span>
                  <span className="search-hit-snippet">{mark(hit.snippet, terms)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <span className="sr-only" aria-live="polite">
          {terms.length > 0 && records ? `${hits.length} results` : ''}
        </span>
      </div>
    </div>
  )
}
