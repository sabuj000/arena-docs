'use client'

import { Children, useId, useRef, useSyncExternalStore, type KeyboardEvent, type ReactNode } from 'react'
import { fromBlockElement, labelFor, type Snippet } from '../lib/code'
import { highlight } from '../lib/highlight'
import { getServerSnapshot, getSnapshot, setPreferred, subscribe } from '../lib/lang-store'
import { CopyButton } from './CopyButton'

// Gives every tab a distinct label, even when two snippets use the same language.
function uniqueLabels(snippets: Snippet[]): string[] {
  const seen: Record<string, number> = {}
  return snippets.map((snippet) => {
    const base = labelFor(snippet)
    seen[base] = (seen[base] ?? 0) + 1
    return seen[base] === 1 ? base : `${base} ${seen[base]}`
  })
}

// Tabs for the same example in several languages. The reader's choice carries across the site.
export function CodeGroup({ children }: { children: ReactNode }) {
  const id = useId()
  const tabs = useRef<Array<HTMLButtonElement | null>>([])
  const preferred = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const snippets = Children.toArray(children)
    .map((child) => fromBlockElement(child))
    .filter((snippet): snippet is Snippet => snippet !== null)

  if (snippets.length === 0) return <div className="code-group">{children}</div>

  const labels = uniqueLabels(snippets)
  const found = labels.findIndex((label) => label.toLowerCase() === preferred)
  const active = found === -1 ? 0 : found
  const current = snippets[active]

  function choose(index: number) {
    setPreferred(labels[index])
    tabs.current[index]?.focus()
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      choose((index + 1) % labels.length)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      choose((index - 1 + labels.length) % labels.length)
    } else if (event.key === 'Home') {
      event.preventDefault()
      choose(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      choose(labels.length - 1)
    }
  }

  return (
    <div className="codeblock">
      <div className="codeblock-header">
        {labels.length === 1 ? (
          <span className="codeblock-label">{labels[0]}</span>
        ) : (
          <div role="tablist" aria-label="Language" className="codeblock-tabs">
            {labels.map((label, index) => (
              <button
                key={label}
                ref={(node) => {
                  tabs.current[index] = node
                }}
                type="button"
                role="tab"
                id={`${id}-tab-${index}`}
                aria-selected={index === active}
                aria-controls={`${id}-panel`}
                tabIndex={index === active ? 0 : -1}
                className="code-tab"
                onClick={() => setPreferred(label)}
                onKeyDown={(event) => onKeyDown(event, index)}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <CopyButton text={current.code} />
      </div>
      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${active}`}>
        <pre>
          <code>{highlight(current.code, current.lang)}</code>
        </pre>
      </div>
    </div>
  )
}
