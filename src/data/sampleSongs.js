// The Potter's House (Ogden) worship song library.
//
// The actual song data now lives in songs.json in this same folder --
// that's the file the GitHub-sync save function updates when you edit a
// song from the app, so it stays a plain, easy-to-diff JSON file rather
// than JS with template literals.
//
// Two songs could not be transcribed due to a repeated read error on
// their source images and are NOT included here: "Breathe On Me.jpg"
// and "Give Thanks.jpg". These will need to be re-scanned/re-uploaded
// and added via the "Add Song" screen, or retried later.

import songsData from "./songs.json";

export const TEMPO_LABELS = { fast: "Fast", slow: "Slow", offering: "Offering" };

export const sampleSongs = songsData;
