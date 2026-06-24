import type { ReactNode } from 'react'
import type { ProjectItem } from '../../lib/profiles/full'
import { projectsBySlot } from '../../lib/profiles/full'

type Props = {
  intro: string | null
  projects: ProjectItem[]
  wallSlot?: ReactNode
}

export default function ProfileProjectsSection({ intro, projects, wallSlot }: Props) {
  const slots = projectsBySlot(projects)
  const filled = slots.filter(Boolean).length
  if (filled === 0 && !intro) return null

  return (
    <section className="card-glass p-6 profile-projects-section">
      <div className="mb-4">
        <h2 className="font-display font-semibold text-text text-lg">
          <span className="mr-2" aria-hidden>
            🛠️
          </span>
          Proyectos y trabajo
        </h2>
        <p className="text-xs text-muted mt-1">
          {filled}/5 proyectos · Comparte para que la comunidad conozca o aporte
        </p>
      </div>
      {intro ? <p className="profile-projects-intro">{intro}</p> : null}
      <ul className="profile-projects-grid">
        {slots.map((p, idx) => {
          const slot = idx + 1
          if (!p) {
            return (
              <li key={slot} className="profile-project-card is-empty">
                <span className="profile-project-slot">Proyecto {slot}</span>
                <p className="text-xs text-faint">Espacio libre</p>
              </li>
            )
          }
          return (
            <li key={slot} className="profile-project-card is-filled">
              <span className="profile-project-slot">#{slot}</span>
              <h3 className="font-semibold text-sm text-text">{p.title}</h3>
              <p className="text-xs text-muted mt-2 line-clamp-4">{p.description}</p>
              {p.link_url ? (
                <a
                  href={p.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent hover:underline mt-3 inline-block"
                >
                  Ver enlace →
                </a>
              ) : null}
            </li>
          )
        })}
      </ul>
      {wallSlot}
    </section>
  )
}
