import { useMemo, useState } from "react";
import { getSongUsageStats, getUsageSummary } from "../lib/songStats";
import "./SongUsageStats.css";

const SORTS = {
  most: { label: "Most played", cmp: (a, b) => b.total - a.total || a.title.localeCompare(b.title) },
  least: { label: "Least played", cmp: (a, b) => a.total - b.total || a.title.localeCompare(b.title) },
  stale: {
    label: "Not played in a while",
    cmp: (a, b) => {
      const ad = a.lastPlayed || "0000-00-00";
      const bd = b.lastPlayed || "0000-00-00";
      return ad.localeCompare(bd);
    },
  },
  az: { label: "A–Z", cmp: (a, b) => a.title.localeCompare(b.title) },
};

export default function SongUsageStats({ songs, onBack }) {
  const [sortKey, setSortKey] = useState("most");
  const [query, setQuery] = useState("");

  const summary = useMemo(() => getUsageSummary(), []);
  const stats = useMemo(() => getSongUsageStats(songs), [songs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = stats.filter((s) => !q || s.title.toLowerCase().includes(q));
    return [...rows].sort(SORTS[sortKey].cmp);
  }, [stats, query, sortKey]);

  return (
    <div className="song-stats">
      <button className="link-btn" onClick={onBack}>
        ← Back
      </button>
      <h1 className="stats-heading">Song Stats</h1>
      <p className="stats-help">
        Private to this device — counts every song used in a setlist you've
        generated here. {summary.setlistCount > 0
          ? `${summary.setlistCount} setlist${summary.setlistCount === 1 ? "" : "s"} tracked since ${summary.earliestDate}.`
          : "No setlists generated on this device yet."}
      </p>

      <input
        type="text"
        placeholder="Search songs…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="stats-search"
      />

      <div className="stats-sort-row">
        {Object.entries(SORTS).map(([key, s]) => (
          <button
            key={key}
            className={"stats-sort-btn" + (sortKey === key ? " stats-sort-btn-active" : "")}
            onClick={() => setSortKey(key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="stats-table">
        <div className="stats-row stats-row-head">
          <div className="stats-col-title">Song</div>
          <div className="stats-col-num">Total</div>
          <div className="stats-col-num">This Year</div>
          <div className="stats-col-num">This Month</div>
          <div className="stats-col-date">Last Played</div>
        </div>
        {filtered.map((s) => (
          <div className="stats-row" key={s.songId}>
            <div className="stats-col-title">{s.title}</div>
            <div className="stats-col-num">{s.total}</div>
            <div className="stats-col-num">{s.thisYear}</div>
            <div className="stats-col-num">{s.thisMonth}</div>
            <div className="stats-col-date">
              {s.lastPlayed || <span className="stats-never">never</span>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="stats-empty">No songs match "{query}".</div>
        )}
      </div>
    </div>
  );
}
