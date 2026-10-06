// Once a song change has been published for everyone and the app has
// rebuilt, this device's own saved copy is redundant. Clearing it matters:
// otherwise an old local copy would keep hiding later edits made from
// another device. Runs once each time the app opens.
import { getOverrides } from "./songOverrides";
import { getAddedSongs } from "./addedSongs";

const OVERRIDES_KEY = "arw-worship-song-overrides";
const ADDED_KEY = "arw-worship-added-songs";

export function pruneLocalSongs(bundledSongs) {
  try {
    const byId = {};
    bundledSongs.forEach((s) => (byId[s.id] = s));

    const overrides = getOverrides();
    let changed = false;
    Object.keys(overrides).forEach((id) => {
      const base = byId[id];
      if (!base) return;
      const same = Object.keys(overrides[id]).every(
        (k) => JSON.stringify(overrides[id][k]) === JSON.stringify(base[k])
      );
      if (same) {
        delete overrides[id];
        changed = true;
      }
    });
    if (changed) localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));

    const added = getAddedSongs();
    const keep = added.filter((s) => !byId[s.id]);
    if (keep.length !== added.length) localStorage.setItem(ADDED_KEY, JSON.stringify(keep));
  } catch (e) {
    /* ignore storage errors */
  }
}
