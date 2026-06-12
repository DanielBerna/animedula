import { ReactNode } from 'react'

type Props = {
  eyebrow: string
  title?: string
  children: ReactNode
  className?: string
}

export default function ContentSection({ eyebrow, title, children, className = '' }: Props) {
  return (
    <section className={`card-glass p-5 md:p-6 ${className}`}>
      <p className="eyebrow mb-2">{eyebrow}</p>
      {title && <h2 className="font-display text-lg font-semibold text-text mb-4">{title}</h2>}
      {children}
    </section>
  )
}
