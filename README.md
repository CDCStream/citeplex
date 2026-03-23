# Citeplex

AI search visibility tracking across 7 engines — Next.js 15, Supabase, Polar.sh.

## Repo erişimi (CDCStream / fuatsezer)

Push ve Vercel deploy için GitHub tarafında **`fuatsezer`** hesabının tanımlı olması gerekir. Adım adım: **[docs/GITHUB_ACCESS.md](./docs/GITHUB_ACCESS.md)**

## Geliştirme

```bash
npm install
npm run dev
```

## Ortam değişkenleri

`.env` dosyasını yerelde oluşturun (repoya commit edilmez). Üretimde Vercel **Environment Variables** kullanın.

| Değişken | Açıklama |
|----------|----------|
| `NEXT_PUBLIC_APP_URL` | Üretimde **`https://www.citeplex.io`** (sitemap, Open Graph, canonical). |
| `NEXT_PUBLIC_SUPABASE_URL` | Üretimde **`https://auth.citeplex.io`** (custom domain). `NEXT_PUBLIC_SUPABASE_ANON_KEY` aynı kalır. Ayrıntı: **[docs/SUPABASE_CUSTOM_DOMAIN.md](./docs/SUPABASE_CUSTOM_DOMAIN.md)** |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 Measurement ID (`G-...`). Sadece çerez banner’ında **Accept All** sonrası yüklenir. |
| `NEXT_PUBLIC_AHREFS_WEB_ANALYTICS_KEY` | Ahrefs Web Analytics `data-key`. `layout` içinde `beforeInteractive` ile yüklenir (Ahrefs doğrulaması için gerekli). |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | GSC HTML etiketi doğrulama **content** değeri (isteğe bağlı). |
| `OUTRANK_WEBHOOK_SECRET` | Outrank webhook paylaşılan gizli anahtar (üretimde zorunlu önerilir). |
| `BLOG_ADMIN_SECRET` | İsteğe bağlı: `POST /api/blog/save` için `x-admin-secret` başlığı. |
| `BLOG_DEFAULT_AUTHOR` | İsteğe bağlı; Outrank yazar göndermezse kullanılır (varsayılan: Citeplex Team). |

## Blog (Outrank)

- SQL: **`blog-posts-migration.sql`** dosyasını Supabase SQL Editor’de çalıştırın.
- Detaylı kurulum ve Outrank’ta webhook kaydı: **[docs/BLOG_OUTRANK.md](./docs/BLOG_OUTRANK.md)**

## Supabase e-posta şablonları

Auth → Email Templates içinde **Confirm signup** ve **Reset password** için HTML gövdeleri: **[docs/email-templates/](./docs/email-templates/)** (`supabase-confirm-email.html`, `supabase-reset-password.html`). İçerikte logo `https://www.citeplex.io/logo.png` kullanır; farklı domain için `img` `src` değerini güncelleyin.

## Google Search Console

1. Özellik URL: **`https://www.citeplex.io`**
2. Doğrulama (birini veya ikisini):
   - **HTML etiketi:** `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` = meta `content` değeri → Vercel’de ayarla → redeploy (`layout` otomatik ekler).
   - **HTML dosyası:** `public/google1150acf395a74ffc.html` — canlıda `https://www.citeplex.io/google1150acf395a74ffc.html` açılmalı.
3. GSC’de **Sitemap**: `https://www.citeplex.io/sitemap.xml`

## SEO & tarayıcı dosyaları

| Dosya | URL |
|--------|-----|
| `robots.ts` → `robots.txt` | `https://www.citeplex.io/robots.txt` |
| `sitemap.ts` → `sitemap.xml` | `https://www.citeplex.io/sitemap.xml` |
| `llms.txt` (AI özet / tarama notları) | `https://www.citeplex.io/llms.txt` |
| `security.txt` (RFC 9116) | `https://www.citeplex.io/.well-known/security.txt` |

Canonical taban `NEXT_PUBLIC_APP_URL` ile üretilir (`src/lib/site.ts`).
