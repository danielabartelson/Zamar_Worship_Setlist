import { useState } from "react";
import "./PublishSetup.css";

// Shown at the bottom of Add Song / Edit Song. Once a token has been
// entered on this device it collapses to a one-line "Connected" status.
export default function PublishSetup({ settings, onChange }) {
  const connected = settings.token.trim() && settings.repo.trim();
  const [editing, setEditing] = useState(!connected);

  if (connected && !editing) {
    return (
      <div className="publish-box publish-box-ok">
        <span>
          <span className="publish-dot" /> Publishing to everyone — connected on this device
        </span>
        <button className="link-btn" onClick={() => setEditing(true)}>
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="publish-box">
      <div className="song-picker-field">
        <label className="picker-field-label">GitHub token (one-time setup)</label>
        <input
          type="password"
          value={settings.token}
          onChange={(e) => onChange({ ...settings, token: e.target.value })}
          placeholder="github_pat_…"
          autoComplete="off"
        />
      </div>
      <div className="song-picker-field">
        <label className="picker-field-label">GitHub repo</label>
        <input
          type="text"
          value={settings.repo}
          onChange={(e) => onChange({ ...settings, repo: e.target.value })}
          autoCapitalize="off"
          autoCorrect="off"
        />
      </div>
      <p className="publish-help">
        Only needed once per device. Leave the token empty to save on this
        device only.
      </p>
    </div>
  );
}
