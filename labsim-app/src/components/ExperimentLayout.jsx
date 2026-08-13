import { useState } from 'react';
import { Link } from 'react-router-dom';
import { generateLabManual } from '../utils/generateLabManual';
import GuidedTour from './GuidedTour';

/**
 * Shared shell for every experiment page.
 *
 * Props:
 *  - title, code, description : header content
 *  - inputs   : left-hand inputs panel content (JSX)
 *  - stage    : right-hand simulation/canvas + graph content (JSX)
 *  - table    : optional bottom observation-table content (JSX)
 *  - viva     : optional AI Viva Coach panel (JSX)
 *  - manualData : optional data object passed straight to generateLabManual() for the PDF button
 *
 * The guided tour is generic — every experiment gets one automatically because
 * they all share this layout. No per-experiment tour config needed.
 */
export default function ExperimentLayout({ title, code, description, inputs, stage, table, viva, manualData }) {
  const [tourOpen, setTourOpen] = useState(false);

  const steps = [
    { selector: null, title: `Welcome to ${title}`, body: description || `Let's walk through how this experiment works.` },
    { selector: '[data-tour="tour-inputs"]', title: 'Set your inputs', body: 'Change the values here — sliders, numbers, or a dropdown depending on the experiment. Everything recalculates live.' },
    { selector: '[data-tour="tour-stage"]', title: 'Watch it happen', body: 'This updates in real time as you change inputs — the diagram and graph are both driven by the actual formula, not a canned animation.' },
    ...(table ? [{ selector: '[data-tour="tour-table"]', title: 'Observation table', body: 'Every reading gets logged here, just like a real lab notebook — some experiments log automatically, others you fill in directly.' }] : []),
    ...(viva ? [{ selector: '[data-tour="tour-viva"]', title: 'AI Viva Coach', body: 'Once you\u2019re happy with your result, take the viva — 3 questions based on your actual numbers, graded live, with hints if you\u2019re stuck.' }] : []),
    ...(manualData ? [{ selector: '[data-tour="tour-pdf"]', title: 'Download your lab manual', body: 'One click gets you a full formatted PDF report — aim, procedure, your inputs and results, the observation table, and your viva score.' }] : []),
  ];

  return (
    <>
      <Link className="backlink" to="/">&larr; Back to experiments</Link>

      <div className="lab-header">
        <div className="lab-title">
          <h1>{title}</h1>
          {code && <span className="code-tag">{code}</span>}
          <button className="btn btn-ghost btn-sm" onClick={() => setTourOpen(true)}>
            Take the tour
          </button>
          {manualData && (
            <button className="btn btn-ghost btn-sm manual-btn" data-tour="tour-pdf"
              onClick={() => generateLabManual(manualData)}>
              Download Lab Manual (PDF)
            </button>
          )}
        </div>
        {description && <p className="lab-sub">{description}</p>}
      </div>

      <div className="lab-grid">
        <div className="panel" data-tour="tour-inputs">{inputs}</div>
        <div className="stage" data-tour="tour-stage">{stage}</div>
      </div>

      {table && (
        <div className="obs-panel" data-tour="tour-table">
          <h2>Observation Table</h2>
          <div className="table-scroll">{table}</div>
        </div>
      )}

      {viva && <div data-tour="tour-viva">{viva}</div>}

      {tourOpen && <GuidedTour steps={steps} onClose={() => setTourOpen(false)} />}
    </>
  );
}
