'use client'

import { useEffect, useState } from 'react'
import { FREE_STICKERS, insertStickerToken, stickersForOwnedPacks } from '../lib/gamification/stickers'

type Props = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export default function StickerPicker({ value, onChange, disabled }: Props) {
  const [ownedPacks, setOwnedPacks] = useState<string[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
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

  const stickers = stickersForOwnedPacks(ownedPacks)

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
          {stickers.map((s) => (
            <button
              key={s.id}
              type="button"
              title={s.label}
              className="sticker-picker-btn"
              onClick={() => add(s.id)}
            >
              {s.emoji}
            </button>
          ))}
          {ownedPacks.length === 0 && stickers.length === FREE_STICKERS.length ? (
            <p className="text-[10px] text-faint w-full mt-1">
              Compra packs en /perfil para más stickers.
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}
