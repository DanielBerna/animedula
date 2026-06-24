'use client'

import { renderForumBody } from '../lib/gamification/stickers'

type Props = {
  body: string
  className?: string
}

export default function ForumPostBody({ body, className = '' }: Props) {
  const html = renderForumBody(body)
  return (
    <p
      className={`text-sm text-text leading-relaxed whitespace-pre-line forum-post-body ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
