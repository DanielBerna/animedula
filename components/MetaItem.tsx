export default function MetaItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-surface-3/50 border border-white/6 px-4 py-3">
      <dt className="text-[10px] uppercase tracking-widest text-faint">{label}</dt>
      <dd className="mt-1 font-display font-semibold text-text">{value}</dd>
    </div>
  )
}
