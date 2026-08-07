import React, { useEffect } from 'react';

export default function Toast({ message, onDone, duration = 2000 }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, duration);
    return () => clearTimeout(t);
  }, [message, duration, onDone]);

  return (
    <div className={`toast ${message ? 'is-visible' : ''}`} role="status" aria-live="polite">
      {message || ''}
    </div>
  );
}
