export const DAILY_MISSIONS = [
  { key: 'visit', label: 'Visitar Animédula', coins: 10 },
  { key: 'comment', label: 'Comentar en una ficha', coins: 10 },
  { key: 'review', label: 'Publicar o editar una reseña', coins: 15 },
  { key: 'list', label: 'Actualizar tu lista', coins: 10 },
] as const

export type MissionKey = typeof DAILY_MISSIONS[number]['key']
