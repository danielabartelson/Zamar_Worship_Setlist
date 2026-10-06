// The "setlist in progress" -- saved on this device as it's built, so
// leaving the Setlist page (to fix a song in the Library, say) never loses
// anything. The Current tab always shows this working setlist.
import { SLOTS } from "./slots";

const DRAFT_KEY = "arw-worship-draft";
const SOURCE_KEY = "arw-worship-current-source";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function emptyDraft() {
  return { service: "", date: today(), choices: {}, historyTs: null };
}

export function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return emptyDraft();
    return { ...emptyDraft(), ...JSON.parse(raw) };
  } catch (e) {
    return emptyDraft();
  }
}

export function saveDraft(draft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch (e) {
    /* ignore storage errors */
  }
}

// Which setlist Current shows: the one being built here ("draft"), or one
// someone sent as a share link ("link") -- whichever happened last.
export function getCurrentSource() {
  try {
    return localStorage.getItem(SOURCE_KEY) === "link" ? "link" : "draft";
  } catch (e) {
    return "draft";
  }
}

export function setCurrentSource(source) {
  try {
    localStorage.setItem(SOURCE_KEY, source);
  } catch (e) {
    /* ignore storage errors */
  }
}

export function draftToSetlist(draft) {
  const slots = SLOTS.map((s) => ({
    id: s.id,
    label: s.label,
    songId: draft.choices[s.id] || null,
  }));
  return {
    service: draft.service || "Sunday Service",
    date: draft.date,
    songIds: slots.map((s) => s.songId).filter(Boolean),
    slots,
  };
}
