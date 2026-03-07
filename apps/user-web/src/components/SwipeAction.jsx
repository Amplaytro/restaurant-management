import { useRef, useState } from "react";
import styles from "./SwipeAction.module.css";

export function SwipeAction({ disabled, label, onComplete }) {
  const trackRef = useRef(null);
  const [position, setPosition] = useState(0);
  const [dragging, setDragging] = useState(false);

  function reset() {
    setPosition(0);
    setDragging(false);
  }

  function onPointerDown(event) {
    if (disabled) {
      return;
    }

    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event) {
    if (!dragging || disabled || !trackRef.current) {
      return;
    }

    const bounds = trackRef.current.getBoundingClientRect();
    const nextPosition = Math.max(0, Math.min(bounds.width - 80, event.clientX - bounds.left - 24));
    setPosition(nextPosition);
  }

  function onPointerUp() {
    if (!trackRef.current) {
      reset();
      return;
    }

    const bounds = trackRef.current.getBoundingClientRect();
    const threshold = bounds.width * 0.58;

    if (position >= threshold) {
      setPosition(bounds.width - 80);
      onComplete?.();
    }

    window.setTimeout(reset, 220);
  }

  return (
    <div className={`${styles.track} ${disabled ? styles.disabled : ""}`} ref={trackRef}>
      <div className={styles.label}>{label}</div>
      <button
        className={styles.thumb}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ transform: `translateX(${position}px)` }}
        type="button"
      >
        <span />
      </button>
    </div>
  );
}
