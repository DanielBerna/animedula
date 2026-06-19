'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'

export type TabItem = {
  id: string
  label: string
  icon?: string
  content: ReactNode
}

type Props = {
  tabs: TabItem[]
  defaultTab?: string
}

export default function ContentTabs({ tabs, defaultTab }: Props) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.id || 'info')
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })
  const navRef = useRef<HTMLDivElement>(null)
  const current = tabs.find((t) => t.id === active) || tabs[0]

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const btn = nav.querySelector<HTMLButtonElement>(`[data-tab-id="${active}"]`)
    if (!btn) return
    setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth })
  }, [active, tabs])

  return (
    <div className="content-tabs">
      <div className="content-tabs-nav-wrap">
        <div className="content-tabs-nav" role="tablist" aria-label="Secciones de la ficha" ref={navRef}>
          <span
            className="content-tab-indicator"
            style={{ transform: `translateX(${indicator.left}px)`, width: indicator.width }}
            aria-hidden
          />
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              data-tab-id={tab.id}
              aria-selected={active === tab.id}
              className={`content-tab${active === tab.id ? ' is-active' : ''}`}
              onClick={() => setActive(tab.id)}
            >
              {tab.icon ? <span className="content-tab-icon" aria-hidden>{tab.icon}</span> : null}
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="content-tabs-panel enter-up" role="tabpanel" key={active}>
        {current?.content}
      </div>
    </div>
  )
}
