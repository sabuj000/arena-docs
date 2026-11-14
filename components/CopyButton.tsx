'use client'

import { useEffect, useRef, useState } from 'react'

type State = 'idle' | 'copied' | 'failed'

async function writeText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fall back for browsers or pages where the Clipboard API is not available.
    try {
      const area = document.createElement('textarea')
      area.value = text
      area.setAttribute('readonly', '')
      area.style.position = 'fixed'
      area.style.opacity = '0'
      document.body.appendChild(area)
      area.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(area)
      return ok
    } catch {
      return false
    }
  }
}

export function CopyButton({ text }: { text: string }) {
  const [state, setState] = useState<State>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  async function copy() {
    const ok = await writeText(text)
    setState(ok ? 'copied' : 'failed')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('idle'), 2000)
  }

  const label = state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : 'Copy'
  return (
    <>
      <button type="button" className="copy-button" data-state={state} onClick={copy}>
        {label}
      </button>
      <span className="sr-only" aria-live="polite">
        {state === 'copied' ? 'Code copied to clipboard' : ''}
      </span>
    </>
  )
}
