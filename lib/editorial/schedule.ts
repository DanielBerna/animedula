import { getCurrentSeasonInfo } from '../seasons'

export function currentSeasonKey(): string {
  const { year, season } = getCurrentSeasonInfo()
  return `${year}-${season}`
}

/** Distribuye borradores en el resto de la temporada (~1 cada 2 días). */
export function suggestPublishDate(slotIndex: number, from = new Date()): string {
  const base = new Date(from)
  base.setHours(9, 0, 0, 0)
  base.setDate(base.getDate() + slotIndex * 2)
  return base.toISOString()
}

export function seasonDateRange(): { start: Date; end: Date; label: string } {
  const { year, season } = getCurrentSeasonInfo()
  const ranges: Record<string, [number, number]> = {
    winter: [0, 2],
    spring: [3, 5],
    summer: [6, 8],
    fall: [9, 11],
  }
  const [startMonth, endMonth] = ranges[season] || [0, 2]
  const start = new Date(year, startMonth, 1)
  const end = new Date(year, endMonth + 1, 0, 23, 59, 59)
  const labels: Record<string, string> = {
    winter: 'Invierno',
    spring: 'Primavera',
    summer: 'Verano',
    fall: 'Otoño',
  }
  return { start, end, label: `${labels[season] || season} ${year}` }
}

export function formatScheduleDate(iso?: string | null): string {
  if (!iso) return 'Sin fecha'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Sin fecha'
  return d.toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export type CalendarStatus = 'published' | 'pending' | 'draft' | 'rejected' | 'overdue'

export function calendarStatus(
  status: string,
  scheduled?: string | null,
): CalendarStatus {
  if (status === 'published') return 'published'
  if (status === 'rejected') return 'rejected'
  if (scheduled && new Date(scheduled).getTime() < Date.now()) return 'overdue'
  if (status === 'pending') return 'pending'
  return 'draft'
}

export const STATUS_LABELS: Record<CalendarStatus, string> = {
  published: 'Publicada',
  pending: 'Pendiente',
  draft: 'Borrador',
  rejected: 'Rechazada',
  overdue: 'Atrasada',
}
