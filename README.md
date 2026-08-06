# Futbol 3-2-1

Mobil odakli, iki kisilik futbol eslestirme oyunu. Uygulama sadece `3-2-1` sayaci ve rastgele eslesme uretir. Oyuncular isimleri kendi aralarinda soyler ve puani kendileri tutar.

## Modlar

- `Kulup - Kulup`: Iki farkli kulup gelir.
- `Ulke - Kulup`: Bir tarafta ulke, diger tarafta kulup gelir.
- `Oyuncu Bulamadik`: Sadece `Ulke - Kulup` modunda vardir. Yeni eslesme getirir ama ulke ve kulubun taraflarini degistirmez.
- `Baslat`: Her yeni turda yeniden `3-2-1` sayaci oynatir. `Ulke - Kulup` modunda her `Baslat` sonrasi ulke ve kulup taraf degistirir.

## Telefonlara Linkle Gonderme

Bu proje bir `PWA` olarak hazirlandi. Yani store'a cikmadan da link ile paylasilabilir.

1. Dosyalari `GitHub Pages`, `Netlify` veya `Vercel` gibi statik bir hosting'e yukle.
2. Olusan linki arkadaslarina gonder.
3. Telefonda tarayicidan acsinlar.
4. `Ana ekrana ekle` secenegi ile uygulama gibi kullanabilsinler.

## Logo Notu

- Ulkeler bayrak gorselleriyle gelir.
- Kulupler icin uygulama once yerel logo klasorune bakar: `assets/logos/clubs/`.
- Yerel logo yoksa runtime sirasinda `TheSportsDB` uzerinden rozet cekilir.
- Uzaktaki logo kaynagi cevap vermezse uygulama akisi bozulmasin diye stilize fallback arma kullanilir.
- Yerel lisansli asset yapisi ve tum beklenen dosya adlari `assets/logos/club-manifest.json` icine eklendi.
- Store surumune gecmeden once kulup logolari ve markalari icin lisans veya kullanim izni tarafini netlestirmek gerekir.

## Oyuncu Verisi Plani

- Ikinci yontem olarak oyuncu bazli veri modeli secildi.
- Baslangic veri seti `src/playerData.js` icine eklendi.
- Her oyuncu icin `name`, `birthYear`, `tier`, `countries`, `clubs` alanlari tutuluyor.
- `tier` seviyeleri `elite`, `high`, `solid` olarak ayriliyor.
- Veri seti 1970 ve sonrasi dogan, bilinebilir kariyeri olan oyuncularla baslatildi.
- Ayni dosyada `Kulup-Kulup` ve `Ulke-Kulup` eslesmelerini oyuncu verisinden ureten yardimci fonksiyonlar var.
- Sonraki adim oyunun rastgele eslesme mantigini bu oyuncu tabanli baglanti havuzuna tasimak.