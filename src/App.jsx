import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import SetlistPicker from "./components/SetlistPicker";
import SetlistViewer from "./components/SetlistViewer";
import SongEditor from "./components/SongEditor";
import SongLibrary from "./components/SongLibrary";
import EditSong from "./components/EditSong";
import SongUsageStats from "./components/SongUsageStats";
import { sampleSongs } from "./data/sampleSongs";
import { decodeSetlist, getRememberedSetlist, rememberSetlist } from "./lib/setlistCode";
import { applyOverrides } from "./lib/songOverrides";
import { getAddedSongs } from "./lib/addedSongs";
import "./theme.css";
import "./App.css";

// Tap the logo 5 times within 2 seconds to open the private Song Stats
// screen -- not linked anywhere in the normal UI, so people you share the
// app with won't stumble onto it.
const SECRET_TAP_COUNT = 5;
const SECRET_TAP_WINDOW_MS = 2000;

const LOGO_SRC = "/logo.png";

function getInitialView() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("set");
  if (code) {
    const decoded = decodeSetlist(code);
    if (decoded) return { mode: "view", setlist: decoded, fromLink: true };
  }
  const remembered = getRememberedSetlist();
  if (remembered) return { mode: "view", setlist: remembered, fromLink: false };
  return { mode: "picker" };
}

export default function App() {
  const [songs, setSongs] = useState(() => [
    ...applyOverrides(sampleSongs),
    ...getAddedSongs(),
  ]);
  const refreshSongs = useCallback(() => {
    setSongs([...applyOverrides(sampleSongs), ...getAddedSongs()]);
  }, []);
  const songsById = useMemo(() => {
    const map = {};
    songs.forEach((s) => (map[s.id] = s));
    return map;
  }, [songs]);

  const [view, setView] = useState(getInitialView);
  const [logoOk, setLogoOk] = useState(true);
  const tapTimes = useRef([]);

  useEffect(() => {
    if (view.mode === "view" && view.fromLink) {
      rememberSetlist(view.setlist);
    }
  }, [view]);

  function handleLogoTap() {
    const now = Date.now();
    tapTimes.current = tapTimes.current.filter((t) => now - t < SECRET_TAP_WINDOW_MS);
    tapTimes.current.push(now);
    if (tapTimes.current.length >= SECRET_TAP_COUNT) {
      tapTimes.current = [];
      setView({ mode: "stats" });
    }
  }

  const showHeader = view.mode !== "view";

  return (
    <div className="app-shell">
      {showHeader && (
        <header className="brand-header">
          {logoOk && (
            <img
              src={LOGO_SRC}
              className="logo"
              alt="Ogden Potter's House logo"
              onError={() => setLogoOk(false)}
              onClick={handleLogoTap}
            />
          )}
          <span className="brand-title">Zamar Setlist</span>
          <div className="header-actions">
            {view.mode !== "picker" && (
              <button className="header-picker-link" onClick={() => setView({ mode: "picker" })}>
                Setlist Builder
              </button>
            )}
          </div>
        </header>
      )}

      <main className="app-main">
        {view.mode === "picker" && (
          <SetlistPicker
            songs={songs}
            onView={(setlist) => setView({ mode: "view", setlist, fromLink: false })}
            onLibrary={() => setView({ mode: "library" })}
            onAddSong={() => setView({ mode: "editor" })}
          />
        )}
        {view.mode === "view" && (
          <SetlistViewer
            setlist={view.setlist}
            songsById={songsById}
            onPickAnother={() => setView({ mode: "picker" })}
          />
        )}
        {view.mode === "editor" && (
          <SongEditor
            songs={songs}
            onChange={refreshSongs}
            onBack={() => setView({ mode: "picker" })}
          />
        )}
        {view.mode === "library" && (
          <SongLibrary
            songs={songs}
            onChange={refreshSongs}
            onBack={() => setView({ mode: "picker" })}
            onEditSong={(songId) => setView({ mode: "edit-song", songId })}
          />
        )}
        {view.mode === "edit-song" && songsById[view.songId] && (
          <EditSong
            song={songsById[view.songId]}
            songs={songs}
            onChange={refreshSongs}
            onBack={() => setView({ mode: "library" })}
          />
        )}
        {view.mode === "stats" && (
          <SongUsageStats songs={songs} onBack={() => setView({ mode: "picker" })} />
        )}
      </main>
    </div>
  );
}
