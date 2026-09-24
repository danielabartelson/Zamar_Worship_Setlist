// Brand-new songs added from the "Add Song" screen, stored locally so
// they show up on this device right away (before -- or even without --
// a GitHub sync). Kept separate from songOverrides.js because those
// patch an *existing* bundled song by id; these are whole new songs that
// don't exist in songs.json yet.

const KEY = "arw-worship-added-songs";

export function getAddedSongs() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveAddedSongs(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch (e) {
    /* ignore storage errors */
  }
}

export function addLocalSong(song) {
  const list = getAddedSongs();
  list.push(song);
  saveAddedSongs(list);
}

export function removeAddedSong(id) {
  saveAddedSongs(getAddedSongs().filter((s) => s.id !== id));
}

export function slugify(title) {
  return (title || "untitled")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "untitled";
}

export function uniqueId(title, existingSongs) {
  const base = slugify(title);
  const ids = new Set(existingSongs.map((s) => s.id));
  if (!ids.has(base)) return base;
  let i = 2;
  while (ids.has(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}
