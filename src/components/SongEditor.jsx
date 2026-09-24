import { useMemo, useState } from "react";
import SongView from "./SongView";
import { draftFromRawText } from "../lib/twoLineToBracket";
import { addLocalSong, uniqueId } from "../lib/addedSongs";
import { getSyncSettings, saveSyncSettings, syncSongsToGitHub } from "../lib/syncSongs";
import "./SongEditor.css";

export default function SongEditor({ songs, onChange, onBack }) {
  const [title, setTitle] = useState("");
  const [key, setKey] = useState("");
  const [tempo, setTempo] = useState("fast");
  const [rawText, setRawText] = useState("");
  const [draft, setDraft] = useState("");
  const [syncSettings, setSyncSettings] = useState(() => getSyncSettings());
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
      key,
      tempo,
      lines: lines.length ? lines : [{ text: "" }],
    };
  }, [draft, rawText, title, key, tempo]);

  async function handleSave() {
    if (!title.trim()) return;
    const id = uniqueId(title, songs);
    const newSong = {
      id,
      title,
      key,
      tempo,
      lines: (draft || rawText).split("\n").map((text) => ({ text })),
    };

    // Always save locally first -- this device sees the new song right away.
    addLocalSong(newSong);
    onChange();
    setSavedId(id);

    if (!syncSettings.token.trim() || !syncSettings.repo.trim()) {
      setSyncState("error");
      setSyncError("Saved on this device. Enter your GitHub token and repo above to also push this live for everyone.");
      return;
    }

    saveSyncSettings(syncSettings);
    setSyncState("saving");
    setSyncError("");

    const updatedSongs = [...songs, newSong];
    const result = await syncSongsToGitHub(updatedSongs, syncSettings, `Add song: ${title}`);
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
        <div className="editor-fields-row">
          <div className="song-picker-field">
            <label className="picker-field-label">Key</label>
            <input type="text" value={key} onChange={(e) => setKey(e.target.value)} />
          </div>
          <div className="song-picker-field">
            <label className="picker-field-label">Tempo</label>
            <select value={tempo} onChange={(e) => setTempo(e.target.value)}>
              <option value="fast">Fast</option>
              <option value="slow">Slow</option>
              <option value="offering">Offering</option>
            </select>
          </div>
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

      <div className="editor-fields-row">
        <div className="song-picker-field">
          <label className="picker-field-label">GitHub token (to save live for everyone)</label>
          <input
            type="password"
            value={syncSettings.token}
            onChange={(e) => setSyncSettings((s) => ({ ...s, token: e.target.value }))}
            placeholder="github_pat_…"
          />
        </div>
        <div className="song-picker-field">
          <label className="picker-field-label">GitHub repo</label>
          <input
            type="text"
            value={syncSettings.repo}
            onChange={(e) => setSyncSettings((s) => ({ ...s, repo: e.target.value }))}
            placeholder="username/reponame"
          />
        </div>
      </div>

      <button className="save-btn" onClick={handleSave} disabled={!title.trim()}>
        {syncState === "saving" ? "Saving…" : "Save Song"}
      </button>

      {savedId && syncState === "synced" && (
        <p className="sync-status sync-status-ok">
          Saved and synced — live for everyone in about a minute once the site
          rebuilds.
        </p>
      )}
      {savedId && syncState === "error" && <p className="sync-status sync-status-error">{syncError}</p>}
    </div>
  );
}
