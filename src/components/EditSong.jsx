import { useMemo, useState } from "react";
import SongView from "./SongView";
import { linesToText, textToLines } from "../lib/songLines";
import { setOverride, clearOverride } from "../lib/songOverrides";
import { getSavedPasscode, savePasscode, syncSongsToGitHub } from "../lib/syncSongs";
import "./EditSong.css";

export default function EditSong({ song, songs, onChange, onBack }) {
  const [title, setTitle] = useState(song.title || "");
  const [draft, setDraft] = useState(() => linesToText(song.lines));
  const [passcode, setPasscode] = useState(() => getSavedPasscode());
  const [syncState, setSyncState] = useState(null); // null | "saving" | "synced" | "error"
  const [syncError, setSyncError] = useState("");

  const previewSong = useMemo(() => {
    const lines = textToLines(draft);
    return {
      id: "preview",
      title: title || "Untitled Song",
      key: song.key,
      tempo: song.tempo,
      lines: lines.length ? lines : [{ text: "" }],
    };
  }, [draft, title, song.key, song.tempo]);

  async function handleSave() {
    const patch = { title, lines: textToLines(draft) };

    // Always save locally first -- this device sees the change instantly
    // no matter what happens with the publish step below.
    setOverride(song.id, patch);
    onChange();

    if (!passcode.trim()) {
      setSyncState("error");
      setSyncError("Saved on this device. Enter the publish code above to also push this live for everyone.");
      return;
    }

    savePasscode(passcode);
    setSyncState("saving");
    setSyncError("");

    const updatedSongs = songs.map((s) => (s.id === song.id ? { ...s, ...patch } : s));
    const result = await syncSongsToGitHub(updatedSongs, passcode, `Edit song: ${title}`);
    if (result.ok) {
      setSyncState("synced");
    } else {
      setSyncState("error");
      setSyncError(result.error);
    }
  }

  function handleReset() {
    clearOverride(song.id);
    onChange();
    onBack();
  }

  return (
    <div className="edit-song">
      <button className="link-btn" onClick={onBack}>
        ← Back
      </button>
      <h1 className="editor-heading">Edit Song</h1>

      <div className="editor-fields">
        <div className="song-picker-field">
          <label className="picker-field-label">Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
      </div>

      <p className="editor-help">
        Edit the lyrics/chords below directly — chords go in brackets right
        before the word they belong on, e.g. <code>[G]Amazing [C]grace</code>.
        To move a chord, just move the bracketed part to a different word.
      </p>

      <textarea
        className="editor-draft-textarea"
        rows={16}
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

      <div className="edit-song-actions">
        <button className="save-btn" onClick={handleSave}>
          {syncState === "saving" ? "Saving…" : "Save Changes"}
        </button>
        <button className="link-btn reset-link" onClick={handleReset}>
          Reset to Original
        </button>
      </div>

      {syncState === "synced" && (
        <p className="sync-status sync-status-ok">
          Saved and published — live for everyone in about a minute once the
          site rebuilds.
        </p>
      )}
      {syncState === "error" && <p className="sync-status sync-status-error">{syncError}</p>}

      <p className="editor-help">
        Changes always save on this device instantly. With the publish code
        filled in (only needed once — this device remembers it), Save also
        publishes the update for everyone else.
      </p>
    </div>
  );
}
