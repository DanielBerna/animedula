'use client'

import { useEffect, useState } from 'react'
import { renderForumBody } from '../lib/gamification/stickers'
import { loadStickers, renderBodyWithStickers } from '../lib/gamification/sticker-runtime'

type Props = {
  body: string
  className?: string
}

export default function ForumPostBody({ body, className = '' }: Props) {
  // Render inicial con stickers gratis (SSR/fallback); luego se enriquece con el CMS.
  const [html, setHtml] = useState(() => renderForumBody(body))

  useEffect(() => {
    let active = true
    loadStickers().then((list) => {
      if (active) setHtml(renderBodyWithStickers(body, list))
    })
    return () => {
      active = false
    }
  }, [body])

  return (
    <p
      className={`text-sm text-text leading-relaxed whitespace-pre-line forum-post-body ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
