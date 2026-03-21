# Supabase custom domain (`auth.citeplex.io`)

Custom domain aktif olduktan sonra uygulama ve Google OAuth için şunları güncelleyin.

## 1. Vercel (veya hosting) environment variables

| Değişken | Üretim değeri |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://auth.citeplex.io` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Değişmez (Supabase Dashboard → Settings → API) |

`NEXT_PUBLIC_APP_URL` = `https://www.citeplex.io` (veya kullandığınız canonical URL).

Deploy / **Redeploy** yapın.

## 2. Google Cloud — OAuth 2.0 Web client

**APIs & Services** → **Credentials** → OAuth istemcisi → **Authorized redirect URIs**:

- Eski adresi tutabilirsiniz (geçiş için):  
  `https://atvorwkmjcuektllhqaq.supabase.co/auth/v1/callback`
- **Mutlaka ekleyin:**  
  `https://auth.citeplex.io/auth/v1/callback`

[Supabase custom domains](https://supabase.com/docs/guides/platform/custom-domains) dokümantasyonu, geçiş sürecinde her iki callback’in de eklenmesini önerir.

**OAuth consent screen** (isim + logo) ayrıca Google Cloud’da; DNS ile değişmez.

## 3. Yerel `.env`

İsterseniz yerelde de `NEXT_PUBLIC_SUPABASE_URL=https://auth.citeplex.io` kullanın; anon key aynı kalır.  
Sadece lokal geliştirmede varsayılan `*.supabase.co` kullanmaya devam etmek de mümkündür (Supabase her iki URL’yi de kabul eder).

## 4. Repo

Kod `process.env.NEXT_PUBLIC_SUPABASE_URL` ile okur; ekstra kod değişikliği gerekmez.
