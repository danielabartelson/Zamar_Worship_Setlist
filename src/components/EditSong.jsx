import { useMemo, useState } from "react";
import SongView from "./SongView";
import { draftFromRawText } from "../lib/twoLineToBracket";
import { linesToText, textToLines } from "../lib/songLines";
import { setOverride, clearOverride } from "../lib/songOverrides";
import { getSyncSettings, saveSyncSettings, syncSongsToGitHub } from "../lib/syncSongs";
import "./EditSong.css";

export default function EditSong({ song, songs, onChange, onBack }) {
  const [title, setTitle] = useState(song.title || "");
  const [key, setKey] = useState(song.key || "");
  const [tempo, setTempo] = useState(song.tempo || "fast");
  const [draft, setDraft] = useState(() => linesToText(song.lines));
  const [rawText, setRawText] = useState("");
  const [syncSettings, setSyncSettings] = useState(() => getSyncSettings());
  const [syncState, setSyncState] = useState(null); // null | "saving" | "synced" | "error"
  const [syncError, setSyncError] = useState("");

  function handleConvert() {
    if (!rawText.trim()) return;
    setDraft((prev) => (prev ? prev + "\n" : "") + draftFromRawText(rawText));
    setRawText("");
  }

  const previewSong = useMemo(() => {
    const lines = textToLines(draft);
    return {
      id: "preview",
      title: title || "Untitled Song",
      key,
      tempo,
      lines: lines.length ? lines : [{ text: "" }],
    };
  }, [draft, title, key, tempo]);

  async function handleSave() {
    const patch = { title, key, tempo, lines: textToLines(draft) };

    // Always save locally first -- this device sees the change instantly
    // no matter what happens with the GitHub sync below.
    setOverride(song.id, patch);
    onChange();

    if (!syncSettings.token.trim() || !syncSettings.repo.trim()) {
      setSyncState("error");
      setSyncError("Saved on this device. Enter your GitHub token and repo above to also push this live for everyone.");
      return;
    }

    saveSyncSettings(syncSettings);
    setSyncState("saving");
    setSyncError("");

    const updatedSongs = songs.map((s) => (s.id === song.id ? { ...s, ...patch } : s));
    const result = await syncSongsToGitHub(updatedSongs, syncSettings, `Edit song: ${title}`);
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
        Edit the lyrics/chords below directly — chords go in brackets right
        before the word they belong on, e.g. <code>[G]Amazing [C]grace</code>.
        To move a chord, just move the bracketed part to a different word. If
        it's easier, paste a chord line above its lyric line into the box
        below and tap Convert to turn it into bracket notation, which gets
        added to the end of the song text.
      </p>

      <textarea
        className="editor-raw-textarea"
        rows={4}
        placeholder={"G          C\nAmazing grace how sweet the sound"}
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
      />
      <button className="link-btn" onClick={handleConvert}>
        Convert &amp; Add to Song
      </button>

      <textarea
        className="editor-draft-textarea"
        rows={12}
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
          Saved and synced — live for everyone in about a minute once the site
          rebuilds.
        </p>
      )}
      {syncState === "error" && <p className="sync-status sync-status-error">{syncError}</p>}

      <p className="editor-help">
        Changes always save on this device instantly. With your GitHub token
        and repo filled in (only needed once — this device remembers them),
        Save also commits the update straight to GitHub, which republishes
        the app for everyone else.
      </p>
    </div>
  );
}
