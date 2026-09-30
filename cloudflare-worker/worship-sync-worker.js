// Zamar Setlist -- publish-for-everyone helper.
//
// The app itself never holds a GitHub token anymore (baking a real
// credential into a public website means anyone could dig it out of the
// page and use it). Instead, the app sends the passcode + the updated
// song list here, and THIS worker -- which runs privately on Cloudflare,
// not in anyone's browser -- checks the passcode and, if it matches, uses
// its own privately-stored GitHub token to commit the change. The app
// only ever knows this worker's URL and the plain passcode; the GitHub
// token itself is never sent to, or visible from, any phone or browser.
//
// Setup (one time): see the step-by-step instructions that came with
// this file. In short -- create a Worker on Cloudflare, paste this file
// in as its code, then add three "secret" variables in the Worker's
// Settings -> Variables screen (never in this file):
//   GITHUB_TOKEN     the GitHub personal access token (repo-scoped)
//   GITHUB_REPO      "username/reponame", e.g. "danielb/zamar-setlist"
//   SYNC_PASSCODE    the code people type in the app, e.g. "070722"

const GITHUB_API = "https://api.github.com";
const FILE_PATH = "src/data/songs.json";
const BRANCH = "main";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return json({ error: "Bad request body" }, 400);
    }

    const { passcode, songs, message } = body || {};

    if (!env.SYNC_PASSCODE || passcode !== env.SYNC_PASSCODE) {
      return json({ error: "That code doesn't match -- double check it and try again." }, 403);
    }
    if (!Array.isArray(songs)) {
      return json({ error: "Missing song list in request." }, 400);
    }
    if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) {
      return json({ error: "The publish service isn't fully configured yet (missing GitHub settings)." }, 500);
    }

    const headers = {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "zamar-setlist-sync-worker",
    };

    try {
      const getRes = await fetch(
        `${GITHUB_API}/repos/${env.GITHUB_REPO}/contents/${FILE_PATH}?ref=${encodeURIComponent(BRANCH)}`,
        { headers }
      );
      if (!getRes.ok) {
        const detail = await getRes.json().catch(() => ({}));
        return json({ error: `GitHub said: "${detail.message || getRes.status}".` }, 502);
      }
      const current = await getRes.json();

      const newContent = JSON.stringify(songs, null, 2) + "\n";
      const putRes = await fetch(`${GITHUB_API}/repos/${env.GITHUB_REPO}/contents/${FILE_PATH}`, {
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
        const detail = await putRes.json().catch(() => ({}));
        return json({ error: `GitHub said: "${detail.message || putRes.status}". Try again in a moment.` }, 502);
      }

      return json({ ok: true });
    } catch (e) {
      return json({ error: `Couldn't reach GitHub: ${e.message}` }, 502);
    }
  },
};
