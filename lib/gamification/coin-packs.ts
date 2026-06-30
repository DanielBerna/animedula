/** Paquetes de MéduCoins comprables con dinero real (precios en MXN). */

export type CoinPack = {
  id: string
  coins: number
  price_mxn: number
  bonus?: number
  popular?: boolean
  tagline?: string
}

export const COIN_PACKS: CoinPack[] = [
  { id: 'pack-100', coins: 100, price_mxn: 19, tagline: 'Para empezar' },
  { id: 'pack-300', coins: 300, price_mxn: 49, bonus: 20, popular: true, tagline: 'El más elegido' },
  { id: 'pack-700', coins: 700, price_mxn: 99, bonus: 80, tagline: 'Mejor valor' },
  { id: 'pack-1500', coins: 1500, price_mxn: 179, bonus: 250, tagline: 'Para fans' },
]

export function formatMxn(value: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(value)
}
