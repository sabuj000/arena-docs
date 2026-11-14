import './globals.css'
import './docs.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Sidebar } from '../components/Sidebar'

export const metadata: Metadata = {
  title: {
    default: 'Arena API documentation',
    template: '%s | Arena API',
  },
  description:
    'Documentation for Arena, a fictional gaming API created to demonstrate a docs-as-code workflow.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <Sidebar />
          <main className="content">{children}</main>
        </div>
      </body>
    </html>
  )
}
