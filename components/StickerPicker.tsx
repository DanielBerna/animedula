'use client'

import { useEffect, useState } from 'react'
import { insertStickerToken } from '../lib/gamification/stickers'
import { loadStickers, type RuntimeSticker } from '../lib/gamification/sticker-runtime'

type Props = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

type InvShopItem = { slug?: string; item_type?: string }

function invSlug(raw: unknown): InvShopItem | null {
  // El join de Supabase puede venir como objeto o como array según el esquema.
  if (Array.isArray(raw)) return (raw[0] as InvShopItem) ?? null
  return (raw as InvShopItem) ?? null
}

export default function StickerPicker({ value, onChange, disabled }: Props) {
  const [ownedPacks, setOwnedPacks] = useState<string[]>([])
  const [all, setAll] = useState<RuntimeSticker[]>([])
  const [open, setOpen] = useState(false)

  const refresh = (force = false) => {
    loadStickers(force).then(setAll)
    fetch('/api/gamification', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        const slugs = (data.inventory || [])
          .map((i: { shop_items?: unknown }) => invSlug(i.shop_items))
          .filter((s: InvShopItem | null) => s?.item_type === 'sticker_pack')
          .map((s: InvShopItem | null) => s?.slug)
          .filter(Boolean) as string[]
        setOwnedPacks(slugs)
      })
      .catch(() => {})
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Al abrir el panel, refresca para mostrar stickers recién adquiridos/creados.
  const toggle = () => {
    setOpen((o) => {
      const next = !o
      if (next) refresh(true)
      return next
    })
  }

  // Stickers disponibles: gratis + packs comprados (dedupe por id)
  const owned = new Set(ownedPacks)
  const available = all.filter((s) => s.free || owned.has(s.pack))
  const hasOnlyFree = available.every((s) => s.free)

  const add = (id: string) => {
    onChange(insertStickerToken(value, id))
    setOpen(false)
  }

  return (
    <div className="sticker-picker">
      <button
        type="button"
        disabled={disabled}
        className="btn-ghost text-xs py-1 px-2"
        onClick={toggle}
      >
        😀 Stickers
      </button>
      {open && (
        <div className="sticker-picker-panel mt-2 flex flex-wrap gap-1.5 p-2 rounded-lg border border-white/8 bg-surface-3">
          {available.map((s) => (
            <button
              key={`${s.pack}-${s.id}`}
              type="button"
              title={s.label}
              className="sticker-picker-btn"
              onClick={() => add(s.id)}
            >
              {s.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.image} alt={s.label} className="sticker-picker-img" />
              ) : (
                s.emoji
              )}
            </button>
          ))}
          {available.length === 0 ? (
            <p className="text-[10px] text-faint w-full mt-1">No hay stickers disponibles aún.</p>
          ) : hasOnlyFree ? (
            <p className="text-[10px] text-faint w-full mt-1">Consigue más packs en tu biblioteca.</p>
          ) : null}
        </div>
      )}
    </div>
  )
}
