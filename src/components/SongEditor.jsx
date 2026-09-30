import { useMemo, useState } from "react";
import SongView from "./SongView";
import { draftFromRawText } from "../lib/twoLineToBracket";
import { addLocalSong, uniqueId } from "../lib/addedSongs";
import { getSavedPasscode, savePasscode, syncSongsToGitHub } from "../lib/syncSongs";
import "./SongEditor.css";

export default function SongEditor({ songs, onChange, onBack }) {
  const [title, setTitle] = useState("");
  const [tempo, setTempo] = useState("fast");
  const [rawText, setRawText] = useState("");
  const [draft, setDraft] = useState("");
  const [passcode, setPasscode] = useState(() => getSavedPasscode());
  const [syncState, setSyncState] = useState(null); // null | "saving" | "synced" | "error"
  const [syncError, setSyncError] = useState("");
  const [savedId, setSavedId] = useState(null);

  function handleConvert() {
    setDraft(draftFromRawText(rawText));
  }

  const previewSong = useMemo(() => {
    const lines = (draft || rawText)
      .split("\n")
      .map((text) => ({ text }));
    return {
      id: "preview",
      title: title || "Untitled Song",
      tempo,
      lines: lines.length ? lines : [{ text: "" }],
    };
  }, [draft, rawText, title, tempo]);

  async function handleSave() {
    if (!title.trim()) return;
    const id = uniqueId(title, songs);
    const newSong = {
      id,
      title,
      tempo,
      lines: (draft || rawText).split("\n").map((text) => ({ text })),
    };

    // Always save locally first -- this device sees the new song right away.
    addLocalSong(newSong);
    onChange();
    setSavedId(id);

    if (!passcode.trim()) {
      setSyncState("error");
      setSyncError("Saved on this device. Enter the publish code above to also push this live for everyone.");
      return;
    }

    savePasscode(passcode);
    setSyncState("saving");
    setSyncError("");

    const updatedSongs = [...songs, newSong];
    const result = await syncSongsToGitHub(updatedSongs, passcode, `Add song: ${title}`);
    if (result.ok) {
      setSyncState("synced");
    } else {
      setSyncState("error");
      setSyncError(result.error);
    }
  }

  return (
    <div className="song-editor">
      <button className="link-btn" onClick={onBack}>
        ← Back
      </button>
      <h1 className="editor-heading">Add Song</h1>

      <div className="editor-fields">
        <div className="song-picker-field">
          <label className="picker-field-label">Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="song-picker-field">
          <label className="picker-field-label">Tempo</label>
          <select value={tempo} onChange={(e) => setTempo(e.target.value)}>
            <option value="fast">Fast</option>
            <option value="slow">Slow</option>
          </select>
        </div>
      </div>

      <p className="editor-help">
        Paste the chord line directly above its lyric line (like the original
        sheet) and tap Convert — it will turn into bracket notation
        automatically. You can also just type bracket notation directly, e.g.
        <code> [G]Amazing [C]grace</code>.
      </p>

      <textarea
        className="editor-raw-textarea"
        rows={6}
        placeholder={"G          C\nAmazing grace how sweet the sound"}
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
      />
      <button className="link-btn" onClick={handleConvert}>
        Convert to Bracket Notation
      </button>

      <textarea
        className="editor-draft-textarea"
        rows={8}
        placeholder="[G]Amazing [C]grace how sweet the sound"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />

      <div className="editor-preview-box">
        <SongView song={previewSong} />
      </div>

      <div className="song-picker-field">
        <label className="picker-field-label">Publish code (to save live for everyone)</label>
        <input
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="Enter the code"
        />
      </div>

      <button className="save-btn" onClick={handleSave} disabled={!title.trim()}>
        {syncState === "saving" ? "Saving…" : "Save Song"}
      </button>

      {savedId && syncState === "synced" && (
        <p className="sync-status sync-status-ok">
          Saved and published — live for everyone in about a minute once the
          site rebuilds.
        </p>
      )}
      {savedId && syncState === "error" && <p className="sync-status sync-status-error">{syncError}</p>}
    </div>
  );
}
