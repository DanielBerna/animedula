import Image from 'next/image'

type Props = {
  src: string
  alt: string
  className?: string
  fill?: boolean
  width?: number
  height?: number
  sizes?: string
  priority?: boolean
}

function isMalCdn(url: string) {
  return /myanimelist\.net/i.test(url)
}

export default function PosterImage({
  src,
  alt,
  className = '',
  fill,
  width = 280,
  height = 400,
  sizes = '(max-width: 640px) 45vw, 200px',
  priority,
}: Props) {
  const unoptimized = isMalCdn(src)

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        quality={90}
        className={className}
        unoptimized={unoptimized}
        priority={priority}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      quality={90}
      className={className}
      unoptimized={unoptimized}
      priority={priority}
    />
  )
}
