import { useMemo, useRef, useState } from "react";
import { TEMPO_LABELS } from "../data/sampleSongs";
import { setOverride } from "../lib/songOverrides";
import { getSyncSettings, syncSongsToGitHub } from "../lib/syncSongs";
import "./SongLibrary.css";

const AZ_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function SongLibrary({ songs, onChange, onAddSong, onEditSong }) {
  const [query, setQuery] = useState("");
  const scrollRef = useRef(null);
  const [status, setStatus] = useState(null); // null | { kind: "saving" | "ok" | "error", text }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return songs
      .filter((s) => !q || s.title.toLowerCase().includes(q))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [songs, query]);

  const lettersPresent = useMemo(() => {
    const set = new Set();
    filtered.forEach((s) => {
      const l = s.title[0];
      if (l) set.add(l.toUpperCase());
    });
    return set;
  }, [filtered]);

  async function handleTempoChange(songId, tempo) {
    // Always saves on this device first...
    setOverride(songId, { tempo });
    onChange();

    // ...and, if this device has the GitHub token set up, publishes it for
    // everyone too.
    const settings = getSyncSettings();
    if (!settings.token.trim()) return;
    const song = songs.find((s) => s.id === songId);
    setStatus({ kind: "saving", text: "Publishing…" });
    const updated = songs.map((s) => (s.id === songId ? { ...s, tempo } : s));
    const result = await syncSongsToGitHub(
      updated,
      settings,
      `Set tempo: ${song ? song.title : songId} → ${tempo}`
    );
    setStatus(
      result.ok
        ? { kind: "ok", text: "Published for everyone — live in about 1–2 minutes." }
        : { kind: "error", text: result.error }
    );
  }

  function jumpToLetter(letter) {
    const el = document.getElementById("library-letter-" + letter);
    if (el && scrollRef.current) {
      scrollRef.current.scrollTop = el.offsetTop - scrollRef.current.offsetTop;
    }
  }

  let lastLetter = null;

  return (
    <div className="song-library">
      <div className="library-top">
        <h1 className="library-heading">Song Library</h1>
        <button className="library-add-btn" onClick={onAddSong}>
          + Add Song
        </button>
      </div>
      <input
        type="text"
        placeholder="Search songs…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="library-search"
      />

      {status && <p className={"library-status library-status-" + status.kind}>{status.text}</p>}

      <div className="song-list-panel">
        <div className="song-list-scroll" ref={scrollRef}>
          {filtered.length === 0 && (
            <div className="library-empty">No songs match "{query}".</div>
          )}
          {filtered.map((s) => {
            const letter = (s.title[0] || "").toUpperCase();
            const showLetter = letter !== lastLetter;
            lastLetter = letter;
            return (
              <div key={s.id}>
                {showLetter && (
                  <div className="library-letter" id={"library-letter-" + letter}>
                    {letter}
                  </div>
                )}
                <div className="library-row">
                  <div className="library-row-title">{s.title}</div>
                  <div className="library-row-controls">
                    <select
                      value={s.tempo}
                      onChange={(e) => handleTempoChange(s.id, e.target.value)}
                    >
                      <option value="fast">{TEMPO_LABELS.fast}</option>
                      <option value="slow">{TEMPO_LABELS.slow}</option>
                    </select>
                    <button className="link-btn library-edit-btn" onClick={() => onEditSong(s.id)}>
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="az-index">
          {AZ_LETTERS.map((l) => (
            <span
              key={l}
              className={lettersPresent.has(l) ? "" : "az-letter-dim"}
              onClick={() => lettersPresent.has(l) && jumpToLetter(l)}
            >
              {l}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
