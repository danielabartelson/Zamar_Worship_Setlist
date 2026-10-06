import { useMemo, useState } from "react";
import {
  buildHistoryTree,
  getPeriodOptions,
  getSetlistHistory,
  getSongStatsForPeriod,
} from "../lib/songStats";
import "./History.css";

function fmtDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function fmtLast(iso) {
  if (!iso) return "Never";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const SORTS = [
  { id: "most", label: "Most played" },
  { id: "least", label: "Least played" },
  { id: "stale", label: "Not played in a while" },
  { id: "az", label: "A–Z" },
];

const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

export default function History({ songs }) {
  const [tab, setTab] = useState("setlists");
  const history = useMemo(() => getSetlistHistory(), []);
  const tree = useMemo(() => buildHistoryTree(history), [history]);
  const periods = useMemo(() => getPeriodOptions(tree), [tree]);
  const [period, setPeriod] = useState(() => periods[0]?.value || "all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("most");

  const titleById = useMemo(() => {
    const m = {};
    songs.forEach((s) => (m[s.id] = s.title));
    return m;
  }, [songs]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = getSongStatsForPeriod(songs, period).filter(
      (r) => !q || r.title.toLowerCase().includes(q)
    );
    const byTitle = (a, b) => a.title.localeCompare(b.title);
    if (sort === "az") list.sort(byTitle);
    else if (sort === "least") list.sort((a, b) => a.count - b.count || byTitle(a, b));
    else if (sort === "stale")
      list.sort((a, b) => (a.lastPlayed || "").localeCompare(b.lastPlayed || "") || byTitle(a, b));
    else list.sort((a, b) => b.count - a.count || byTitle(a, b));
    return list;
  }, [songs, period, query, sort]);

  const periodTotal = rows.reduce((n, r) => n + r.count, 0);

  return (
    <div className="history">
      <h1 className="history-heading">History</h1>

      <div className="history-seg">
        <button
          className={tab === "setlists" ? "seg-active" : ""}
          onClick={() => setTab("setlists")}
        >
          Setlists
        </button>
        <button className={tab === "stats" ? "seg-active" : ""} onClick={() => setTab("stats")}>
          Song Stats
        </button>
      </div>

      {tab === "setlists" && (
        <div className="history-scroll">
          {tree.length === 0 && (
            <p className="history-empty">
              No setlists yet. Each time you tap Generate Setlist, it's saved here.
            </p>
          )}
          {tree.map((y) => (
            <section key={y.year}>
              <div className="history-year">
                <span className="history-year-name">{y.year} total</span>
                <span>
                  {plural(y.setlists, "setlist")} · {plural(y.songs, "song")}
                </span>
              </div>
              {y.months.map((m) => (
                <div key={m.key}>
                  <div className="history-month">
                    <span>{m.label}</span>
                    <span className="history-month-count">
                      {plural(m.setlists.length, "setlist")} · {plural(m.songs, "song")}
                    </span>
                  </div>
                  {m.setlists.map((sl) => (
                    <div className="history-card" key={sl.ts}>
                      <div className="history-card-top">
                        <span className="history-card-date">{fmtDate(sl.date)}</span>
                        <span className="history-card-service">{sl.service || "Sunday Service"}</span>
                      </div>
                      <ol className="history-songs">
                        {sl.songIds.map((id, i) => (
                          <li key={i}>{titleById[id] || id}</li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              ))}
            </section>
          ))}
        </div>
      )}

      {tab === "stats" && (
        <div className="history-stats">
          <select
            className="history-period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            {periods.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <div className="history-period-total">
            {plural(periodTotal, "song play")} in this period
          </div>
          <input
            type="text"
            placeholder="Search songs…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="history-sorts">
            {SORTS.map((s) => (
              <button
                key={s.id}
                className={"sort-chip" + (sort === s.id ? " sort-chip-active" : "")}
                onClick={() => setSort(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="history-scroll">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Song</th>
                  <th className="num">Count</th>
                  <th className="num">Last played</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.songId}>
                    <td>{r.title}</td>
                    <td className="num">{r.count}</td>
                    <td className="num last">{fmtLast(r.lastPlayed)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
