import { ReactNode } from 'react'
import PageHeader from './PageHeader'

type Props = {
  title: string
  updated: string
  children: ReactNode
}

export default function LegalPage({ title, updated, children }: Props) {
  return (
    <div className="max-w-3xl mx-auto space-y-8 enter-up">
      <PageHeader variant="default" eyebrow="Legal" title={title} />
      <article className="card-glass p-6 md:p-8 legal-prose">
        <p className="text-xs text-faint mb-6">Última actualización: {updated}</p>
        {children}
      </article>
    </div>
  )
}
