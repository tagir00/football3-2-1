import { startRouter } from './core/router.js';

startRouter();

if ('serviceWorker' in navigator) {
  // Yeni bir surum yayinlaninca sw.js hemen devreye girer; sayfa da yeni
  // dosyalari kullansin diye kendini bir kez yeniler. Oyun ortasinda asla
  // yenilemez: ana menude degilse ana menuye donulene kadar bekler.
  let hasController = Boolean(navigator.serviceWorker.controller);
  let reloadPending = false;
  const onHub = () => !window.location.hash.replace(/^#\/?/, '');

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Ilk ziyarette sw.js sayfayi ilk kez sahiplenir; yenilemeye gerek yok.
    // Ayni oturumda sonradan gelen guncellemeler ise yenilemeyi tetikler.
    if (!hasController) {
      hasController = true;
      return;
    }
    if (onHub()) {
      window.location.reload();
    } else {
      reloadPending = true;
    }
  });

  window.addEventListener('hashchange', () => {
    if (reloadPending && onHub()) {
      window.location.reload();
    }
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then((registration) => {
        // Ana ekrana eklenmis uygulama gunlerce acik kalabilir; one her
        // geldiginde yeni surum var mi diye bak.
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            registration.update().catch(() => {});
          }
        });
      })
      .catch(() => {});
  });
}
