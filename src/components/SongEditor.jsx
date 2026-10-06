import { useMemo, useState } from "react";
import SongView from "./SongView";
import PublishSetup from "./PublishSetup";
import { addLocalSong, uniqueId } from "../lib/addedSongs";
import { getSyncSettings, saveSyncSettings, syncSongsToGitHub } from "../lib/syncSongs";
import "./SongEditor.css";

export default function SongEditor({ songs, onChange, onBack }) {
  const [title, setTitle] = useState("");
  const [tempo, setTempo] = useState("fast");
  const [text, setText] = useState("");
  const [settings, setSettings] = useState(getSyncSettings);
  const [syncState, setSyncState] = useState(null); // null | "saving" | "synced" | "local" | "error"
  const [syncError, setSyncError] = useState("");

  const previewSong = useMemo(() => {
    const lines = text.split("\n").map((t) => ({ text: t }));
    return { id: "preview", title: title || "Untitled Song", tempo, lines };
  }, [text, title, tempo]);

  async function handleSave() {
    if (!title.trim()) return;
    const newSong = {
      id: uniqueId(title, songs),
      title,
      tempo,
      lines: text.split("\n").map((t) => ({ text: t })),
    };

    // Always save on this device first.
    addLocalSong(newSong);
    onChange();

    if (!settings.token.trim()) {
      setSyncState("local");
      return;
    }
    saveSyncSettings(settings);
    setSyncState("saving");
    const result = await syncSongsToGitHub([...songs, newSong], settings, `Add song: ${title}`);
    if (result.ok) setSyncState("synced");
    else {
      setSyncState("error");
      setSyncError(result.error);
    }
  }

  return (
    <div className="song-editor">
      <button className="link-btn editor-back" onClick={onBack}>
        ‹ Library
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

      <textarea
        className="editor-draft-textarea"
        rows={10}
        placeholder="[G]Amazing [C]grace how sweet the sound"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="editor-preview-box">
        <SongView song={previewSong} />
      </div>

      <PublishSetup settings={settings} onChange={setSettings} />

      <button className="save-btn" onClick={handleSave} disabled={!title.trim()}>
        {syncState === "saving" ? "Saving…" : "Save Song"}
      </button>

      {syncState === "synced" && (
        <p className="sync-status sync-status-ok">
          Saved and published — everyone gets it in about 1–2 minutes.
        </p>
      )}
      {syncState === "local" && (
        <p className="sync-status sync-status-ok">Saved on this device.</p>
      )}
      {syncState === "error" && <p className="sync-status sync-status-error">{syncError}</p>}
    </div>
  );
}
