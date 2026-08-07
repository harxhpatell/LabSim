import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import ExperimentLayout from '../components/ExperimentLayout';
import VivaCoach from '../components/VivaCoach';
import { useAuth } from '../context/AuthContext';
import { saveAttempt } from '../utils/saveAttempt';

// Fixed extension readings (mm) — student enters the load (kN) recorded at each.
// Defaults trace a realistic mild-steel curve: elastic rise, yield plateau, strain
// hardening to UTS, then necking down to fracture.
const EXTENSIONS = [0.03, 0.06, 0.085, 1.2, 3, 6, 9, 10.8, 12.6, 14.4]; // mm
const DEFAULT_LOADS = [10, 20, 28.3, 28.3, 32, 38, 44, 46.4, 44, 40]; // kN

export default function TensionTest() {
  const { user } = useAuth();
  const [diameter, setDiameter] = useState(12); // mm
  const [gaugeLength, setGaugeLength] = useState(60); // mm
  const [loads, setLoads] = useState(DEFAULT_LOADS);
  const [vivaScore, setVivaScore] = useState(null);
  const graphRef = useRef(null);

  function updateLoad(i, value) {
    const next = [...loads];
    next[i] = value === '' ? 0 : parseFloat(value);
    setLoads(next);
  }

  const area = (Math.PI / 4) * diameter * diameter; // mm²
  const rows = EXTENSIONS.map((ext, i) => ({
    extension: ext,
    load: loads[i],
    stress: (loads[i] * 1000) / area, // N/mm²
    strainPct: (ext / gaugeLength) * 100,
  }));

  // Young's modulus from the first two (clearly elastic) readings.
  const E = rows[1].stress / (rows[1].strainPct / 100 || 1e-9);
  const yieldStress = rows[2].stress; // load stops rising at the plateau onset
  const uts = Math.max(...rows.map(r => r.stress));
  const elongationPct = rows[rows.length - 1].strainPct; // simplified: strain at final (fracture) reading

  useEffect(() => {
    const container = graphRef.current;
    if (!container) return;
    const svg = d3.select(container);
    svg.selectAll('*').remove();
    const box = container.getBoundingClientRect();
    const margin = { top: 14, right: 20, bottom: 32, left: 48 };
    const w = box.width - margin.left - margin.right;
    const h = box.height - margin.top - margin.bottom;
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([0, Math.max(...rows.map(r => r.strainPct)) * 1.05]).range([0, w]);
    const y = d3.scaleLinear().domain([0, uts * 1.15]).range([h, 0]);

    g.append('g').selectAll('line').data(y.ticks(5)).enter().append('line')
      .attr('class', 'grid-line').attr('x1', 0).attr('x2', w).attr('y1', d => y(d)).attr('y2', d => y(d));

    g.append('g').attr('class', 'axis').attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat(d => d + '%'));
    g.append('g').attr('class', 'axis').call(d3.axisLeft(y).ticks(5));

    svg.append('text').attr('x', margin.left + w / 2).attr('y', box.height - 2)
      .attr('text-anchor', 'middle').attr('fill', 'var(--muted-2)')
      .style('font', "10px 'IBM Plex Mono', monospace").text('strain');
    svg.append('text').attr('transform', 'rotate(-90)').attr('x', -(margin.top + h / 2)).attr('y', 12)
      .attr('text-anchor', 'middle').attr('fill', 'var(--muted-2)')
      .style('font', "10px 'IBM Plex Mono', monospace").text('stress (N/mm²)');

    const line = d3.line().x(d => x(d.strainPct)).y(d => y(d.stress)).curve(d3.curveMonotoneX);
    g.append('path').datum(rows).attr('fill', 'none').attr('stroke', 'var(--cyan)').attr('stroke-width', 2.5).attr('d', line);
    g.selectAll('circle').data(rows).enter().append('circle')
      .attr('cx', d => x(d.strainPct)).attr('cy', d => y(d.stress)).attr('r', 3.5)
      .attr('fill', '#0a0a0a').attr('stroke', 'var(--cyan)').attr('stroke-width', 2);

    // mark yield and UTS points
    const utsRow = rows.reduce((a, b) => (b.stress > a.stress ? b : a), rows[0]);
    [{ row: rows[2], label: 'Yield' }, { row: utsRow, label: 'UTS' }].forEach(({ row, label }) => {
      g.append('circle').attr('cx', x(row.strainPct)).attr('cy', y(row.stress)).attr('r', 5)
        .attr('fill', 'var(--amber)').attr('stroke', '#0a0a0a').attr('stroke-width', 1.5);
      g.append('text').attr('x', x(row.strainPct)).attr('y', y(row.stress) - 10).attr('text-anchor', 'middle')
        .attr('fill', 'var(--amber)').style('font', "10px 'IBM Plex Mono', monospace").text(label);
    });
  }, [loads, diameter, gaugeLength]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ExperimentLayout
      title="Tension Test"
      code="IS 1608"
      description="Determines the stress-strain behaviour of mild steel by pulling a specimen to fracture. Enter the load recorded at each extension reading to get the full stress-strain curve, Young's modulus, yield strength, UTS, and % elongation."
      inputs={
        <>
          <h2>Inputs</h2>
          <div className="field">
            <label>Specimen diameter</label>
            <div className="num-wrap">
              <input type="number" value={diameter} min="6" max="20" step="0.5" onChange={e => setDiameter(parseFloat(e.target.value) || 1)} />
              <span className="unit">mm</span>
            </div>
          </div>
          <div className="field">
            <label>Gauge length</label>
            <div className="num-wrap">
              <input type="number" value={gaugeLength} min="20" max="200" step="1" onChange={e => setGaugeLength(parseFloat(e.target.value) || 1)} />
              <span className="unit">mm</span>
            </div>
          </div>

          <div className="readout">
            <h2 style={{ marginBottom: 14 }}>Result</h2>
            <div className="readout-row"><span className="k">Young's modulus (E)</span><span className="v">{(E / 1000).toFixed(1)} kN/mm²</span></div>
            <div className="readout-row"><span className="k">Yield strength</span><span className="v">{yieldStress.toFixed(1)} N/mm²</span></div>
            <div className="readout-row"><span className="k">UTS</span><span className="v">{uts.toFixed(1)} N/mm²</span></div>
            <div className="readout-row"><span className="k">% Elongation</span><span className="v">{elongationPct.toFixed(1)}%</span></div>
            <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
              onClick={() => saveAttempt({
                userId: user?.id, experiment: 'Tension Test', code: 'IS 1608',
                resultData: { yieldStrengthNmm2: yieldStress.toFixed(1), utsNmm2: uts.toFixed(1), elongationPct: elongationPct.toFixed(1) },
              })}>
              Save this result
            </button>
          </div>
        </>
      }
      stage={
        <div className="diagram-panel">
          <h2>Stress-strain curve</h2>
          <div className="graph-legend">
            <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--cyan)' }}></span>Stress-strain</span>
            <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--amber)' }}></span>Yield / UTS</span>
          </div>
          <svg ref={graphRef} style={{ width: '100%', height: 320 }}></svg>
        </div>
      }
      table={
        <table className="obs-table">
          <thead><tr><th>Extension (mm)</th><th>Load (kN)</th><th>Stress (N/mm²)</th><th>Strain (%)</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.extension}>
                <td>{r.extension}</td>
                <td><input type="number" min="0" step="0.1" value={loads[i]} onChange={e => updateLoad(i, e.target.value)} /></td>
                <td>{r.stress.toFixed(1)}</td>
                <td>{r.strainPct.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
      viva={
        <VivaCoach
          experimentName="Tension Test"
          code="IS 1608"
          resultData={{ youngsModulusKnMm2: (E / 1000).toFixed(1), yieldStrengthNmm2: yieldStress.toFixed(1), utsNmm2: uts.toFixed(1), elongationPct: elongationPct.toFixed(1) }}
          onFinish={setVivaScore}
        />
      }
      manualData={{
        title: 'Tension Test',
        code: 'IS 1608',
        studentName: user?.email,
        aim: 'To determine the stress-strain behaviour of a mild steel specimen under uniaxial tension, and to find its Young\u2019s modulus, yield strength, ultimate tensile strength, and percentage elongation.',
        procedure: [
          'Measure the initial diameter and mark the gauge length on the specimen.',
          'Mount the specimen in the grips of a universal testing machine (UTM).',
          'Apply tensile load gradually and record the load at fixed extension readings using an extensometer.',
          'Continue loading past the yield point, through strain hardening, until the specimen necks and fractures.',
          'Calculate stress (load/area) and strain (extension/gauge length) at each reading.',
          'Plot the stress-strain curve and read off Young\u2019s modulus (elastic slope), yield strength, UTS, and elongation at fracture.',
        ],
        inputsSummary: [{ label: 'Specimen diameter', value: `${diameter} mm` }, { label: 'Gauge length', value: `${gaugeLength} mm` }],
        resultsSummary: [
          { label: "Young's modulus", value: `${(E / 1000).toFixed(1)} kN/mm²` },
          { label: 'Yield strength', value: `${yieldStress.toFixed(1)} N/mm²` },
          { label: 'UTS', value: `${uts.toFixed(1)} N/mm²` },
          { label: '% Elongation', value: `${elongationPct.toFixed(1)}%` },
        ],
        tableColumns: ['Extension (mm)', 'Load (kN)', 'Stress (N/mm²)', 'Strain (%)'],
        tableRows: rows.map(r => [r.extension, r.load, r.stress.toFixed(1), r.strainPct.toFixed(2)]),
        vivaScore,
      }}
    />
  );
}
