import Link from 'next/link'

type Cta = { label: string; href: string }

export function Hero({
  title,
  subtitle,
  primaryCta,
  secondaryCta,
}: {
  title: string
  subtitle?: string
  primaryCta?: Cta
  secondaryCta?: Cta
}) {
  return (
    <section className="hero">
      <h1>{title}</h1>
      {subtitle ? <p className="hero-subtitle">{subtitle}</p> : null}
      <div className="hero-actions">
        {primaryCta ? (
          <Link className="btn btn-primary" href={primaryCta.href}>
            {primaryCta.label}
          </Link>
        ) : null}
        {secondaryCta ? (
          <Link className="btn btn-secondary" href={secondaryCta.href}>
            {secondaryCta.label}
          </Link>
        ) : null}
      </div>
    </section>
  )
}
