// Remembers the reader's language choice so every code group on every page follows it.

const KEY = 'arena-docs-lang'
const listeners = new Set<() => void>()
let memory: string | null = null

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  window.addEventListener('storage', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', listener)
  }
}

export function getSnapshot(): string | null {
  try {
    return window.localStorage.getItem(KEY) ?? memory
  } catch {
    return memory
  }
}

export function getServerSnapshot(): string | null {
  return null
}

export function setPreferred(label: string): void {
  const value = label.toLowerCase()
  memory = value
  try {
    window.localStorage.setItem(KEY, value)
  } catch {
    // Storage can be blocked. The choice still applies until the page reloads.
  }
  listeners.forEach((listener) => listener())
}
