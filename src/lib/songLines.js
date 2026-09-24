// Converts between the app's internal `lines` array format
// ([{ text: "..." }, ...]) and a single editable multi-line string, so a
// song's lyrics/chords can be edited as plain text in a textarea.

export function linesToText(lines) {
  return (lines || []).map((l) => l.text).join("\n");
}

export function textToLines(text) {
  return text.replace(/\r\n/g, "\n").split("\n").map((t) => ({ text: t }));
}
