/* eslint-disable @next/next/no-img-element */
type Border = { cssClass?: string | null; image?: string | null } | null | undefined

type Props = {
  avatarUrl?: string | null
  label?: string
  border?: Border
  /** diámetro del avatar (px). El marco-imagen se dibuja un poco más grande. */
  size?: number
  className?: string
}

export default function AvatarFrame({ avatarUrl, label = '?', border, size = 36, className = '' }: Props) {
  const initial = (label?.trim()?.[0] || '?').toUpperCase()
  const fontSize = Math.max(11, Math.round(size * 0.42))

  const photo = avatarUrl ? (
    <img
      src={avatarUrl}
      alt=""
      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 9999, display: 'block' }}
    />
  ) : (
    <span style={{ fontWeight: 700, fontSize }}>{initial}</span>
  )

  // Marco-imagen (PNG transparente): se dibuja por encima, un poco más grande.
  if (border?.image) {
    const frame = Math.round(size * 1.4)
    return (
      <span className={`avatar-frame ${className}`} style={{ width: frame, height: frame }} aria-hidden>
        <span className="profile-avatar avatar-frame-base" style={{ width: size, height: size, fontSize }}>
          {photo}
        </span>
        <img src={border.image} alt="" className="avatar-frame-img" />
      </span>
    )
  }

  // Marco CSS: anillo con degradado.
  if (border?.cssClass) {
    return (
      <span
        className={`profile-avatar-ring ${border.cssClass} ${className}`}
        style={{ width: size, height: size, padding: Math.max(2, Math.round(size * 0.07)) }}
        aria-hidden
      >
        <span className="profile-avatar" style={{ fontSize }}>
          {photo}
        </span>
      </span>
    )
  }

  // Sin marco: avatar limpio (sin anillo gris).
  return (
    <span className={`profile-avatar af-plain ${className}`} style={{ width: size, height: size, fontSize }} aria-hidden>
      {photo}
    </span>
  )
}
