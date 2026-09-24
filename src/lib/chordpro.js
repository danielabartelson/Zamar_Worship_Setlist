// Parses simple bracket chord notation, e.g. "[G]Amazing [C]grace" into
// a list of { chord, text } tokens for rendering chords above words.

export function parseChordLine(line) {
  const tokens = [];
  const re = /\[([^\]]*)\]|([^[]+)/g;
  let match;
  let pendingChord = null;
  while ((match = re.exec(line)) !== null) {
    const [, chord, text] = match;
    if (chord !== undefined) {
      if (pendingChord !== null) {
        tokens.push({ chord: pendingChord, text: "" });
      }
      pendingChord = chord;
    } else if (text) {
      tokens.push({ chord: pendingChord, text });
      pendingChord = null;
    }
  }
  if (pendingChord !== null) {
    tokens.push({ chord: pendingChord, text: "" });
  }
  return tokens;
}

export function tokensToLine(tokens) {
  return tokens
    .map((t) => (t.chord ? `[${t.chord}]${t.text}` : t.text))
    .join("");
}
