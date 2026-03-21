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
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 Measurement ID (`G-...`). Sadece çerez banner’ında **Accept All** sonrası yüklenir. |
