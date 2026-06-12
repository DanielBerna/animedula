import { EditorialReview as Review } from '../lib/editorial/types'

const VERDICT_CLASS: Record<Review['veredicto'], string> = {
  Recomendado: 'tag-accent',
  'Con reservas': 'tag-gold',
  'Solo para fans del género': 'tag-sakura',
}

export default function EditorialReviewBlock({ review }: { review: Review }) {
  return (
    <article className="editorial-review card-glass p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-display text-xl font-bold text-text">Reseña</h2>
        </div>
        <span className={`tag ${VERDICT_CLASS[review.veredicto]}`}>{review.veredicto}</span>
      </div>

      <p className="editorial-gancho text-lg font-display font-semibold text-text leading-snug">
        {review.gancho}
      </p>

      <div className="editorial-grid mt-5 grid gap-4 sm:grid-cols-2">
        <div className="editorial-block">
          <h3 className="editorial-label">Por qué verlo/leerlo</h3>
          <p className="text-sm text-muted leading-relaxed">{review.por_que}</p>
        </div>
        <div className="editorial-block">
          <h3 className="editorial-label">Para quién es</h3>
          <p className="text-sm text-muted leading-relaxed">{review.para_quien}</p>
        </div>
        <div className="editorial-block">
          <h3 className="editorial-label">No es para ti si…</h3>
          <p className="text-sm text-muted leading-relaxed">{review.no_para}</p>
        </div>
        <div className="editorial-block">
          <h3 className="editorial-label">Contexto México 🇲🇽</h3>
          <p className="text-sm text-muted leading-relaxed">{review.contexto_mx}</p>
        </div>
      </div>

      <p className="mt-5 text-[11px] text-faint border-t border-white/6 pt-3">
        Firmado por {review.firma} — no es sinopsis oficial ni copy de MAL.
      </p>
    </article>
  )
}
