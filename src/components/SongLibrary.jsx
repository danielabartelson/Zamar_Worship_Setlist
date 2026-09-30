import { useMemo, useRef, useState } from "react";
import { TEMPO_LABELS } from "../data/sampleSongs";
import { setOverride } from "../lib/songOverrides";
import "./SongLibrary.css";

const AZ_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function SongLibrary({ songs, onChange, onBack, onEditSong }) {
  const [query, setQuery] = useState("");
  const scrollRef = useRef(null);

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

  function handleTempoChange(songId, tempo) {
    setOverride(songId, { tempo });
    onChange();
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
      <button className="link-btn" onClick={onBack}>
        ← Back
      </button>
      <h1 className="library-heading">Song Library</h1>
      <p className="library-help">
        Fix a song's Fast / Slow tag here — changes save on this device
        immediately and show up right away in the Setlist Builder. Tap Edit
        to fix the lyrics or move a chord.
      </p>
      <input
        type="text"
        placeholder="Search songs…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="library-search"
      />

      {/* Reuses the same scrollable-list + right-edge A-Z index layout as
          the song picker popup (song-list-panel/song-list-scroll/az-index
          in SongPickerField.css) -- same jump-to-letter behavior, just
          with the Library's own card-style rows inside it. */}
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
