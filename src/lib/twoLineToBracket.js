// Helpers for the "Add Song" screen: turn a pasted chord-line-above-lyric
// pair into bracket chord notation, so users don't have to hand-type it.

const CHORD_TOKEN = /^[A-G](#|b)?(m|maj|min|dim|aug|sus|add)?[0-9]*(\/[A-G](#|b)?)?$/;

export function looksLikeChordLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  const words = trimmed.split(/\s+/);
  const chordish = words.filter((w) => CHORD_TOKEN.test(w));
  return chordish.length > 0 && chordish.length === words.length;
}

export function twoLineToBracket(chordLine, lyricLine) {
  // Find each chord's column position in chordLine, then snap it to the
  // nearest word start in lyricLine.
  const chordMatches = [...chordLine.matchAll(/\S+/g)].map((m) => ({
    text: m[0],
    index: m.index,
  }));
  const wordMatches = [...lyricLine.matchAll(/\S+/g)].map((m) => ({
    text: m[0],
    index: m.index,
    end: m.index + m[0].length,
  }));

  if (wordMatches.length === 0) {
    return chordMatches.map((c) => `[${c.text}]`).join("");
  }

  const insertions = {}; // wordIndex -> [chords]
  for (const c of chordMatches) {
    let best = 0;
    let bestDist = Infinity;
    wordMatches.forEach((w, i) => {
      const dist = Math.abs(w.index - c.index);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    if (!insertions[best]) insertions[best] = [];
    insertions[best].push(c.text);
  }

  let out = "";
  wordMatches.forEach((w, i) => {
    if (insertions[i]) {
      out += insertions[i].map((ch) => `[${ch}]`).join("");
    }
    out += w.text;
    if (i < wordMatches.length - 1) out += " ";
  });
  return out;
}

export function draftFromRawText(rawText) {
  const rawLines = rawText.replace(/\r\n/g, "\n").split("\n");
  const outLines = [];
  let i = 0;
  while (i < rawLines.length) {
    const line = rawLines[i];
    if (looksLikeChordLine(line) && i + 1 < rawLines.length && rawLines[i + 1].trim()) {
      outLines.push(twoLineToBracket(line, rawLines[i + 1]));
      i += 2;
    } else {
      outLines.push(line);
      i += 1;
    }
  }
  return outLines.join("\n");
}
