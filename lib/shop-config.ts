/** Tienda visible solo con ID de afiliado ML configurado (servidor). */

export function getMlAffiliateId(): string {
  return process.env.MERCADOLIBRE_AFFILIATE_ID?.trim() || ''
}

export function isShopEnabled(): boolean {
  return getMlAffiliateId().length > 0
}
