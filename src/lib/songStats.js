// Tracks how often each song gets used in a generated setlist, so the
// worship leader can spot overplayed songs and ones that haven't come up
// in a while. Stored only in this browser's localStorage -- there's no
// backend, so counts only reflect setlists built on this device. If
// setlists are always built from the same phone/computer, that's a
// complete picture; if they're built from more than one device, each
// device keeps its own separate tally.

const KEY = "arw-worship-song-usage";

export function getUsageEvents() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveUsageEvents(events) {
  try {
    localStorage.setItem(KEY, JSON.stringify(events));
  } catch (e) {
    /* ignore storage errors */
  }
}

// Records one usage event per song in the setlist, tagged with the
// setlist's service date (falls back to today if missing/invalid).
export function recordSetlistUsage(setlist) {
  const songIds = (setlist.slots || [])
    .map((s) => s.songId)
    .filter(Boolean);
  if (songIds.length === 0) return;

  let date = setlist.date;
  if (!date || Number.isNaN(new Date(date).getTime())) {
    date = new Date().toISOString().slice(0, 10);
  }

  const events = getUsageEvents();
  const ts = Date.now();
  songIds.forEach((songId) => {
    events.push({ songId, date, ts });
  });
  saveUsageEvents(events);
}

// Aggregates usage events into per-song stats: total plays, plays this
// calendar year, plays this calendar month, and the most recent date
// played. Songs with zero plays are included too (count 0), so songs
// that have never been picked are easy to spot.
export function getSongUsageStats(songs) {
  const events = getUsageEvents();
  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonthKey = `${thisYear}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const bySong = {};
  songs.forEach((s) => {
    bySong[s.id] = {
      songId: s.id,
      title: s.title,
      total: 0,
      thisYear: 0,
      thisMonth: 0,
      lastPlayed: null,
    };
  });

  events.forEach((ev) => {
    const entry = bySong[ev.songId];
    if (!entry) return; // song may have been removed/renamed since
    entry.total += 1;
    const evDate = new Date(ev.date);
    if (!Number.isNaN(evDate.getTime())) {
      if (evDate.getFullYear() === thisYear) entry.thisYear += 1;
      const evMonthKey = `${evDate.getFullYear()}-${String(evDate.getMonth() + 1).padStart(2, "0")}`;
      if (evMonthKey === thisMonthKey) entry.thisMonth += 1;
      if (!entry.lastPlayed || ev.date > entry.lastPlayed) entry.lastPlayed = ev.date;
    }
  });

  return Object.values(bySong);
}

export function getUsageSummary() {
  const events = getUsageEvents();
  if (events.length === 0) return { totalEvents: 0, earliestDate: null, setlistCount: 0 };
  const dates = events.map((e) => e.date).filter(Boolean).sort();
  const setlistTimestamps = new Set(events.map((e) => `${e.date}|${e.ts}`.split("|")[1]));
  return {
    totalEvents: events.length,
    earliestDate: dates[0] || null,
    setlistCount: setlistTimestamps.size,
  };
}
