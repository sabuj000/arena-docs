import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'

export function CardGroup({
  cols = 2,
  children,
}: {
  cols?: number
  children: ReactNode
}) {
  const style = { '--cols': cols } as CSSProperties
  return (
    <div className="card-group" style={style}>
      {children}
    </div>
  )
}

export function Card({
  title,
  href,
  children,
}: {
  title: string
  href?: string
  children?: ReactNode
}) {
  const body = (
    <>
      <h3 className="card-title">{title}</h3>
      <div className="card-body">{children}</div>
    </>
  )
  return href ? (
    <Link className="card" href={href}>
      {body}
    </Link>
  ) : (
    <div className="card">{body}</div>
  )
}
