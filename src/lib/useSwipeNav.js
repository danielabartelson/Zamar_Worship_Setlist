import { useRef } from "react";

// Turns a plain touch gesture into either a "tap" (toggle the chip/reveal
// overlay) or a "swipe" (go to the previous/next song) on the lyrics
// screen -- built by hand instead of pulling in a swipe-gesture library,
// since all we need is a horizontal-drag-distance check.
//
// A swipe only counts if it moved mostly sideways (not a vertical scroll)
// and far enough on a real touch device to be intentional. Anything
// smaller than that -- or a swipe attempted past the first/last song,
// where onSwipeLeft/onSwipeRight is undefined -- is treated as a tap.
const SWIPE_MIN_DISTANCE = 50;
const SWIPE_MAX_OFF_AXIS_RATIO = 0.6; // vertical drift allowed, relative to horizontal distance
const TAP_MAX_DISTANCE = 10;
const MAX_GESTURE_MS = 700;

export function useSwipeNav({ onTap, onSwipeLeft, onSwipeRight }) {
  const start = useRef(null);
  const suppressNextClick = useRef(false);

  function handleTouchStart(e) {
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY, time: Date.now() };
  }

  function handleTouchEnd(e) {
    const s = start.current;
    start.current = null;
    if (!s) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    const dt = Date.now() - s.time;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (dt > MAX_GESTURE_MS) return; // held too long -- ignore, let it just be a scroll

    if (absDx >= SWIPE_MIN_DISTANCE && absDy <= absDx * SWIPE_MAX_OFF_AXIS_RATIO) {
      const handler = dx < 0 ? onSwipeLeft : onSwipeRight;
      if (handler) {
        e.preventDefault();
        suppressNextClick.current = true;
        handler();
      }
      return;
    }

    if (absDx <= TAP_MAX_DISTANCE && absDy <= TAP_MAX_DISTANCE) {
      e.preventDefault();
      suppressNextClick.current = true;
      onTap && onTap();
    }
  }

  // Touch devices fire a synthetic click right after touchend -- swallow
  // exactly one so a swipe or touch-tap doesn't also toggle/tap twice.
  // Mouse-only environments (desktop) never set the flag, so onClick
  // there works normally as the tap handler.
  function handleClick() {
    if (suppressNextClick.current) {
      suppressNextClick.current = false;
      return;
    }
    onTap && onTap();
  }

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onClick: handleClick,
  };
}
