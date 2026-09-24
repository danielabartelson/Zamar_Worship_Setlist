import { useLayoutEffect, useRef, useState } from "react";
import ChordLine from "./ChordLine";
import "./SongView.css";

// Lyrics/chords try to fill the screen at a large, comfortable size, and
// only shrink when a song is too long to fit without scrolling. We try
// FIT_MAX first (most songs should just use it), and only if the whole
// song doesn't fit at that size, binary-search down toward FIT_MIN for
// the largest size that still fits with no scrolling. If it still
// doesn't fit even at FIT_MIN, we stop there and let it scroll a little
// rather than shrinking further -- an occasional scroll on a very long
// song beats unreadably tiny text.
const FIT_MAX = 24;
const FIT_MIN = 13;
const FIT_ITERATIONS = 18;

function useFitToContainer(deps) {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const [fit, setFit] = useState({ size: FIT_MAX, hitFloor: false });

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    function measure() {
      inner.style.setProperty("--body-size", FIT_MAX + "px");
      if (inner.scrollHeight <= outer.clientHeight) {
        setFit({ size: FIT_MAX, hitFloor: false });
        return;
      }

      let lo = FIT_MIN;
      let hi = FIT_MAX;
      let best = FIT_MIN;
      for (let i = 0; i < FIT_ITERATIONS; i++) {
        const mid = (lo + hi) / 2;
        inner.style.setProperty("--body-size", mid + "px");
        if (inner.scrollHeight <= outer.clientHeight) {
          best = mid;
          lo = mid;
        } else {
          hi = mid;
        }
      }

      inner.style.setProperty("--body-size", best + "px");
      const hitFloor = best <= FIT_MIN + 0.05 && inner.scrollHeight > outer.clientHeight;
      setFit({ size: best, hitFloor });
    }

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(outer);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { outerRef, innerRef, fit };
}

export default function SongView({ song, revealed, topOverlay, bottomOverlay, onTapBody }) {
  const { outerRef, innerRef } = useFitToContainer([song && song.id]);
  if (!song) return null;

  return (
    <div className="song-view" ref={outerRef}>
      {topOverlay}
      <div
        className="song-view-inner"
        ref={innerRef}
        style={revealed ? { paddingTop: 54 } : undefined}
        onClick={onTapBody}
      >
        <div className="song-view-header">
          <div className="song-view-title">{song.title}</div>
        </div>
        <div className="song-body">
          {song.lines.map((line, i) => (
            <ChordLine key={i} line={line.text} />
          ))}
        </div>
      </div>
      {bottomOverlay}
    </div>
  );
}
