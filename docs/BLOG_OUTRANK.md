# Blog & Outrank webhook (Citeplex)

## 1. Database

Supabase Dashboard → **SQL** → `blog-posts-migration.sql` içeriğini çalıştırın.

- Tablo: `public.blog_posts`
- **RLS:** `anon` / `authenticated` sadece `status = 'published'` satırlarını okuyabilir. Yazma **service role** ile (webhook / admin API).

## 2. Environment variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (blog listesi SSR) |
| `SUPABASE_SERVICE_ROLE_KEY` | Webhook & `/api/blog/save` (sunucu tarafı) |
| `OUTRANK_WEBHOOK_SECRET` | Paylaşılan gizli anahtar (üretimde kullanın) |
| `BLOG_ADMIN_SECRET` | (İsteğe bağlı) Manuel `POST /api/blog/save` |
| `NEXT_PUBLIC_APP_URL` | Canonical / sitemap tabanı, örn. `https://www.citeplex.io` |

## 3. Outrank webhook URL

**Endpoint:** `POST https://<YOUR_DOMAIN>/api/outrank/webhook`

**Örnek (Citeplex):** `https://www.citeplex.io/api/outrank/webhook`

### Doğrulama (secret)

`OUTRANK_WEBHOOK_SECRET` tanımlıysa aşağıdakilerden **biri** eşleşmeli:

| Header | Value |
|--------|--------|
| `x-webhook-signature` | paylaşılan secret |
| `x-outrank-signature` | paylaşılan secret |
| `Authorization` | `Bearer <secret>` |

Secret boş bırakılırsa (sadece geliştirme) doğrulama atlanır — **üretimde mutlaka ayarlayın.**

### GET (doğrulama / health)

- `GET /api/outrank/webhook?challenge=...` veya `?hub.challenge=...` → düz metin olarak challenge döner (200).
- Parametre yoksa: `{ "status": "ok" }`

## 4. Payload şekilleri

Webhook, JSON gövdesinden makaleleri şu yapılardan normalize eder (örnekler):

- `data.articles[]`
- `articles[]`
- `data.article` / `article`
- `data` tek nesne veya dizi
- Üst düzey `title` / `content` / `html` / `body`

Eşleşen alan yoksa, **debug** için `draft` satır eklenir: slug `debug-webhook-<timestamp>`, içerik ham JSON (`<pre>`).

## 5. Manuel yayın (opsiyonel)

`POST https://<YOUR_DOMAIN>/api/blog/save`

**Headers:**

- `Content-Type: application/json`
- `x-admin-secret: <BLOG_ADMIN_SECRET>`

**Body:** Tek makale nesnesi (Outrank alanlarıyla uyumlu; `normalizeArticle` ile işlenir).

## 6. Sayfalar

- Liste: `/blog` (ISR ~60s)
- Detay: `/blog/[slug]`
- Sitemap: `/sitemap.xml` yayınlanan yazıları içerir; webhook başarılı olduktan sonra Google/Bing ping denemesi yapılır.

## 7. Marka

Varsayılan yazar: **Citeplex Team** (`BLOG_DEFAULT_AUTHOR` ile değiştirilebilir). Marka adı kodda **Citeplex** olarak kullanılır.
