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
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 Measurement ID (`G-...`). Sadece çerez banner’ında **Accept All** sonrası yüklenir. |
| `NEXT_PUBLIC_AHREFS_WEB_ANALYTICS_KEY` | Ahrefs Web Analytics `data-key`. Çerez onayı sonrası yüklenir. |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | GSC HTML etiketi doğrulama **content** değeri (isteğe bağlı). |

## Google Search Console

1. Özellik URL: **`https://www.citeplex.io`**
2. Doğrulama: **HTML etiketi** → `content` kodunu kopyala → Vercel’e `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` olarak ekle → redeploy.
3. GSC’de **Sitemap**: `https://www.citeplex.io/sitemap.xml`
