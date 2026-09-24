// Commits an updated songs.json straight to GitHub from the browser --
// no backend/serverless function involved. GitHub's REST API supports
// authenticated cross-origin requests, so the app can call it directly.
// That commit is what makes an edit "live for everyone": it's what
// triggers the GitHub Actions workflow to rebuild and redeploy the app to
// GitHub Pages.
//
// The GitHub token and repo name are entered once on whichever phone/
// device should be able to publish changes, and are remembered only on
// that device (localStorage) -- they're never included in the setlist
// links you share with the band, and never leave this device except in
// the direct call to GitHub's own API.

const SETTINGS_KEY = "arw-worship-github-sync";
const GITHUB_API = "https://api.github.com";
const FILE_PATH = "src/data/songs.json";
const BRANCH = "main";

export function getSyncSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : { token: "", repo: "" };
  } catch (e) {
    return { token: "", repo: "" };
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

// Pulls a plain human-readable message out of a GitHub API error response
// instead of showing raw JSON to the user.
async function githubErrorMessage(res) {
  try {
    const data = await res.json();
    if (data && data.message) return data.message;
  } catch (e) {
    /* not JSON, fall through */
  }
  return `status ${res.status}`;
}

export async function syncSongsToGitHub(songs, settings, message) {
  const token = (settings && settings.token || "").trim();
  const repo = (settings && settings.repo || "").trim();

  if (!token || !repo) {
    return { ok: false, error: "Enter your GitHub token and repo (username/reponame) above first." };
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
          ? " Double check the repo name (username/reponame) and that the file exists in it."
          : getRes.status === 401
          ? " Double check the token was copied correctly and hasn't expired."
          : "";
      return {
        ok: false,
        error: `GitHub said: "${detail}".${hint}`,
      };
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
      return {
        ok: false,
        error: `GitHub said: "${detail}". Try Save again in a moment.`,
      };
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Couldn't reach GitHub: ${e.message}` };
  }
}
