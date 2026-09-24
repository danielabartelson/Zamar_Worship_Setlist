import { parseChordLine } from "../lib/chordpro";

// Splits a chord-token's text into one span per word (word + its trailing
// whitespace), so long chord-free runs of lyrics wrap normally at every
// word boundary instead of overflowing as one rigid unrapped block. Any
// leading whitespace (rare -- most spacing is encoded as trailing space
// on the previous token) gets folded into the first word so no text is
// ever silently dropped.
function splitWords(text) {
  const leadingWs = text.match(/^\s+/);
  const rest = leadingWs ? text.slice(leadingWs[0].length) : text;
  const words = rest.match(/\S+\s*/g) || [];
  if (leadingWs) {
    if (words.length > 0) words[0] = leadingWs[0] + words[0];
    else words.push(leadingWs[0]);
  }
  if (words.length === 0) words.push(text || " ");
  return words;
}

export default function ChordLine({ line }) {
  if (!line.trim()) {
    return <div className="chord-line chord-line-blank">&nbsp;</div>;
  }
  const tokens = parseChordLine(line);
  return (
    <div className="chord-line">
      {tokens.map((t, i) => {
        const words = splitWords(t.text || " ");
        return words.map((word, j) => {
          const chord = j === 0 ? t.chord : null;
          const isInstrumental = j === 0 && Boolean(t.chord) && !t.text.trim();
          return (
            <span
              className={"chord-token" + (isInstrumental ? " chord-token-gap" : "")}
              key={`${i}-${j}`}
            >
              <span className="chord-label">{chord ? chord : " "}</span>
              <span className="chord-text">{word}</span>
            </span>
          );
        });
      })}
    </div>
  );
}
