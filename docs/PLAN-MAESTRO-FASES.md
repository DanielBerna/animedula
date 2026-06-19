# Plan maestro — estado vs. pendiente (inversión mínima / gratis)

> **Política de costes:** noticias vía RSS gratuito. Sin GNews/NewsAPI en producción.
> **Base de datos:** un solo archivo → `supabase/schema-complete.sql`

---

## ✅ Implementado (código + SQL)

| Área | App (Next.js) | Supabase |
|------|---------------|----------|
| Auth + perfiles | `/login`, `/perfil`, Header | `profiles` + trigger `handle_new_user` |
| Perfil público | `/u/[username]`, privacidad | `username`, `is_public`, `list_public` |
| Fichas con tabs | anime, manga, videojuegos | — |
| Reseñas editoriales | `/admin`, IA + moderación | `editorial_reviews`, `review_moderation_log` |
| Reseñas UGC | formulario, spoilers, votos | `user_reviews`, `review_votes` |
| Comentarios | fichas anime/manga | `comments` |
| Listas personales | TrackListButton | `user_lists` |
| Foro | `/comunidad` + por ficha | `forum_posts`, `post_reactions` |
| Realtime foro | ForumThread (client) | Replication manual en dashboard |
| Gamificación | XP, niveles, misiones | `xp_events`, triggers, `award_xp` |
| Insignias | panel en `/perfil` | `badges`, `user_badges` + 3 semillas |
| Títulos + tienda | monedas, cosméticos | `selectable_titles`, `shop_items`, `user_inventory`, `daily_missions` |
| Wrapped | `/wrapped` | lee `user_lists`, `user_reviews`, `xp_events` |
| OG perfil | `/api/og/profile` | lee `profiles`, `user_badges` |
| Feed home | noticias RSS + comunidad | — (sin tabla; RSS externo) |
| Noticias | `/noticias` | — |
| Afiliados | Amazon + ML | — |
| Legal | privacidad, términos, UGC | — |

---

## 🗄️ Cómo actualizar Supabase

### Si ya ejecutaste `schema.sql` antes
Ejecuta **solo** una vez en SQL Editor:

```
supabase/schema-complete.sql
```

Es idempotente (`IF NOT EXISTS`, `DROP POLICY IF EXISTS`).

### Proyecto nuevo
Mismo archivo: `schema-complete.sql` (incluye todo lo anterior).

### Después del SQL (manual, gratis)
1. **Authentication → URL Configuration** — Site URL + `/auth/callback`
2. **Database → Replication** — activar `forum_posts` y `post_reactions`
3. Descomenta al final del SQL el `UPDATE … role = 'admin'` con tu email

---

## ❌ Pendiente del plan original (sin coste extra salvo Storage)

Prioridad sugerida si quieres seguir sin gastar:

| # | Feature | Esfuerzo | Coste |
|---|---------|----------|-------|
| 1 | **Arreglar feeds RSS rotos** (3DJuegos, Vida Extra) | Bajo | €0 |
| 2 | **Cosméticos equipados visibles** (borde avatar en foro) | Medio | €0 |
| 3 | **Insignia Cinefilo de Oro** (50 reseñas película) | Bajo | €0 — falta ficha cine |
| 4 | **Comentarios en videojuegos** (`comments.kind = game`) | Bajo | €0 |
| 5 | **Pestaña /capturas** + Storage | Medio | €0* en tier gratis Supabase |
| 6 | **Fichas cine** (TMDB ya en `/api/tmdb`) | Alto | €0 API TMDB |
| 7 | **Stickers en editor rich-text** del foro | Alto | €0 |
| 8 | **Badge automáticos extra** (50 reseñas, etc.) | Bajo | €0 |
| 9 | **News cache en BD** (opcional, menos fetch RSS) | Bajo | €0 |

\* Supabase Storage: plan gratis incluye ~1 GB; suficiente para empezar.

### Explícitamente descartado por coste
- GNews / NewsAPI en producción (desde ~€40–$449/mes comercial)
- Pagos reales / tienda con dinero

---

## Mapa de tablas (`schema-complete.sql`)

```
auth.users
    └── profiles ─────────────────────────────────────────┐
            ├── editorial_reviews (moderación)            │
            ├── comments (anime/manga)                    │
            ├── community_submissions                     │
            ├── user_lists                                │
            ├── user_reviews ── review_votes              │
            ├── forum_posts ── post_reactions             │
            ├── user_badges ── badges                     │
            ├── xp_events                                 │
            ├── daily_missions                            │
            └── user_inventory ── shop_items              │
                                                          │
selectable_titles (catálogo global)                       │
anime_cache (servidor / cron)                             │
```

---

## Rutas activas

| Ruta | Notas |
|------|-------|
| `/` | Feed híbrido RSS + comunidad |
| `/noticias` | Hub noticias |
| `/u/[username]` | Perfil público |
| `/perfil` | Cuenta privada |
| `/wrapped` | Resumen temporada |
| `/comunidad` | Foro global |
| Fichas → tabs | Info · Reseñas · Comunidad |

---

## Verificación rápida post-SQL

En SQL Editor:

```sql
-- Debe listar ~18 tablas public
select tablename from pg_tables where schemaname = 'public' order by 1;

-- Tu perfil con username
select id, display_name, username, level, xp, coins from public.profiles limit 5;
```

En la app (logueado):
- `/perfil` → guardar @usuario
- Ficha anime → pestaña Reseñas → publicar reseña
- `/comunidad` → crear hilo
- `/u/tu_usuario` → perfil público
