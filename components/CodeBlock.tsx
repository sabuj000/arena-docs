'use client'

import type { ReactNode } from 'react'
import { fromCodeElement, labelFor } from '../lib/code'
import { highlight } from '../lib/highlight'
import { CopyButton } from './CopyButton'

// Replaces the plain <pre> that MDX renders for every fenced code block.
export function CodeBlock({ children }: { children?: ReactNode }) {
  const snippet = fromCodeElement(children)
  if (!snippet) return <pre>{children}</pre>
  return (
    <div className="codeblock">
      <div className="codeblock-header">
        <span className="codeblock-label">{labelFor(snippet)}</span>
        <CopyButton text={snippet.code} />
      </div>
      <pre>
        <code>{highlight(snippet.code, snippet.lang)}</code>
      </pre>
    </div>
  )
}
