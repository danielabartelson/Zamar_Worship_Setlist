import { useEffect, useRef, useState } from "react";
import SongView from "./SongView";
import { buildSetlistUrl } from "../lib/setlistCode";
import "./SetlistViewer.css";

// All songs sit side by side in one horizontally scrolling strip that
// snaps to a song at a time. Because it's the browser's own scrolling, the
// song follows your finger, flicks with momentum, springs back at the
// ends, and settles with a smooth slide -- the natural "page" feel -- and
// vertical scrolling inside a long song still works normally.
function prettyDate(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
  if (!m) return value;
  return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function SetlistViewer({ setlist, songsById, onEdit, onBuild }) {
  const slots = (setlist.slots || []).filter((s) => s.songId && songsById[s.songId]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const pagerRef = useRef(null);
  const indexRef = useRef(0);
  const safeIndex = Math.min(activeIndex, Math.max(slots.length - 1, 0));
  indexRef.current = safeIndex;

  // Keep the current song lined up if the screen is resized/rotated.
  useEffect(() => {
    const el = pagerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      el.scrollLeft = indexRef.current * el.clientWidth;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [slots.length]);

  // As you drag, each song shrinks and fades slightly the further it is
  // from center -- so the song you're leaving slides away while the next
  // one swells into place. Applied straight to the elements (no React
  // re-render per frame) so it stays smooth.
  function handleScroll() {
    const el = pagerRef.current;
    if (!el || !el.clientWidth) return;
    const pos = el.scrollLeft / el.clientWidth;
    Array.from(el.children).forEach((page, n) => {
      const d = Math.min(Math.abs(pos - n), 1);
      page.style.setProperty("--swipe-scale", String(1 - 0.07 * d));
      page.style.setProperty("--swipe-opacity", String(1 - 0.55 * d));
    });
    const i = Math.round(pos);
    if (i !== indexRef.current) {
      setActiveIndex(i);
      // Tiny tick on phones that allow it (Android). iPhones don't allow
      // web apps to vibrate, so there the motion alone carries the feel.
      if (navigator.vibrate) navigator.vibrate(8);
    }
  }

  function goTo(i) {
    const el = pagerRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }

  function handleKeyDown(e) {
    if (e.key === "ArrowRight") goTo(Math.min(safeIndex + 1, slots.length - 1));
    if (e.key === "ArrowLeft") goTo(Math.max(safeIndex - 1, 0));
  }

  async function handleShare() {
    const url = buildSetlistUrl(setlist);
    if (navigator.share) {
      try {
        await navigator.share({ title: setlist.service || "Setlist", url });
      } catch (e) {
        /* user canceled the share sheet -- not an error */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus("Link copied!");
    } catch (e) {
      setShareStatus("Couldn't copy automatically -- long-press to copy the link.");
    }
    setTimeout(() => setShareStatus(""), 2500);
  }

  if (slots.length === 0) {
    return (
      <div className="setlist-viewer setlist-viewer-empty">
        <p>No setlist in progress yet.</p>
        <button onClick={onBuild}>Build a Setlist</button>
      </div>
    );
  }

  return (
    <div className="setlist-viewer">
      <div className="setlist-meta">
        <div className="setlist-meta-text">
          <div className="setlist-service">{setlist.service}</div>
          <div className="setlist-date">{prettyDate(setlist.date)}</div>
        </div>
        {onEdit && (
          <button className="setlist-edit-btn" onClick={onEdit}>
            Edit
          </button>
        )}
      </div>

      <div className="viewer-shell">
        <div
          className="song-pager"
          ref={pagerRef}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {slots.map((slot) => (
            <div className="song-pager-page" key={slot.id}>
              <SongView
                song={songsById[slot.songId]}
                revealed={revealed}
                onTapBody={() => setRevealed((r) => !r)}
              />
            </div>
          ))}
        </div>

        {revealed && (
          <div className="chip-overlay">
            {slots.map((slot, i) => (
              <button
                key={slot.id}
                className={"chip" + (i === safeIndex ? " chip-active" : "")}
                onClick={() => goTo(i)}
              >
                {songsById[slot.songId].title}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="setlist-footer">
        <button className="share-btn" onClick={handleShare}>
          Share Setlist
        </button>
        {shareStatus && <p className="share-status">{shareStatus}</p>}
      </div>
    </div>
  );
}
