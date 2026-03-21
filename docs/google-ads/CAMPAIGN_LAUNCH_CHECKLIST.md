# İlk Search kampanyası — uygulama kontrol listesi

Bu dosya “İlk Search kampanyası (maliyet + dönüşüm)” planı ile uyumludur. Panelde sırayla işaretle.

---

## 1) Dönüşüm doğrulama (GA4 `purchase`)

**Hedef:** `Citeplex (web) purchase` (veya eşdeğer) aksiyonunun doğru mülk ve etkinlikle bağlı olduğundan emin ol.

- [ ] **Google Ads** → **Hedefler** → **Dönüşümler** → **Özet** → ilgili satıra tıkla.
- [ ] **Kaynak:** Google Analytics (GA4) görünüyor.
- [ ] **GA4 etkinliği:** `purchase`.
- [ ] **GA4 mülkü:** Canlı sitedeki ölçümle aynı mülk (Citeplex).
- [ ] **İşlem optimizasyonu:** Satın alma / birincil işlem uygun.
- [ ] **Veri yöneticisi:** GA4 bu Ads hesabına bağlı ([Veri yöneticisi](https://ads.google.com) → bağlı ürünler).

**Site tarafı:** Vercel’de `NEXT_PUBLIC_GA_MEASUREMENT_ID` (G-…) ve `NEXT_PUBLIC_GOOGLE_ADS_ID` (AW-…) tanımlı; çerez banner’ında kabul sonrası `purchase` tetiklenir ([CONVERSION_SETUP.md](./CONVERSION_SETUP.md)).

---

## 2) Search kampanyası oluşturma

**Kampanya türü:** **Ağ** → **Search** (Performans Maks. değil).

**Konumlar (Faz 1):**

- United States, United Kingdom, Canada, Australia, New Zealand, Ireland  
- **Dil:** English  
- Diğer ülkeleri **hariç tut** (veya sadece bu listeyi hedefle).

**Günlük bütçe:** Başlangıç **$30–80** (tek kampanya testi).

**Reklam grupları (2 adet):**

| Reklam grubu | İçerik | Eşleme |
|--------------|--------|--------|
| **HighIntent_A** | [keywords-and-campaign.md](./keywords-and-campaign.md) “Ad group 1 — Yüksek niyet (A)” | Phrase / Exact |
| **MidIntent_B** | Aynı dosyada “Ad group 2 — Satın alma niyeti (B)” | Phrase / Exact |

**Negatif anahtar kelimeler:** Kampanya veya paylaşılan liste — [keywords-and-campaign.md](./keywords-and-campaign.md) negatif listesi.

**Son URL:** `https://www.citeplex.io/pricing` veya `https://www.citeplex.io/`  
**İzleme şablonu (isteğe bağlı):** `{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign=search_phase1&utm_content={keyword}` (Ağ ayarlarında veya reklam düzeyinde).

**Reklam metinleri:** Ürün: AI görünürlüğü, 7 motor, günlük tarama; net CTA (Sign up / View pricing).

**Dönüşüm hedefi:** Kampanya ayarlarında **içe aktarılan** `purchase` dönüşümünü kullan (Smart Bidding’e geçince).

---

## 3) Teklif stratejisi (zaman çizelgesi)

| Dönem | Strateji | Not |
|-------|----------|-----|
| İlk 1–2 hafta | **Maks. tıklamalar** veya **Manuel CPC** | Dönüşüm verisi azken |
| Öğrenme sonrası | **Maks. dönüşümler** veya **Hedef CPA** | Haftalık ~15–30+ dönüşüm birikince geçiş |

- [ ] Hafta 1–2: Manuel CPC veya maks. tıklamalar ayarlandı.
- [ ] Yeterli dönüşümde: Teklif stratejisi güncellendi; `purchase` birincil dönüşüm.

---

## 4) 7–14 gün sonra — arama terimleri

- [ ] [search-terms-iteration.md](./search-terms-iteration.md) adımlarını uygula.
- [ ] ROAS / CPA tatmin edici ise [phase-2-geo.md](./phase-2-geo.md) ile Faz 2 ülkeleri ayrı kampanya veya bütçe ile değerlendir.

---

## Özet

| Kaynak | Dosya |
|--------|--------|
| Kelimeler + negatifler + Faz 1 ülkeler | [keywords-and-campaign.md](./keywords-and-campaign.md) |
| Dönüşüm / env | [CONVERSION_SETUP.md](./CONVERSION_SETUP.md) |
| Arama terimleri döngüsü | [search-terms-iteration.md](./search-terms-iteration.md) |
| Faz 2 ülkeler | [phase-2-geo.md](./phase-2-geo.md) |
