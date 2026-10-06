import { useMemo, useState, useCallback } from "react";
import SetlistPicker from "./components/SetlistPicker";
import SetlistViewer from "./components/SetlistViewer";
import SongEditor from "./components/SongEditor";
import SongLibrary from "./components/SongLibrary";
import EditSong from "./components/EditSong";
import History from "./components/History";
import BottomNav from "./components/BottomNav";
import { sampleSongs } from "./data/sampleSongs";
import { decodeSetlist, getRememberedSetlist, rememberSetlist } from "./lib/setlistCode";
import { applyOverrides } from "./lib/songOverrides";
import { getAddedSongs } from "./lib/addedSongs";
import { pruneLocalSongs } from "./lib/pruneLocal";
import { recordSetlistUsage } from "./lib/songStats";
import {
  emptyDraft,
  loadDraft,
  saveDraft,
  draftToSetlist,
  getCurrentSource,
  setCurrentSource,
} from "./lib/draft";
import "./theme.css";
import "./App.css";

// Built with the app's configured base path (see vite.config.js) so the
// logo resolves correctly under a GitHub Pages /repo-name/ subfolder.
const LOGO_SRC = `${import.meta.env.BASE_URL}logo.png`;

// A setlist someone shared as a link (?set=...). It becomes the Current
// setlist on this device, separate from whatever is being built here.
function getInitialLinkSetlist() {
  const code = new URLSearchParams(window.location.search).get("set");
  if (code) {
    const decoded = decodeSetlist(code);
    if (decoded) {
      rememberSetlist(decoded);
      setCurrentSource("link");
      return decoded;
    }
  }
  return getRememberedSetlist();
}

// Which bottom-nav tab is lit for a given screen. Add Song and Edit Song
// are reached from the Library, so they count as Library.
function navActiveFor(mode) {
  if (mode === "edit-song" || mode === "editor") return "library";
  if (mode === "view") return "current";
  return mode;
}

// Drop this device's saved copies of anything already published.
pruneLocalSongs(sampleSongs);

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

  const [draft, setDraft] = useState(loadDraft);
  const [linkSetlist] = useState(getInitialLinkSetlist);
  const [source, setSource] = useState(getCurrentSource);

  function updateDraft(patch) {
    setDraft((prev) => {
      const next = { ...prev, ...patch };
      saveDraft(next);
      return next;
    });
    setSource("draft");
    setCurrentSource("draft");
  }

  function handleClearDraft() {
    const fresh = emptyDraft();
    saveDraft(fresh);
    setDraft(fresh);
  }

  const showingLink = source === "link" && linkSetlist;
  const currentSetlist = useMemo(
    () => (showingLink ? linkSetlist : draftToSetlist(draft)),
    [showingLink, linkSetlist, draft]
  );
  const hasCurrentSongs = (currentSetlist.slots || []).some((s) => s.songId);

  const [view, setView] = useState(() => ({ mode: hasCurrentSongs ? "view" : "picker" }));

  function handleGenerate() {
    const setlist = draftToSetlist(draft);
    const ts = recordSetlistUsage(setlist, draft.historyTs);
    updateDraft({ historyTs: ts });
    setView({ mode: "view" });
  }

  function handleNavigate(tabId) {
    setView({ mode: tabId === "current" ? "view" : tabId });
  }

  const showHeader = view.mode !== "view";

  return (
    <div className="app-shell">
      {showHeader && (
        <header className="brand-header">
          <img src={LOGO_SRC} className="logo" alt="Ogden Potter's House logo" />
          <span className="brand-title">Zamar Setlist</span>
        </header>
      )}

      <main className="app-main">
        {view.mode === "picker" && (
          <SetlistPicker
            songs={songs}
            draft={draft}
            onDraftChange={updateDraft}
            onGenerate={handleGenerate}
            onClear={handleClearDraft}
          />
        )}
        {view.mode === "view" && (
          <SetlistViewer
            setlist={currentSetlist}
            songsById={songsById}
            onEdit={showingLink ? undefined : () => setView({ mode: "picker" })}
            onBuild={() => setView({ mode: "picker" })}
          />
        )}
        {view.mode === "history" && <History songs={songs} />}
        {view.mode === "library" && (
          <SongLibrary
            songs={songs}
            onChange={refreshSongs}
            onAddSong={() => setView({ mode: "editor" })}
            onEditSong={(songId) => setView({ mode: "edit-song", songId })}
          />
        )}
        {view.mode === "editor" && (
          <SongEditor
            songs={songs}
            onChange={refreshSongs}
            onBack={() => setView({ mode: "library" })}
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
      </main>

      <BottomNav active={navActiveFor(view.mode)} onNavigate={handleNavigate} />
    </div>
  );
}
