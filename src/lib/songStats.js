// Every time a setlist is generated, one usage event per song is saved
// (this device only -- there's no backend). The History page is built
// entirely from these events: the list of setlists, the monthly/yearly
// totals, and the per-song counts.

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

// Saves the setlist into history. If it's the same setlist being
// regenerated after an edit, pass the ts returned last time and the old
// record is replaced instead of double-counted. Returns the new ts.
export function recordSetlistUsage(setlist, replaceTs) {
  let events = getUsageEvents();
  if (replaceTs) events = events.filter((e) => e.ts !== replaceTs);

  const slots = (setlist.slots || []).filter((s) => s.songId);
  if (slots.length === 0) {
    saveUsageEvents(events);
    return null;
  }

  let date = setlist.date;
  if (!date || Number.isNaN(new Date(date).getTime())) {
    date = new Date().toISOString().slice(0, 10);
  }

  const ts = Date.now();
  slots.forEach((s) => {
    events.push({ songId: s.songId, date, ts, service: setlist.service || "", slot: s.id });
  });
  saveUsageEvents(events);
  return ts;
}

// One entry per generated setlist, newest first.
export function getSetlistHistory() {
  const groups = new Map();
  getUsageEvents().forEach((ev) => {
    if (!groups.has(ev.ts)) {
      groups.set(ev.ts, { ts: ev.ts, date: ev.date, service: ev.service || "", songIds: [] });
    }
    groups.get(ev.ts).songIds.push(ev.songId);
  });
  return [...groups.values()].sort((a, b) => b.date.localeCompare(a.date) || b.ts - a.ts);
}

export function monthLabel(key) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// Years -> months -> setlists, each level with setlist and song totals.
export function buildHistoryTree(history) {
  const years = new Map();
  history.forEach((sl) => {
    const year = sl.date.slice(0, 4);
    const monthKey = sl.date.slice(0, 7);
    if (!years.has(year)) years.set(year, { year, setlists: 0, songs: 0, months: new Map() });
    const y = years.get(year);
    if (!y.months.has(monthKey)) {
      y.months.set(monthKey, { key: monthKey, label: monthLabel(monthKey), setlists: [], songs: 0 });
    }
    const m = y.months.get(monthKey);
    m.setlists.push(sl);
    m.songs += sl.songIds.length;
    y.setlists += 1;
    y.songs += sl.songIds.length;
  });
  return [...years.values()]
    .sort((a, b) => b.year.localeCompare(a.year))
    .map((y) => ({ ...y, months: [...y.months.values()].sort((a, b) => b.key.localeCompare(a.key)) }));
}

// Choices for the stats period picker: every month that has setlists, a
// full-year total after each year's months, and all time.
export function getPeriodOptions(tree) {
  const opts = [];
  tree.forEach((y) => {
    y.months.forEach((m) => opts.push({ value: "month:" + m.key, label: m.label }));
    opts.push({ value: "year:" + y.year, label: `${y.year} — full year` });
  });
  opts.push({ value: "all", label: "All time" });
  return opts;
}

// Per-song play counts for one period (a month, a year, or all time),
// plus each song's all-time last-played date. Songs never played in the
// period are included with 0 so gaps are easy to spot.
export function getSongStatsForPeriod(songs, period) {
  const prefix = period === "all" ? "" : period.split(":")[1];
  const bySong = {};
  songs.forEach((s) => {
    bySong[s.id] = { songId: s.id, title: s.title, count: 0, lastPlayed: null };
  });
  getUsageEvents().forEach((ev) => {
    const entry = bySong[ev.songId];
    if (!entry) return;
    if (ev.date.startsWith(prefix)) entry.count += 1;
    if (!entry.lastPlayed || ev.date > entry.lastPlayed) entry.lastPlayed = ev.date;
  });
  return Object.values(bySong);
}
