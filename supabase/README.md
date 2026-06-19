# Supabase — guía rápida Animédula

## 1. En el panel de Supabase

### Project Settings → API
Copia estos valores a `.env.local` y a Vercel:

| Variable | Dónde está |
|----------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key (`sb_publishable_...`) |
| `SUPABASE_SECRET_KEY` | Secret key (`sb_secret_...`) — solo servidor |
| `SUPABASE_SERVICE_ROLE_KEY` | Alternativa legacy (`eyJ...` service_role) |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` en dev |

### Authentication → Providers
- Activa **Email** (magic link o contraseña).
- Opcional: **Google** (necesitas Client ID en Google Cloud).

### Authentication → URL Configuration
- **Site URL:** `http://localhost:3000` (dev) y tu dominio en producción.
- **Redirect URLs:**  
  `http://localhost:3000/auth/callback`  
  `https://tu-dominio.com/auth/callback`

### SQL Editor — esquema completo

**Proyecto nuevo:** ejecuta `schema-complete.sql`.

**Ya tienes tablas** (`profiles`, `reviews`, `user_coins`, `user_items`, …):

```
supabase/schema-migrate-run-all.sql
```

Copia **todo el archivo** en SQL Editor → Run (una sola vez). Incluye los fixes de `icon_url`, `shop_items.slug`, etc.

Alternativa equivalente: `schema-migrate-incremental.sql` (mismo contenido, con comentarios por sección).

Los archivos `schema.sql`, `schema-v2-community.sql`, … son históricos; el consolidado es `schema-complete.sql`.

### Realtime (foro en vivo)
**Database → Replication** → activa:
- `forum_posts`
- `post_reactions`

### Hacerte admin
Tras registrarte, descomenta al final de `schema-complete.sql` o ejecuta:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'tu@email.com');
```

---

## 2. En el proyecto Next.js

Rutas activas:
- `/login` — entrada (magic link o contraseña)
- `/auth/callback` — retorno de Supabase Auth
- `/admin` — moderación (solo editor/admin)
- `/perfil` — cuenta privada
- `/u/[username]` — perfil público
- `/api/comments` — comentarios en fichas
- `/api/submissions` — aportes de redacción
- `/api/user-lists` — listas personales
- `/api/user-reviews` — reseñas UGC
- `/api/review-votes` — votos útil/no útil
- `/api/forum-posts` — foro
- `/api/forum-reactions` — reacciones emoji
- `/api/profile/status` — estado de presencia
- `/api/profile/username` — @usuario y privacidad
- `/api/missions` — misiones diarias
- `/api/gamification` — títulos, tienda, insignias

---

## 3. Qué hace cada tabla

| Tabla | Uso |
|-------|-----|
| `profiles` | Usuario, rol, XP, nivel, @username, monedas, privacidad |
| `editorial_reviews` | Reseñas con estado draft → published |
| `review_moderation_log` | Historial de moderación |
| `comments` | Comentarios en fichas anime/manga |
| `community_submissions` | Aportes de texto de la comunidad |
| `user_lists` | Seguimiento unificado (anime, manga, juegos…) |
| `user_reviews` | Reseñas de usuarios con métricas JSON |
| `review_votes` | Votos de utilidad en reseñas |
| `forum_posts` | Foro polimórfico con tags y respuestas |
| `post_reactions` | Reacciones 🔥 😢 🏆 |
| `badges` / `user_badges` | Insignias y desbloqueos |
| `xp_events` | Historial de puntos de experiencia |
| `selectable_titles` | Títulos desbloqueables por nivel |
| `daily_missions` | Misiones diarias completadas |
| `shop_items` / `user_inventory` | Tienda de cosméticos (monedas) |
| `anime_cache` | Compatibilidad con APIs admin / cron |

---

## 4. Coste

- **Supabase:** plan gratis hasta límites de uso (auth, BD, storage básico).
- **Noticias en la app:** solo RSS (€0). No configurar GNews/NewsAPI.
- **Vercel:** plan hobby gratis para proyectos personales.

Estado del plan y pendientes: `docs/PLAN-MAESTRO-FASES.md`

---

## 5. Seguridad

- **anon / publishable key** → solo en cliente; RLS protege los datos.
- **service_role / secret key** → solo en servidor; nunca en el front.
- No subas `.env.local` a GitHub.
