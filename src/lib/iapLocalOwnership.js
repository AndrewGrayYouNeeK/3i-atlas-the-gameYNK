const STORAGE_KEY = 'atlas3i_iap_owned_skins';

function readRaw() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function writeRaw(skinIds) {
  if (typeof window === 'undefined') return;
  const unique = Array.from(new Set(skinIds.filter(Boolean)));
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
}

/** Skins unlocked via Apple IAP on this device (works offline / before sign-in). */
export function getLocalIapOwnedSkins() {
  return readRaw();
}

export function addLocalIapOwnedSkin(skinId) {
  if (!skinId || skinId === 'default') return getLocalIapOwnedSkins();
  const next = [...readRaw(), skinId];
  writeRaw(next);
  return getLocalIapOwnedSkins();
}

export function addLocalIapOwnedSkins(skinIds) {
  writeRaw([...readRaw(), ...(skinIds || [])]);
  return getLocalIapOwnedSkins();
}

/** Merge profile ownership with device IAP unlocks. */
export function mergeOwnedSkins(profileOwned = ['default'], localOwned = getLocalIapOwnedSkins()) {
  return Array.from(new Set(['default', ...(profileOwned || []), ...(localOwned || [])]));
}
