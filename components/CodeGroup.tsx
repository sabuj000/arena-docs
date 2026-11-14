import type { ReactNode } from 'react'

// Minimal wrapper: stacks code blocks. Replace with tabs later if you want.
export function CodeGroup({ children }: { children: ReactNode }) {
  return <div className="code-group">{children}</div>
}
