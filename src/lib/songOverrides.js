// Per-device corrections layered on top of the bundled song data -- mainly
// for fixing auto-guessed tempo tags (fast/slow/offering) and keys without
// needing a backend. Stored in this browser's localStorage.

const KEY = "arw-worship-song-overrides";

export function getOverrides() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function setOverride(songId, patch) {
  const overrides = getOverrides();
  overrides[songId] = { ...overrides[songId], ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(overrides));
  } catch (e) {
    /* ignore storage errors */
  }
}

export function applyOverrides(songs) {
  const overrides = getOverrides();
  return songs.map((s) =>
    overrides[s.id] ? { ...s, ...overrides[s.id] } : s
  );
}

export function clearOverride(songId) {
  const overrides = getOverrides();
  if (songId in overrides) {
    delete overrides[songId];
    try {
      localStorage.setItem(KEY, JSON.stringify(overrides));
    } catch (e) {
      /* ignore storage errors */
    }
  }
}
