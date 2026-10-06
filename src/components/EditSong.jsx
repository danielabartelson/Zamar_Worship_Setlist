import { useMemo, useState } from "react";
import SongView from "./SongView";
import PublishSetup from "./PublishSetup";
import { linesToText, textToLines } from "../lib/songLines";
import { setOverride, clearOverride } from "../lib/songOverrides";
import { getSyncSettings, saveSyncSettings, syncSongsToGitHub } from "../lib/syncSongs";
import "./EditSong.css";

export default function EditSong({ song, songs, onChange, onBack }) {
  const [title, setTitle] = useState(song.title || "");
  const [text, setText] = useState(() => linesToText(song.lines));
  const [settings, setSettings] = useState(getSyncSettings);
  const [syncState, setSyncState] = useState(null);
  const [syncError, setSyncError] = useState("");

  const previewSong = useMemo(() => {
    const lines = textToLines(text);
    return {
      id: "preview",
      title: title || "Untitled Song",
      tempo: song.tempo,
      lines: lines.length ? lines : [{ text: "" }],
    };
  }, [text, title, song.tempo]);

  async function handleSave() {
    const patch = { title, lines: textToLines(text) };
    setOverride(song.id, patch);
    onChange();

    if (!settings.token.trim()) {
      setSyncState("local");
      return;
    }
    saveSyncSettings(settings);
    setSyncState("saving");
    const updated = songs.map((s) => (s.id === song.id ? { ...s, ...patch } : s));
    const result = await syncSongsToGitHub(updated, settings, `Edit song: ${title}`);
    if (result.ok) setSyncState("synced");
    else {
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
      <button className="link-btn editor-back" onClick={onBack}>
        ‹ Library
      </button>
      <h1 className="editor-heading">Edit Song</h1>

      <div className="editor-fields">
        <div className="song-picker-field">
          <label className="picker-field-label">Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
      </div>

      <textarea
        className="editor-draft-textarea"
        rows={14}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="editor-preview-box">
        <SongView song={previewSong} />
      </div>

      <PublishSetup settings={settings} onChange={setSettings} />

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
          Saved and published — everyone gets it in about 1–2 minutes.
        </p>
      )}
      {syncState === "local" && <p className="sync-status sync-status-ok">Saved on this device.</p>}
      {syncState === "error" && <p className="sync-status sync-status-error">{syncError}</p>}
    </div>
  );
}
