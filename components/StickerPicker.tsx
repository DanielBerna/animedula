'use client'

import { useEffect, useState } from 'react'
import { insertStickerToken } from '../lib/gamification/stickers'
import { loadStickers, type RuntimeSticker } from '../lib/gamification/sticker-runtime'

type Props = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export default function StickerPicker({ value, onChange, disabled }: Props) {
  const [ownedPacks, setOwnedPacks] = useState<string[]>([])
  const [all, setAll] = useState<RuntimeSticker[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    loadStickers().then(setAll)
    fetch('/api/gamification')
      .then((r) => r.json())
      .then((data) => {
        const slugs = (data.inventory || [])
          .map((i: { shop_items?: { slug?: string; item_type?: string } | null }) => i.shop_items)
          .filter((s: { item_type?: string } | null) => s?.item_type === 'sticker_pack')
          .map((s: { slug?: string }) => s?.slug)
          .filter(Boolean) as string[]
        setOwnedPacks(slugs)
      })
      .catch(() => {})
  }, [])

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
        onClick={() => setOpen((o) => !o)}
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
          {hasOnlyFree ? (
            <p className="text-[10px] text-faint w-full mt-1">Compra packs en /perfil para más stickers.</p>
          ) : null}
        </div>
      )}
    </div>
  )
}
