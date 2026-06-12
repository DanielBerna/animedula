import SectionIcon, { IconName } from './SectionIcon'

type Props = {
  name: IconName
  variant?: 'calendar' | 'manga' | 'tech' | 'collect' | 'gaming' | 'anime' | 'default'
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = { sm: 20, md: 26, lg: 32 }

export default function IconOrb({ name, variant = 'default', size = 'md' }: Props) {
  const px = SIZES[size]
  return (
    <span className={`icon-orb icon-orb-${variant} icon-orb-${size}`}>
      <SectionIcon name={name} size={px} />
    </span>
  )
}
