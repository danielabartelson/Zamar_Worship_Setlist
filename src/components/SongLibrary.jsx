import { useMemo, useState } from "react";
import { TEMPO_LABELS } from "../data/sampleSongs";
import { setOverride } from "../lib/songOverrides";
import "./SongLibrary.css";

export default function SongLibrary({ songs, onChange, onBack, onEditSong }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return songs
      .filter((s) => !q || s.title.toLowerCase().includes(q))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [songs, query]);

  function handleTempoChange(songId, tempo) {
    setOverride(songId, { tempo });
    onChange();
  }

  function handleKeyChange(songId, key) {
    setOverride(songId, { key });
    onChange();
  }

  return (
    <div className="song-library">
      <button className="link-btn" onClick={onBack}>
        ← Back
      </button>
      <h1 className="library-heading">Song Library</h1>
      <p className="library-help">
        Fix a song's Fast / Slow tag or key here — changes save on this
        device immediately and show up right away in the Setlist Builder.
        Tap Edit to fix the lyrics or move a chord.
      </p>
      <input
        type="text"
        placeholder="Search songs…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="library-search"
      />
      <div className="library-list">
        {filtered.map((s) => (
          <div className="library-row" key={s.id}>
            <div className="library-row-title">{s.title}</div>
            <div className="library-row-controls">
              <select
                value={s.tempo}
                onChange={(e) => handleTempoChange(s.id, e.target.value)}
              >
                <option value="fast">{TEMPO_LABELS.fast}</option>
                <option value="slow">{TEMPO_LABELS.slow}</option>
              </select>
              <input
                type="text"
                className="library-key-input"
                placeholder="Key"
                value={s.key || ""}
                onChange={(e) => handleKeyChange(s.id, e.target.value)}
              />
              <button className="link-btn library-edit-btn" onClick={() => onEditSong(s.id)}>
                Edit
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="library-empty">No songs match "{query}".</div>
        )}
      </div>
    </div>
  );
}
