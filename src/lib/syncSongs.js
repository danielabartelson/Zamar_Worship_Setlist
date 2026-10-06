// Publishes a song edit "for everyone" by committing the updated
// songs.json straight to GitHub from the browser. That commit makes the
// GitHub Actions workflow rebuild the app, and everybody's copy updates.
//
// The GitHub token is entered ONCE on each device that should be able to
// publish (the leader's phone and tablet) and is remembered only on that
// device (localStorage). It is never part of the app's code, never in a
// setlist link, and only ever sent to GitHub itself -- everyone else just
// receives the updated app and never sees or needs a token.

const SETTINGS_KEY = "arw-worship-github-sync";
const GITHUB_API = "https://api.github.com";
const FILE_PATH = "src/data/songs.json";
const BRANCH = "main";
export const DEFAULT_REPO = "danielabartelson/Zamar_Worship_Setlist";

export function getSyncSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const saved = raw ? JSON.parse(raw) : {};
    return { token: saved.token || "", repo: saved.repo || DEFAULT_REPO };
  } catch (e) {
    return { token: "", repo: DEFAULT_REPO };
  }
}

export function saveSyncSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    /* ignore storage errors */
  }
}

function utf8ToBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

async function githubErrorMessage(res) {
  try {
    const data = await res.json();
    if (data && data.message) return data.message;
  } catch (e) {
    /* not JSON, fall through */
  }
  return `status ${res.status}`;
}

// Saves happen one at a time, so flipping several Fast/Slow tags quickly
// can't collide with each other on GitHub.
let queue = Promise.resolve();
export function syncSongsToGitHub(songs, settings, message) {
  const run = queue.then(() => doSync(songs, settings, message));
  queue = run.catch(() => {});
  return run;
}

async function doSync(songs, settings, message) {
  const token = ((settings && settings.token) || "").trim();
  const repo = ((settings && settings.repo) || "").trim();

  if (!token || !repo) {
    return { ok: false, error: "Add your GitHub token first (one-time setup below)." };
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  };

  try {
    const getRes = await fetch(
      `${GITHUB_API}/repos/${repo}/contents/${FILE_PATH}?ref=${encodeURIComponent(BRANCH)}`,
      { headers }
    );
    if (!getRes.ok) {
      const detail = await githubErrorMessage(getRes);
      const hint =
        getRes.status === 404
          ? " Check the repo name, and that the token was given access to this repo."
          : getRes.status === 401
          ? " The token wasn't accepted -- it may have been copied wrong or expired."
          : "";
      return { ok: false, error: `GitHub said: "${detail}".${hint}` };
    }
    const current = await getRes.json();

    const newContent = JSON.stringify(songs, null, 2) + "\n";
    const putRes = await fetch(`${GITHUB_API}/repos/${repo}/contents/${FILE_PATH}`, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: message || "Update song library from Zamar Setlist app",
        content: utf8ToBase64(newContent),
        sha: current.sha,
        branch: BRANCH,
      }),
    });

    if (!putRes.ok) {
      const detail = await githubErrorMessage(putRes);
      const hint =
        putRes.status === 403 || putRes.status === 404
          ? " The token needs \"Contents: Read and write\" permission on this repo."
          : "";
      return { ok: false, error: `GitHub said: "${detail}".${hint}` };
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Couldn't reach GitHub: ${e.message}` };
  }
}
