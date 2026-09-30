// Publishing a song edit "for everyone" goes through a small private
// Cloudflare Worker (see cloudflare-worker/worship-sync-worker.js)
// instead of calling GitHub directly from the browser. The app only ever
// sends the plain passcode and the updated song list to that worker; the
// real GitHub token that can actually publish changes lives only on
// Cloudflare's servers, never inside this app, so it can't be dug out of
// the page by anyone visiting the site.
//
// The passcode itself is just remembered on this device (localStorage)
// as a convenience so it doesn't need retyping every time.

import { SYNC_WORKER_URL } from "../syncConfig";

const PASSCODE_KEY = "arw-worship-passcode";

export function getSavedPasscode() {
  try {
    return localStorage.getItem(PASSCODE_KEY) || "";
  } catch (e) {
    return "";
  }
}

export function savePasscode(code) {
  try {
    localStorage.setItem(PASSCODE_KEY, code);
  } catch (e) {
    /* ignore storage errors */
  }
}

export async function syncSongsToGitHub(songs, passcode, message) {
  const code = (passcode || "").trim();
  if (!code) {
    return { ok: false, error: "Enter the publish code above to also push this live for everyone." };
  }
  if (!SYNC_WORKER_URL) {
    return {
      ok: false,
      error: "Saved on this device. The publish service hasn't been set up yet, so it can't go live for everyone just yet.",
    };
  }

  try {
    const res = await fetch(SYNC_WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode: code, songs, message }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (res.status === 403) {
        return { ok: false, error: "That code doesn't match -- double check it and try again." };
      }
      return { ok: false, error: data.error || `Something went wrong (status ${res.status}).` };
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Couldn't reach the publish service: ${e.message}` };
  }
}
