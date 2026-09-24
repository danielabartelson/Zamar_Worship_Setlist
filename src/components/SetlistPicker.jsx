import { useMemo, useState } from "react";
import SongPickerField from "./SongPickerField";
import { recordSetlistUsage } from "../lib/songStats";
import "./SetlistPicker.css";

const SLOTS = [
  { id: "fast1", label: "Fast Song 1", tempo: "fast" },
  { id: "fast2", label: "Fast Song 2", tempo: "fast" },
  { id: "fast3", label: "Fast Song 3", tempo: "fast" },
  { id: "slow1", label: "Slow Song 1", tempo: "slow" },
  { id: "slow2", label: "Slow Song 2", tempo: "slow" },
  // Offering pulls from the same pool as the Fast slots -- any fast song
  // can be used here, there's no separate "offering" song category.
  { id: "offering", label: "Offering Song", tempo: "fast" },
];

export default function SetlistPicker({ songs, onView, onLibrary, onAddSong }) {
  const [choices, setChoices] = useState({});
  const [service, setService] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [activeSlotId, setActiveSlotId] = useState(null);

  const songsByTempo = useMemo(() => {
    const map = { fast: [], slow: [] };
    songs.forEach((s) => {
      if (map[s.tempo]) map[s.tempo].push(s);
    });
    Object.values(map).forEach((arr) => arr.sort((a, b) => a.title.localeCompare(b.title)));
    return map;
  }, [songs]);

  const allChosenIds = Object.values(choices).filter(Boolean);
  const hasAnySong = allChosenIds.length > 0;

  function handleChange(slotId, songId) {
    setChoices((prev) => ({ ...prev, [slotId]: songId || undefined }));
  }

  function handleGenerate() {
    const setlist = {
      service: service || "Sunday Service",
      date,
      songIds: SLOTS.map((s) => choices[s.id]).filter(Boolean),
      slots: SLOTS.map((s) => ({ id: s.id, label: s.label, songId: choices[s.id] || null })),
    };
    recordSetlistUsage(setlist);
    onView(setlist);
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
            onChange={(e) => setService(e.target.value)}
          />
        </div>
        <div className="song-picker-field">
          <label className="picker-field-label">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
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

      <button className="picker-generate-btn" disabled={!hasAnySong} onClick={handleGenerate}>
        Generate Setlist
      </button>

      <div className="footer-actions">
        <button onClick={onLibrary}>Library</button>
        <button onClick={onAddSong}>Add Song</button>
      </div>
    </div>
  );
}
