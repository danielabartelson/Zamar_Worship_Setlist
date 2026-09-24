import { useState } from "react";
import SongView from "./SongView";
import { buildSetlistUrl } from "../lib/setlistCode";
import "./SetlistViewer.css";

export default function SetlistViewer({ setlist, songsById, onPickAnother }) {
  const slots = (setlist.slots || []).filter((s) => s.songId);
  const [activeIndex, setActiveIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [shareStatus, setShareStatus] = useState("");

  async function handleShare() {
    const url = buildSetlistUrl(setlist);
    // Native share sheet on phones (Messages, email, etc.) when available;
    // otherwise fall back to copying the link to the clipboard.
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
        <p>This setlist doesn't have any songs yet.</p>
        <button onClick={onPickAnother}>Build a Setlist</button>
      </div>
    );
  }

  const activeSlot = slots[Math.min(activeIndex, slots.length - 1)];
  const activeSong = songsById[activeSlot.songId];

  function goTo(delta) {
    setActiveIndex((i) => Math.max(0, Math.min(slots.length - 1, i + delta)));
  }

  function toggleRevealed() {
    setRevealed((r) => !r);
  }

  const topOverlay = revealed ? (
    <div className="chip-overlay">
      {slots.map((slot, i) => (
        <button
          key={slot.id}
          className={"chip" + (i === activeIndex ? " chip-active" : "")}
          onClick={() => setActiveIndex(i)}
        >
          {songsById[slot.songId] ? songsById[slot.songId].title : slot.label}
        </button>
      ))}
    </div>
  ) : null;

  const bottomOverlay = revealed ? (
    <div className="nav-overlay">
      <button onClick={() => goTo(-1)} disabled={activeIndex === 0}>
        ← Prev
      </button>
      <button onClick={() => goTo(1)} disabled={activeIndex === slots.length - 1}>
        Next →
      </button>
    </div>
  ) : null;

  return (
    <div className="setlist-viewer">
      <div className="setlist-meta">
        <div className="setlist-service">{setlist.service}</div>
        <div className="setlist-date">{setlist.date}</div>
      </div>

      <div className="viewer-shell">
        <SongView
          song={activeSong}
          revealed={revealed}
          topOverlay={topOverlay}
          bottomOverlay={bottomOverlay}
          onTapBody={toggleRevealed}
        />
      </div>

      <div className="setlist-footer">
        <button className="share-btn" onClick={handleShare}>
          Share Setlist
        </button>
        {shareStatus && <p className="share-status">{shareStatus}</p>}
        <button className="link-btn setlist-footer-link" onClick={onPickAnother}>
          Build a Different Setlist
        </button>
      </div>
    </div>
  );
}
