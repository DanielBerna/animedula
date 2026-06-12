export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 enter-up">
      <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      <p className="text-sm text-muted">Cargando Animédula…</p>
    </div>
  )
}
