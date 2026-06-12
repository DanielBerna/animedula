# Supabase — guía rápida Animédula

## 1. En el panel de Supabase

### Project Settings → API
Copia estos tres valores a `.env.local` y a Vercel:

| Variable | Dónde está |
|----------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role (secreto) |

### Authentication → Providers
- Activa **Email** (magic link o contraseña).
- Opcional: **Google** (necesitas Client ID en Google Cloud).

### Authentication → URL Configuration
- **Site URL:** `http://localhost:3000` (dev) y tu dominio en producción.
- **Redirect URLs:**  
  `http://localhost:3000/auth/callback`  
  `https://tu-dominio.com/auth/callback`

### SQL Editor
Ejecuta el archivo `schema.sql` de esta carpeta.

### Hacerte admin
Tras registrarte en la app (cuando exista login), en SQL Editor:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'tu@email.com');
```

## 2. En el proyecto Next.js (implementado)

```bash
npm install @supabase/ssr
```

Rutas activas:
- `/login` — entrada (magic link o contraseña)
- `/auth/callback` — retorno de Supabase Auth
- `/admin` — moderación (solo editor/admin)
- `/api/comments` — comentarios en fichas
- `/api/submissions` — aportes de redacción

## 3. Qué hace cada tabla

| Tabla | Uso |
|-------|-----|
| `profiles` | Usuario + rol (user / contributor / editor / admin) |
| `editorial_reviews` | Reseñas con estado draft → published |
| `comments` | Comentarios en fichas |
| `community_submissions` | Aportes de texto de la comunidad |
| `anime_cache` | Compatibilidad con APIs admin actuales |

## 4. Seguridad

- **anon key** → solo en cliente; RLS protege los datos.
- **service_role** → solo en servidor (API routes, cron); nunca en el front.
- No subas `.env.local` a GitHub.
