# Kulup Logo Assets

Bu proje artik offline-oncelikli logo akisi kullanir.

## Nasil Calisir

1. Uygulama once `assets/logos/clubs/*.png` dosyalarini dener.
2. Yerel dosya varsa kulup logosu dogrudan repodan gelir.
3. Yerel dosya yoksa sadece fallback arma gosterilir.

## Otomatik Doldurma

Kulup logolarini klasore otomatik cekmek icin:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\sync-local-club-logos.ps1
```

Notlar:

1. Script kulup listesini `src/data.js` icinden okur.
2. Once `assets/logos/remote-badges.json` icindeki URL'leri dener.
3. Bulamazsa TheSportsDB uzerinden logo arar.
4. Cikan dosyalar `assets/logos/clubs/<slug>.png` olarak kaydedilir.