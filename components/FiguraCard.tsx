import CollectibleCard from './CollectibleCard'

type Props = {
  nombre: string
  imagen?: string
  descripcion?: string
  partner?: 'amazon' | 'mercadolibre'
  query?: string
  badge?: string
}

/** @deprecated Usa CollectibleCard — wrapper de compatibilidad */
export default function FiguraCard(props: Props) {
  return (
    <CollectibleCard
      nombre={props.nombre}
      descripcion={props.descripcion}
      query={props.query}
      partner={props.partner}
      icon="🎎"
      badge={props.badge}
    />
  )
}
