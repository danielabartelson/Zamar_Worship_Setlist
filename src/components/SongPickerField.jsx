import { useEffect, useMemo, useRef, useState } from "react";
import "./SongPickerField.css";

const AZ_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// Full-panel song picker: keyboard is hidden by default and the whole
// (sorted) song list is shown as a scrollable, tap-to-select list, with a
// pinned A-Z index strip on the right edge (like the iOS Hymns app) for
// quickly jumping to a letter, and a floating magnifying-glass button that
// reveals a search input when someone actually wants to type.
export default function SongPickerField({ label, songs, value, onChange, onClose, clearable = true }) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const selected = songs.find((s) => s.id === value) || null;

  const sorted = useMemo(
    () => [...songs].sort((a, b) => a.title.localeCompare(b.title)),
    [songs]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((s) => s.title.toLowerCase().includes(q));
  }, [sorted, query]);

  const lettersPresent = useMemo(() => {
    const set = new Set();
    filtered.forEach((s) => {
      const l = s.title[0];
      if (l) set.add(l.toUpperCase());
    });
    return set;
  }, [filtered]);

  useEffect(() => {
    if (searchOpen && inputRef.current) inputRef.current.focus();
  }, [searchOpen]);

  function handleSelect(song) {
    onChange(song.id);
    onClose();
  }

  function handleClear(e) {
    e.stopPropagation();
    onChange(null);
  }

  function toggleSearch() {
    setSearchOpen((v) => {
      const next = !v;
      if (!next) setQuery("");
      return next;
    });
  }

  function jumpToLetter(letter) {
    const el = document.getElementById("song-letter-" + letter);
    if (el && scrollRef.current) {
      scrollRef.current.scrollTop = el.offsetTop - scrollRef.current.offsetTop;
    }
  }

  let lastLetter = null;

  return (
    <div className="song-picker-panel">
      <div className="slot-row-active">
        <button className="slot-back-btn" onClick={onClose} aria-label="Back">
          ‹
        </button>
        <span className="slot-label">{label}</span>
        {selected && clearable ? (
          <button className="slot-clear-btn" onClick={handleClear}>
            Clear
          </button>
        ) : (
          <span className="slot-clear-spacer" />
        )}
      </div>

      {searchOpen && (
        <input
          ref={inputRef}
          type="text"
          className="picker-search-input"
          placeholder="Search songs…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}

      <div className="song-list-panel">
        <div className="song-list-scroll" ref={scrollRef}>
          {filtered.length === 0 && <div className="picker-empty">No songs found</div>}
          {filtered.map((s) => {
            const letter = (s.title[0] || "").toUpperCase();
            const showLetter = letter !== lastLetter;
            lastLetter = letter;
            return (
              <div key={s.id}>
                {showLetter && (
                  <div className="song-row-letter" id={"song-letter-" + letter}>
                    {letter}
                  </div>
                )}
                <div
                  className={"song-row" + (s.id === value ? " song-row-selected" : "")}
                  onClick={() => handleSelect(s)}
                >
                  {s.title}
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
        <button className="search-fab" onClick={toggleSearch} aria-label="Toggle search">
          {searchOpen ? "⌨" : "🔍"}
        </button>
      </div>
    </div>
  );
}
