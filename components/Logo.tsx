type Props = {
  size?: number
  className?: string
}

export default function Logo({ size = 44, className = '' }: Props) {
  const id = `logo-grad-${size}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="4" y1="4" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF6B9D" />
          <stop stopColor="#8B7CFF" offset="0.5" />
          <stop stopColor="#6C5CE7" offset="1" />
        </linearGradient>
      </defs>
      <rect width="44" height="44" rx="14" fill={`url(#${id})`} />
      {/* A estilizada */}
      <path
        d="M22 11L31.5 33H27.8L25.9 27.5H18.1L16.2 33H12.5L22 11ZM19.4 24.2H24.6L22 17.2L19.4 24.2Z"
        fill="white"
      />
      {/* núcleo — médula */}
      <circle cx="22" cy="36.5" r="2.2" fill="white" fillOpacity="0.92" />
    </svg>
  )
}
