import CollectibleCard from './CollectibleCard'

type Props = {
  nombre: string
  imagen?: string
  descripcion?: string
  url?: string
  cta?: string
  badge?: string
}

/** @deprecated Usa CollectibleCard — wrapper de compatibilidad */
export default function FiguraCard(props: Props) {
  return (
    <CollectibleCard
      nombre={props.nombre}
      descripcion={props.descripcion || ''}
      url={props.url || 'https://listado.mercadolibre.com.mx/figura-anime'}
      cta={props.cta}
      icon="figure"
      badge={props.badge}
    />
  )
}
