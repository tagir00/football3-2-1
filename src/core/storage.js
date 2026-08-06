const PREFIX = 'oyun-kutusu::';

export function getItem(key, fallback = null) {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function setItem(key, value) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // localStorage kullanilamiyor olabilir (gizli mod, kota) - sessizce yut.
  }
}

export function removeItem(key) {
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    // yok sayilir
  }
}
