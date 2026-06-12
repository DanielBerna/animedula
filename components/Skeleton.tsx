export default function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-surface-4 rounded-lg ${className}`} />
}
