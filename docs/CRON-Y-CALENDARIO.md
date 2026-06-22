# Cron y calendario editorial

Guía para programar reseñas automáticas y ver cuándo deben publicarse.

---

## Resumen rápido

| Tarea | Cuándo | Endpoint |
|-------|--------|----------|
| Generar borradores IA | Lunes 6:00 UTC | `POST /api/cron/generate-reviews` |
| Publicar programadas | Todos los días 8:00 UTC | `POST /api/cron/publish-scheduled` |
| Ver calendario | Cuando quieras | `/admin/calendario` |
| Aprobar manualmente | Cuando quieras | `/admin` |

---

## 1. Configurar en Vercel

### Paso A — Variable secreta

En **Vercel → tu proyecto → Settings → Environment Variables**:

```
CRON_SECRET = un-texto-largo-aleatorio-min-32-chars
```

Aplícala a Production (y Preview si quieres probar crons en preview).

### Paso B — `vercel.json` (ya en el repo)

```json
{
  "crons": [
    { "path": "/api/cron/generate-reviews", "schedule": "0 6 * * 1" },
    { "path": "/api/cron/publish-scheduled", "schedule": "0 8 * * *" }
  ]
}
```

- **Lunes 6:00 UTC** = genera reseñas del top anime/manga y las programa en el calendario.
- **Diario 8:00 UTC** = publica las que ya cumplieron su `scheduled_publish_at`.

> En México (CST, UTC-6): 6:00 UTC ≈ medianoche; 8:00 UTC ≈ 2:00 AM. Ajusta el `schedule` en `vercel.json` si prefieres otra hora.

### Paso C — Deploy

Haz push a `main`. Vercel activa los crons solo en **plan Pro** (o superior). En Hobby los crons no corren solos; puedes dispararlos manualmente (paso 4).

### Paso D — Supabase

Ejecuta **`supabase/schema-v10-editorial-calendar.sql`** para columnas:

- `scheduled_publish_at` — fecha de publicación sugerida
- `display_title` — título en el calendario
- `season_key` — ej. `2026-spring`

---

## 2. Probar en local

```powershell
# Terminal 1
npm run dev

# Terminal 2 — generar borradores (sin CRON_SECRET en dev funciona)
curl -X POST http://localhost:3000/api/cron/generate-reviews `
  -H "Authorization: Bearer TU_CRON_SECRET"

# Publicar las que ya vencieron
curl -X POST http://localhost:3000/api/cron/publish-scheduled `
  -H "Authorization: Bearer TU_CRON_SECRET"
```

Requisitos locales:

- `REPLICATE_API_TOKEN` — para generar texto IA
- `SUPABASE_SECRET_KEY` — para guardar borradores
- `CRON_SECRET` — opcional en desarrollo (sin él el cron permite en `NODE_ENV=development`)

---

## 3. Calendario en admin

URL: **`/admin/calendario`**

Muestra:

- Reseñas **programadas**, **pendientes** y **publicadas**
- Fecha sugerida (`scheduled_publish_at`)
- Temporada (`season_key`, ej. primavera 2026)
- Estado: Publicada, Pendiente, Borrador, Atrasada

**Flujo recomendado:**

1. El cron del lunes genera borradores con fechas espaciadas (cada 2 días).
2. Revisas en `/admin` y apruebas las que te gusten **antes** de la fecha, o dejas que el cron las publique solo.
3. El cron diario publica las que llegaron a su fecha (si siguen en `pending`).

---

## 4. Rotación en home (tendencias)

La home **no muestra siempre los mismos 6 anime**:

- Mezcla anime de la **temporada actual** + top MAL.
- El orden **cambia cada día** dentro de la misma temporada (`lib/rotate.ts`).
- La etiqueta muestra la temporada: *Tendencias · Primavera 2026*.

Así el sitio se siente vivo sin coste de API extra.

---

## 5. Horarios de cron — sintaxis

Formato cron de Vercel (5 campos):

```
minuto hora día-mes mes día-semana
```

Ejemplos:

| Expresión | Significado |
|-----------|-------------|
| `0 6 * * 1` | Lunes 6:00 UTC |
| `0 8 * * *` | Cada día 8:00 UTC |
| `0 12 * * 3` | Miércoles 12:00 UTC |
| `0 6 1 * *` | Día 1 de cada mes 6:00 UTC |

---

## 6. Qué hace cada cron por dentro

### `generate-reviews`

1. Pide top 10 anime + top 5 manga a Jikan.
2. Genera reseña con Replicate (o fallback).
3. Guarda en `data/reviews/` y Supabase como `pending`.
4. Asigna `scheduled_publish_at` escalonado (slot 0, 2, 4… días).
5. Guarda `season_key` de la temporada actual.

### `publish-scheduled`

1. Busca filas con `scheduled_publish_at <= ahora` y status `pending` o `draft`.
2. Pasa a `published` y marca `published_at`.
3. Máximo 20 por ejecución.

---

## 7. Si algo falla

| Síntoma | Revisar |
|---------|---------|
| Cron no corre | Plan Vercel Pro, `vercel.json` desplegado |
| 401 Unauthorized | `CRON_SECRET` en Vercel coincide con el header |
| Sin borradores | `REPLICATE_API_TOKEN`, logs en Vercel Functions |
| Calendario vacío | SQL v10 ejecutado, Supabase conectado |
| Publicación no automática | Fecha `scheduled_publish_at` en el pasado, status `pending` |

---

## 8. Enlaces útiles

- Guía general: [`GUIA-IMPLEMENTACION.md`](./GUIA-IMPLEMENTACION.md)
- Agente reseñas: `.cursor/skills/review-agent/SKILL.md`
- SQL calendario: `supabase/schema-v10-editorial-calendar.sql`
