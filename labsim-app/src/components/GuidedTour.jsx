import { useEffect, useState } from 'react';

export default function GuidedTour({ steps, onClose }) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);

  const step = steps[index];
  const isLast = index === steps.length - 1;

  useEffect(() => {
    function measure() {
      if (!step.selector) { setRect(null); return; }
      const el = document.querySelector(step.selector);
      if (!el) { setRect(null); return; }
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top - 8, left: r.left - 8, width: r.width + 16, height: r.height + 16 });
      }, 220);
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  function next() {
    if (isLast) { onClose(); return; }
    setIndex(i => i + 1);
  }
  function back() {
    setIndex(i => Math.max(0, i - 1));
  }

  const tooltipStyle = rect
    ? {
        top: rect.top + rect.height + 16 + window.scrollY > window.innerHeight + window.scrollY - 180
          ? rect.top + window.scrollY - 170
          : rect.top + rect.height + window.scrollY + 16,
        left: Math.min(Math.max(rect.left, 16), window.innerWidth - 340),
      }
    : null;

  return (
    <div className="tour-overlay" onClick={onClose}>
      {rect && (
        <div
          className="tour-spotlight"
          style={{ top: rect.top + window.scrollY, left: rect.left, width: rect.width, height: rect.height }}
        />
      )}
      <div
        className={`tour-tooltip ${!tooltipStyle ? 'centered' : ''}`}
        style={tooltipStyle || {}}
        onClick={e => e.stopPropagation()}
      >
        <div className="tour-tooltip-progress">{index + 1} / {steps.length}</div>
        <h4>{step.title}</h4>
        <p>{step.body}</p>
        <div className="tour-tooltip-actions">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Skip</button>
          <div style={{ display: 'flex', gap: 8 }}>
            {index > 0 && <button className="btn btn-ghost btn-sm" onClick={back}>Back</button>}
            <button className="btn btn-primary btn-sm" onClick={next}>{isLast ? 'Done' : 'Next'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
