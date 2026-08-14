import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import ExperimentLayout from '../components/ExperimentLayout';
import VivaCoach from '../components/VivaCoach';
import { useAuth } from '../context/AuthContext';
import { saveAttempt } from '../utils/saveAttempt';

const GRADES = [15, 20, 25, 30, 35, 40];
const CUBE_SIDE_MM = 150;
const AREA = CUBE_SIDE_MM * CUBE_SIDE_MM;
const DEFAULT_LOADS = [620, 610, 630];

export default function CubeCrushing() {
  const { user } = useAuth();
  const [fck, setFck] = useState(25);
  const [loads, setLoads] = useState(DEFAULT_LOADS);
  const [vivaScore, setVivaScore] = useState(null);
  const graphRef = useRef(null);

  function updateLoad(i, value) {
    const next = [...loads];
    next[i] = value === '' ? 0 : parseFloat(value);
    setLoads(next);
  }

  const strengths = loads.map(l => (l * 1000) / AREA);
  const avgStrength = strengths.reduce((a, b) => a + b, 0) / strengths.length;
  const pass = avgStrength >= fck;
  const hasOutlier = strengths.some(s => s < avgStrength * 0.85);

  useEffect(() => {
    const container = graphRef.current;
    if (!container) return;
    const svg = d3.select(container);
    svg.selectAll('*').remove();
    const box = container.getBoundingClientRect();
    const margin = { top: 14, right: 20, bottom: 32, left: 44 };
    const w = box.width - margin.left - margin.right;
    const h = box.height - margin.top - margin.bottom;
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand().domain(['Cube 1', 'Cube 2', 'Cube 3']).range([0, w]).padding(0.35);
    const maxVal = Math.max(...strengths, fck) * 1.2;
    const y = d3.scaleLinear().domain([0, maxVal]).range([h, 0]);

    g.append('g').selectAll('line').data(y.ticks(5)).enter().append('line')
      .attr('class', 'grid-line').attr('x1', 0).attr('x2', w).attr('y1', d => y(d)).attr('y2', d => y(d));

    g.append('g').attr('class', 'axis').attr('transform', `translate(0,${h})`).call(d3.axisBottom(x));
    g.append('g').attr('class', 'axis').call(d3.axisLeft(y).ticks(5).tickFormat(d => d + ''));

    svg.append('text').attr('transform', 'rotate(-90)').attr('x', -(margin.top + h / 2)).attr('y', 10)
      .attr('text-anchor', 'middle').attr('fill', 'var(--muted-2)')
      .style('font', "10px 'IBM Plex Mono', monospace").text('strength (N/mm²)');

    g.append('line').attr('x1', 0).attr('x2', w).attr('y1', y(fck)).attr('y2', y(fck))
      .attr('stroke', 'var(--amber)').attr('stroke-dasharray', '5,4').attr('stroke-width', 1.5);
    g.append('text').attr('x', w - 4).attr('y', y(fck) - 6).attr('text-anchor', 'end')
      .attr('fill', 'var(--amber)').style('font', "10px 'IBM Plex Mono', monospace").text(`fck = ${fck}`);

    g.selectAll('rect').data(['Cube 1', 'Cube 2', 'Cube 3'].map((label, i) => ({ label, value: strengths[i] })))
      .enter().append('rect')
      .attr('x', d => x(d.label)).attr('width', x.bandwidth())
      .attr('y', d => y(d.value)).attr('height', d => h - y(d.value))
      .attr('fill', d => d.value >= fck ? 'var(--cyan)' : 'var(--red)')
      .attr('fill-opacity', 0.85);
  }, [loads, fck]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ExperimentLayout
      title="Cube Crushing Test"
      code="IS 516"
      description="Determines the compressive strength of concrete by crushing 150mm cubes to failure in a compression testing machine. Enter the failure load for 3 cubes to check the mean strength against the target grade."
      inputs={
        <>
          <h2>Inputs</h2>
          <div className="field">
            <label>Concrete grade</label>
            <div className="num-wrap">
              <select value={fck} onChange={e => setFck(parseFloat(e.target.value))}
                style={{ width: '100%', background: 'var(--panel-2)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 14, padding: '9px 12px' }}>
                {GRADES.map(g => <option key={g} value={g}>M{g}</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <label>Cube size</label>
            <div className="num-wrap">
              <input type="number" value={150} disabled style={{ opacity: .55 }} />
              <span className="unit">mm</span>
            </div>
          </div>

          <div className="readout">
            <h2 style={{ marginBottom: 14 }}>Result</h2>
            <div className="readout-row"><span className="k">Mean strength</span><span className="v">{avgStrength.toFixed(2)} N/mm²</span></div>
            <div className="readout-row"><span className="k">Target (fck)</span><span className="v">{fck} N/mm²</span></div>
            <div className="readout-row">
              <span className="k">Check</span>
              <span className="badge" style={pass ? { color: 'var(--green)', background: '#0d3324' } : { color: 'var(--red)', background: '#3a1616' }}>
                {pass ? 'Pass' : 'Fail'}
              </span>
            </div>
            {hasOutlier && (
              <p style={{ color: 'var(--amber)', fontSize: 11.5, marginTop: 4, lineHeight: 1.5 }}>
                One cube is more than 15% below the mean — worth re-checking that specimen.
              </p>
            )}
            <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
              onClick={() => saveAttempt({
                userId: user?.id, experiment: 'Cube Crushing Test', code: 'IS 516',
                resultData: { grade: `M${fck}`, meanStrengthNmm2: avgStrength.toFixed(2), check: pass ? 'Pass' : 'Fail' },
              })}>
              Save this result
            </button>
          </div>
        </>
      }
      stage={
        <div className="diagram-panel">
          <h2>Compressive strength per cube</h2>
          <div className="graph-legend">
            <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--cyan)' }}></span>Passing cube</span>
            <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--red)' }}></span>Below target</span>
          </div>
          <svg ref={graphRef} style={{ width: '100%', height: 300 }}></svg>
        </div>
      }
      table={
        <table className="obs-table">
          <thead><tr><th>Cube No.</th><th>Failure load (kN)</th><th>Compressive strength (N/mm²)</th></tr></thead>
          <tbody>
            {loads.map((l, i) => (
              <tr key={i}>
                <td>Cube {i + 1}</td>
                <td><input type="number" min="0" value={l} onChange={e => updateLoad(i, e.target.value)} /></td>
                <td>{strengths[i].toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
      viva={
        <VivaCoach
          experimentName="Cube Crushing Test"
          code="IS 516"
          resultData={{ grade: `M${fck}`, meanStrengthNmm2: avgStrength.toFixed(2), check: pass ? 'Pass' : 'Fail' }}
          onFinish={setVivaScore}
        />
      }
      manualData={{
        title: 'Cube Crushing Test',
        code: 'IS 516',
        studentName: user?.email,
        aim: `To determine the compressive strength of M${fck} grade concrete using 150mm cubes and check it against the target characteristic strength.`,
        procedure: [
          'Cast concrete cubes of 150mm size in standard moulds and cure them in a water tank for 28 days.',
          'Remove each cube from curing, wipe off surface water, and measure its dimensions.',
          'Place the cube in the compression testing machine, centred on the platen.',
          'Apply load at a uniform rate until the cube fails, and record the maximum load.',
          'Calculate compressive strength as failure load divided by the cross-sectional area (150mm × 150mm).',
          'Take the average of 3 cubes and compare against the target characteristic strength (fck) for the grade.',
        ],
        inputsSummary: [{ label: 'Concrete grade', value: `M${fck}` }, { label: 'Cube size', value: '150 × 150 × 150 mm' }],
        resultsSummary: [
          { label: 'Mean strength', value: `${avgStrength.toFixed(2)} N/mm²` },
          { label: 'Target (fck)', value: `${fck} N/mm²` },
          { label: 'Check', value: pass ? 'Pass' : 'Fail' },
        ],
        tableColumns: ['Cube No.', 'Failure load (kN)', 'Compressive strength (N/mm²)'],
        tableRows: loads.map((l, i) => [`Cube ${i + 1}`, l, strengths[i].toFixed(2)]),
        vivaScore,
      }}
    />
  );
}
