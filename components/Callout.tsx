import type { ReactNode } from 'react'

export function Callout({
  type = 'note',
  children,
}: {
  type?: 'note' | 'warning' | 'tip'
  children: ReactNode
}) {
  return (
    <aside className={`callout callout-${type}`} role="note">
      {children}
    </aside>
  )
}
