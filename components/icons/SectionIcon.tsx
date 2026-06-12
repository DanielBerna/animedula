export type IconName =
  | 'home'
  | 'explore'
  | 'anime'
  | 'calendar'
  | 'manga'
  | 'collect'
  | 'tech'
  | 'headphones'
  | 'monitor'
  | 'tablet'
  | 'light'
  | 'chair'
  | 'projector'
  | 'figure'
  | 'tcg'
  | 'plush'
  | 'poster'
  | 'bluray'
  | 'sun'
  | 'moon'
  | 'mexico'
  | 'sparkle'
  | 'play'
  | 'close'

type Props = {
  name: IconName
  size?: number
  className?: string
}

function IconPaths({ name }: { name: IconName }) {
  switch (name) {
    case 'home':
      return (
        <>
          <path d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z" />
          <circle cx="12" cy="9" r="1.2" fill="currentColor" stroke="none" />
        </>
      )
    case 'explore':
      return (
        <>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 4v2M12 18v2M4 12h2M18 12h2" />
          <path d="M12 12l4.5-2" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
        </>
      )
    case 'anime':
      return (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 9h18" />
          <path d="M10 14l-2 3 5-3 5 3-2-3" />
        </>
      )
    case 'calendar':
      return (
        <>
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M8 3v4M16 3v4M4 10h16" />
          <circle cx="9" cy="14" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="15" cy="14" r="1.2" fill="currentColor" stroke="none" />
          <path d="M9 17h6" />
        </>
      )
    case 'manga':
      return (
        <>
          <path d="M6 4h9a3 3 0 013 3v14l-4-2-4 2-4-2-4 2V7a3 3 0 013-3z" />
          <path d="M9 8h6M9 12h4" />
        </>
      )
    case 'collect':
      return (
        <>
          <path d="M12 3l2.2 4.5 5 .7-3.6 3.5.9 5L12 14.8 7.5 16.7l.9-5L4.8 8.2l5-.7L12 3z" />
          <path d="M12 14v7" />
          <path d="M9 21h6" />
        </>
      )
    case 'tech':
      return (
        <>
          <rect x="5" y="5" width="14" height="14" rx="2" />
          <path d="M9 9h2v2H9zM13 9h2v2h-2zM9 13h2v2H9zM13 13h2v2h-2z" fill="currentColor" stroke="none" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
        </>
      )
    case 'headphones':
      return (
        <>
          <path d="M4 14v-2a8 8 0 0116 0v2" />
          <rect x="3" y="13" width="3" height="6" rx="1.5" />
          <rect x="18" y="13" width="3" height="6" rx="1.5" />
          <path d="M8 19c0-2 1.5-3 4-3s4 1 4 3" />
        </>
      )
    case 'monitor':
      return (
        <>
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M8 20h8M12 16v4" />
          <path d="M7 8h10M7 11h6" />
        </>
      )
    case 'tablet':
      return (
        <>
          <rect x="6" y="3" width="12" height="18" rx="2" />
          <path d="M9 7h6M9 11h4" />
          <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
        </>
      )
    case 'light':
      return (
        <>
          <path d="M9 18h6M10 22h4" />
          <path d="M12 2a6 6 0 016 6c0 2.2-1.2 4.1-3 5.2V16H9v-2.8C7.2 12.1 6 10.2 6 8a6 6 0 016-6z" />
          <path d="M12 6v4" />
        </>
      )
    case 'chair':
      return (
        <>
          <path d="M8 11h8l1 7H7l1-7z" />
          <path d="M10 11V7a2 2 0 014 0v4" />
          <path d="M7 18v2M17 18v2" />
        </>
      )
    case 'projector':
      return (
        <>
          <rect x="4" y="8" width="12" height="8" rx="1.5" />
          <path d="M16 11h3l2 2v0l-2 2h-3" />
          <path d="M8 20c2-1 6-1 8 0" />
          <circle cx="10" cy="12" r="1.5" fill="currentColor" stroke="none" />
        </>
      )
    case 'figure':
      return (
        <>
          <circle cx="12" cy="7" r="3" />
          <path d="M8 21v-5l-2-4h12l-2 4v5" />
          <path d="M12 12v4" />
        </>
      )
    case 'tcg':
      return (
        <>
          <rect x="5" y="4" width="10" height="14" rx="1.5" transform="rotate(-8 10 11)" />
          <rect x="9" y="6" width="10" height="14" rx="1.5" transform="rotate(8 14 13)" />
          <path d="M12 10l1.5 3 3.5.5-2.5 2.5.6 3.5L12 17.8 9.9 19.5l.6-3.5-2.5-2.5 3.5-.5L12 10z" />
        </>
      )
    case 'plush':
      return (
        <>
          <circle cx="12" cy="13" r="6" />
          <circle cx="9" cy="11" r="1" fill="currentColor" stroke="none" />
          <circle cx="15" cy="11" r="1" fill="currentColor" stroke="none" />
          <path d="M10 14.5c.8.8 2.2.8 3 0" />
          <circle cx="7" cy="7" r="2" />
          <circle cx="17" cy="7" r="2" />
        </>
      )
    case 'poster':
      return (
        <>
          <rect x="5" y="3" width="14" height="18" rx="1" />
          <path d="M8 7h8M8 11h6M8 15h4" />
          <path d="M5 6h-1v12h1" />
        </>
      )
    case 'bluray':
      return (
        <>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="2.5" />
          <path d="M12 4v2M12 18v2M4 12h2M18 12h2" />
        </>
      )
    case 'sun':
      return (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4" />
        </>
      )
    case 'moon':
      return <path d="M20 14.5A8 8 0 1111.5 4 6.5 6.5 0 0020 14.5z" />
    case 'mexico':
      return (
        <>
          <path d="M4 6h16v12H4z" />
          <path d="M8 6v12M16 6v12" />
          <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
        </>
      )
    case 'sparkle':
      return (
        <>
          <path d="M12 3l1.2 4.2L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-.8L12 3z" />
          <path d="M19 14l.8 2.5 2.5.8-2.5.8-.8 2.5-.8-2.5-2.5-.8 2.5-.8.8-2.5z" />
        </>
      )
    case 'play':
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M10 8.5l6 3.5-6 3.5V8.5z" fill="currentColor" stroke="none" />
        </>
      )
    case 'close':
      return <path d="M6 6l12 12M18 6L6 18" />
    default:
      return null
  }
}

export default function SectionIcon({ name, size = 24, className = '' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      className={`section-icon ${className}`.trim()}
      aria-hidden
    >
      <IconPaths name={name} />
    </svg>
  )
}
