import { useMemo, useState } from "react";
import SongPickerField from "./SongPickerField";
import { SLOTS } from "../lib/slots";
import "./SetlistPicker.css";

// Formats "YYYY-MM-DD" as "Sep 24, 2026" from its raw parts (new
// Date("YYYY-MM-DD") parses as UTC and can roll back a day in the US).
function formatDateDisplay(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// The builder is fully controlled by `draft` (kept in App and saved on the
// device), so nothing is lost when you leave this page and come back.
export default function SetlistPicker({ songs, draft, onDraftChange, onGenerate, onClear }) {
  const [activeSlotId, setActiveSlotId] = useState(null);
  const { choices, service, date } = draft;

  const songsByTempo = useMemo(() => {
    const map = { fast: [], slow: [] };
    songs.forEach((s) => {
      if (map[s.tempo]) map[s.tempo].push(s);
    });
    Object.values(map).forEach((arr) => arr.sort((a, b) => a.title.localeCompare(b.title)));
    return map;
  }, [songs]);

  const hasAnySong = SLOTS.some((s) => choices[s.id]);

  function handleChange(slotId, songId) {
    onDraftChange({ choices: { ...choices, [slotId]: songId || undefined } });
  }

  if (activeSlotId) {
    const slot = SLOTS.find((s) => s.id === activeSlotId);
    return (
      <div className="setlist-picker setlist-picker-picking">
        <SongPickerField
          label={slot.label}
          songs={songsByTempo[slot.tempo] || []}
          value={choices[slot.id] || null}
          onChange={(id) => handleChange(slot.id, id)}
          onClose={() => setActiveSlotId(null)}
        />
      </div>
    );
  }

  return (
    <div className="setlist-picker">
      <h1 className="picker-heading">Build This Week's Setlist</h1>

      <div className="picker-meta-row">
        <div className="song-picker-field">
          <label className="picker-field-label">Service</label>
          <input
            type="text"
            placeholder="Sunday Service"
            value={service}
            onChange={(e) => onDraftChange({ service: e.target.value })}
          />
        </div>
        <div className="song-picker-field picker-date-field">
          <label className="picker-field-label">Date</label>
          {/* Our own plain-text date on top (so it can be right-aligned the
              same on every device); the real date input sits invisibly
              beneath it and still opens the native date picker when tapped. */}
          <div className="date-field-wrap">
            <span className="date-display-text">{formatDateDisplay(date)}</span>
            <input
              type="date"
              className="date-native-input"
              value={date}
              onChange={(e) => onDraftChange({ date: e.target.value })}
              aria-label="Date"
            />
          </div>
        </div>
      </div>

      <div className="picker-slots">
        {SLOTS.map((slot) => {
          const chosen = (songsByTempo[slot.tempo] || []).find((s) => s.id === choices[slot.id]);
          return (
            <div key={slot.id} className="slot-row" onClick={() => setActiveSlotId(slot.id)}>
              <span className="slot-label">{slot.label}</span>
              <span className={"slot-value" + (chosen ? "" : " placeholder")}>
                {chosen ? chosen.title : "Tap to choose…"}
                <span className="slot-chevron">›</span>
              </span>
            </div>
          );
        })}
      </div>

      {!hasAnySong && (
        <p className="picker-hint">
          Pick at least one song to generate a setlist — you don't have to fill every slot.
        </p>
      )}

      <button className="picker-generate-btn" disabled={!hasAnySong} onClick={onGenerate}>
        Generate Setlist
      </button>

      {hasAnySong && (
        <button className="link-btn picker-clear-btn" onClick={onClear}>
          Start a new, empty setlist
        </button>
      )}
    </div>
  );
}
