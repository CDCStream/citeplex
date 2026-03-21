# GitHub & Vercel erişim — `fuatsezer`

Push yapan hesabın **CDCStream** org altında tanımlı ve repoda **Write** yetkisi olması gerekir. Aşağıdakileri **GitHub web** üzerinden yapın (repo dosyasından otomatik olmaz).

## 1. Organizasyona üye ekleme (org Owner / Admin)

1. GitHub → **Organizations** → **CDCStream**
2. **People** → **Invite member**
3. Kullanıcı: **`fuatsezer`** (veya e-posta: `fuatsezer199696@gmail.com`)
4. Rol: **Member** (veya ihtiyaca göre)
5. Daveti kabul ettirsin

## 2. Sadece bu repoya erişim (alternatif)

Org’a eklemeden sadece repoya collaborator:

1. `https://github.com/CDCStream/citeplex` → **Settings** → **Collaborators and teams**
2. **Add people** → **`fuatsezer`**
3. Rol: **Write** (push için yeterli)

## 3. Yerel Git (push yapan kimliği netleştir)

Bu repoda önerilen ayar (sadece bu proje):

```bash
git config user.name "Fuat Sezer"
git config user.email "fuatsezer199696@gmail.com"
```

Bu e-posta, GitHub hesabında **verified** olmalı.

## 4. Vercel ile ilişki

Vercel “commit author blocked” hatası için:

- **fuatsezer** hem GitHub’da repoya yazabilmeli hem de **Vercel team (makos ai)** üyesi olmalı (zaten üye olduğunuz söylenmişti).
- Hâlâ bloklanıyorsa: Vercel **Team Settings** içinde commit author / deployment kısıtını kontrol edin.
