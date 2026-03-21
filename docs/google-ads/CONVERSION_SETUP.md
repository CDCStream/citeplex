# Dönüşüm takibi (GA4 + Google Ads)

## Sitede ne yapıldı?

1. **GA4** — `NEXT_PUBLIC_GA_MEASUREMENT_ID` (mevcut). Çerez onayı sonrası yüklenir.
2. **Google Ads tag** — `NEXT_PUBLIC_GOOGLE_ADS_ID` (format: `AW-XXXXXXXXXX`). İsteğe bağlı; reklam hesabındaki global site etiketi ile aynı olmalı.
3. **Olaylar (client, onay sonrası):**
   - `purchase` — `/checkout/success` (abonelik ödemesi sonrası). `checkout_id` / `checkoutId` query varsa transaction id olarak kullanılır.
   - `sign_up` — İlk girişte `?welcome=1` (auth callback ekler); dashboard’da bir kez tetiklenir.

4. **Google Ads dönüşüm aksiyonları** — env ile:
   - `NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_SEND_TO` = `AW-XXXX/label` (abonelik)
   - `NEXT_PUBLIC_GOOGLE_ADS_SIGNUP_SEND_TO` = `AW-XXXX/label` (kayıt; isteğe bağlı)

Değerleri Google Ads → **Goals** → **Conversions** → **Website** akışında oluşturduğun aksiyondan kopyala (`send_to` tam metni).

## Google Ads panelinde doğrulama

1. **Araçlar ve ayarlar** → **Ölçüm** → **Dönüşümler** — yeni dönüşüm ekle (Web sitesi).
2. Aynı Google tag (gtag) kullanılıyorsa **Google Analytics 4** ile içe aktarma da mümkün: GA4’te `purchase` / `sign_up` olaylarını işaretle, Ads’te “İçe aktarılan dönüşümler” ile bağla.
3. **Teşhis** — Tag Assistant veya Geliştirici araçları → Network’te `googleadservices.com` / `collect` istekleri.

## Test

- Çerez banner’ında **Accept** sonrası test kullanıcısıyla checkout success veya yeni kayıt akışı.
- Geliştirmede `NEXT_PUBLIC_*` değerlerini `.env` içinde doldur; production’da Vercel env.

## Not

Çerez reddedilirse dönüşüm gönderilmez (KVKK/GDPR ile uyumlu varsayılan). İsterseniz gelecekte “pazarlama çerezleri” için ayrı onay akışı genişletilebilir.
