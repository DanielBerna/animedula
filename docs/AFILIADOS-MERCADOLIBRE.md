# Afiliados Mercado Libre en Animédula

## 1. Registrarte en el programa (México)

1. Entra a [Mercado Libre Afiliados](https://www.mercadolibre.com.mx/l/afiliados).
2. Inicia sesión con tu cuenta de Mercado Libre.
3. Acepta términos del programa de afiliados.
4. En el panel, copia tu **ID de afiliado** (a veces aparece como `aff_id` o en el generador de enlaces).

## 2. Configurar variables en el proyecto

En `.env.local` y en **Vercel → Environment Variables**:

```env
MERCADOLIBRE_AFFILIATE_ID=tu-id-de-afiliado
```

Opcional (Amazon, mismo flujo):

```env
AMAZON_ASSOCIATE_TAG=animedula-20
```

Reinicia el servidor tras guardar.

## 3. Cómo funciona en el código

| Ruta | Qué hace |
|------|----------|
| `lib/affiliates.ts` | Construye URLs con tu `aff_id` |
| `/go/mercadolibre?q=...` | Redirige y registra el clic en logs |
| `ProductCard`, `MerchSection` | Usan `/go/...` (nunca el ID crudo en el HTML) |

Flujo:

```
Usuario → /go/mercadolibre?q=figura+anime → mercadolibre.com.mx/s?q=...&aff_id=TU_ID
```

## 4. Enlaces de producto específico (recomendado)

Para **un artículo concreto**, genera el enlace en el panel de ML Afiliados y úsalo como `dest` en productos del catálogo:

```ts
// lib/productos/coleccionables.ts
{
  partner: 'mercadolibre',
  query: 'nendoroid anime',
  dest: 'https://articulo.mercadolibre.com.mx/MLM-...', // enlace afiliado del panel
}
```

El redirect `/go/mercadolibre?dest=URL` añade tracking si falta.

## 5. Transparencia legal (obligatorio)

- Ya incluimos `AffiliateDisclosure` en páginas con tienda.
- Enlaces con `rel="sponsored"`.
- Política de privacidad y términos mencionan afiliados.

**No ocultes** que un enlace es de afiliado. ML y la LFPC exigen transparencia.

## 6. Verificar que funciona

1. Pon tu `MERCADOLIBRE_AFFILIATE_ID` en `.env.local`.
2. Abre `/coleccionables` → clic en un producto ML.
3. La URL final debe incluir tu parámetro de afiliado.
4. Revisa clics en logs del servidor (`[affiliate-click]`).

## 7. Panel de ML

Revisa conversiones y comisiones en el dashboard de afiliados de Mercado Libre. Las reglas de atribución las define ML (ventana de cookies, categorías excluidas, etc.).
