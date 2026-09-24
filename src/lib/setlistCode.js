import LZString from "lz-string";

const STORAGE_KEY = "arw-worship-last-setlist";

export function encodeSetlist(setlist) {
  return LZString.compressToEncodedURIComponent(JSON.stringify(setlist));
}

export function decodeSetlist(code) {
  try {
    const json = LZString.decompressFromEncodedURIComponent(code);
    if (!json) return null;
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

export function buildSetlistUrl(setlist) {
  const code = encodeSetlist(setlist);
  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set("set", code);
  return url.toString();
}

export function rememberSetlist(setlist) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(setlist));
  } catch (e) {
    /* ignore */
  }
}

export function getRememberedSetlist() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
