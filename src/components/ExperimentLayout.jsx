import { Link } from 'react-router-dom';
import { generateLabManual } from '../utils/generateLabManual';

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
 */
export default function ExperimentLayout({ title, code, description, inputs, stage, table, viva, manualData }) {
  return (
    <>
      <Link className="backlink" to="/">&larr; Back to experiments</Link>

      <div className="lab-header">
        <div className="lab-title">
          <h1>{title}</h1>
          {code && <span className="code-tag">{code}</span>}
          {manualData && (
            <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }}
              onClick={() => generateLabManual(manualData)}>
              Download Lab Manual (PDF)
            </button>
          )}
        </div>
        {description && <p className="lab-sub">{description}</p>}
      </div>

      <div className="lab-grid">
        <div className="panel">{inputs}</div>
        <div className="stage">{stage}</div>
      </div>

      {table && (
        <div className="obs-panel">
          <h2>Observation Table</h2>
          {table}
        </div>
      )}

      {viva}
    </>
  );
}
