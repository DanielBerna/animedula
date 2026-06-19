'use client'

import { useState } from 'react'
import ContentSection from './ContentSection'
import UserReviewForm from './UserReviewForm'
import UserReviewList from './UserReviewList'
import { ContentType } from '../lib/community/review-metrics'

type Props = {
  contentType: ContentType
  contentId: string
  loggedIn: boolean
  returnTo: string
}

export default function UserReviewSection({ contentType, contentId, loggedIn, returnTo }: Props) {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="space-y-6">
      <ContentSection eyebrow="Comunidad" title="Reseñas de usuarios">
        <UserReviewList
          contentType={contentType}
          contentId={contentId}
          loggedIn={loggedIn}
          refreshKey={refreshKey}
        />
      </ContentSection>

      <ContentSection eyebrow="Tu opinión" title="Escribe tu reseña">
        <UserReviewForm
          contentType={contentType}
          contentId={contentId}
          loggedIn={loggedIn}
          returnTo={returnTo}
          onSubmitted={() => setRefreshKey((k) => k + 1)}
        />
      </ContentSection>
    </div>
  )
}
