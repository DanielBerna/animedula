"use client"

import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'dark' | 'light' | null
    const initial = stored || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    setTheme(initial)
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    document.documentElement.classList.toggle('light', theme === 'light')
    localStorage.setItem('theme', theme)
  }, [theme, ready])

  return (
    <button
      type="button"
      aria-label={theme === 'dark' ? 'Activar modo día' : 'Activar modo noche'}
      className="theme-toggle focus-ring"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <span className="theme-toggle-icon" aria-hidden>
        {theme === 'dark' ? '☀️' : '🌙'}
      </span>
      <span className="hidden sm:inline text-xs font-medium">
        {theme === 'dark' ? 'Día' : 'Noche'}
      </span>
    </button>
  )
}
