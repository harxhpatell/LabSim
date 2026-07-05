import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import ExperimentLayout from '../components/ExperimentLayout';
import VivaCoach from '../components/VivaCoach';
import { useAuth } from '../context/AuthContext';
import { saveAttempt } from '../utils/saveAttempt';

// Standard IS 2720-16 penetration set (mm) with plausible default loads (kN)
// yielding ~8% CBR at both 2.5mm and 5mm.
const PENETRATIONS = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 7.5, 10, 12.5];
const DEFAULT_LOADS = [0.20, 0.45, 0.68, 0.88, 1.06, 1.22, 1.42, 1.59, 1.95, 2.20, 2.40];

const STD_LOAD_2_5 = 13.24; // kN, standard load for 100% CBR at 2.5mm
const STD_LOAD_5_0 = 19.93; // kN, standard load for 100% CBR at 5.0mm

function interp(loads, target) {
  for (let i = 0; i < PENETRATIONS.length - 1; i++) {
    if (target >= PENETRATIONS[i] && target <= PENETRATIONS[i + 1]) {
      const t = (target - PENETRATIONS[i]) / (PENETRATIONS[i + 1] - PENETRATIONS[i]);
      return loads[i] + t * (loads[i + 1] - loads[i]);
    }
  }
  return loads[loads.length - 1];
}

export default function CBR() {
  const { user } = useAuth();
  const [loads, setLoads] = useState(DEFAULT_LOADS);
  const [vivaScore, setVivaScore] = useState(null);
  const graphRef = useRef(null);

  function updateLoad(i, value) {
    const next = [...loads];
    next[i] = value === '' ? 0 : parseFloat(value);
    setLoads(next);
  }

  const load2_5 = interp(loads, 2.5);
  const load5_0 = interp(loads, 5.0);
  const cbr2_5 = (load2_5 / STD_LOAD_2_5) * 100;
  const cbr5_0 = (load5_0 / STD_LOAD_5_0) * 100;
  const cbr = Math.max(cbr2_5, cbr5_0);

  useEffect(() => {
    const container = graphRef.current;
    if (!container) return;
    const svg = d3.select(container);
    svg.selectAll('*').remove();
    const box = container.getBoundingClientRect();
    const margin = { top: 14, right: 20, bottom: 32, left: 40 };
    const w = box.width - margin.left - margin.right;
    const h = box.height - margin.top - margin.bottom;
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([0, 12.5]).range([0, w]);
    const maxLoad = Math.max(...loads, load2_5, load5_0, 0.1);
    const y = d3.scaleLinear().domain([0, maxLoad * 1.15]).range([h, 0]);

    g.append('g').selectAll('line').data(y.ticks(5)).enter().append('line')
      .attr('class', 'grid-line').attr('x1', 0).attr('x2', w).attr('y1', d => y(d)).attr('y2', d => y(d));

    g.append('g').attr('class', 'axis').attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat(d => d + 'mm'));
    g.append('g').attr('class', 'axis').call(d3.axisLeft(y).ticks(5).tickFormat(d => d + 'kN'));

    svg.append('text').attr('x', margin.left + w / 2).attr('y', box.height - 2)
      .attr('text-anchor', 'middle').attr('fill', 'var(--muted-2)')
      .style('font', "10px 'IBM Plex Mono', monospace").text('penetration');
    svg.append('text').attr('transform', 'rotate(-90)').attr('x', -(margin.top + h / 2)).attr('y', 10)
      .attr('text-anchor', 'middle').attr('fill', 'var(--muted-2)')
      .style('font', "10px 'IBM Plex Mono', monospace").text('load');

    const pts = PENETRATIONS.map((p, i) => ({ p, load: loads[i] || 0 }));
    const line = d3.line().x(d => x(d.p)).y(d => y(d.load)).curve(d3.curveMonotoneX);

    g.append('path').datum(pts).attr('fill', 'none').attr('stroke', 'var(--cyan)')
      .attr('stroke-width', 2.5).attr('d', line);
    g.selectAll('circle').data(pts).enter().append('circle')
      .attr('cx', d => x(d.p)).attr('cy', d => y(d.load)).attr('r', 3.5)
      .attr('fill', '#0a0a0a').attr('stroke', 'var(--cyan)').attr('stroke-width', 2);

    // markers at 2.5mm and 5mm
    [[2.5, load2_5], [5.0, load5_0]].forEach(([p, l]) => {
      g.append('line').attr('x1', x(p)).attr('x2', x(p)).attr('y1', h).attr('y2', y(l))
        .attr('stroke', 'var(--amber)').attr('stroke-dasharray', '3,3').attr('stroke-width', 1);
      g.append('circle').attr('cx', x(p)).attr('cy', y(l)).attr('r', 4.5)
        .attr('fill', 'var(--amber)').attr('stroke', '#0a0a0a').attr('stroke-width', 1.5);
    });
  }, [loads, load2_5, load5_0]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ExperimentLayout
      title="CBR Test"
      code="IS 2720-16"
      description="California Bearing Ratio compares the load-penetration resistance of a soil sample against a standard crushed-stone material, used to design pavement thickness. Enter the load reading at each penetration depth."
      inputs={
        <div className="readout" style={{ borderTop: 'none', paddingTop: 0 }}>
          <h2 style={{ marginBottom: 14 }}>Result</h2>
          <div className="readout-row"><span className="k">Load @ 2.5mm</span><span className="v">{load2_5.toFixed(2)} kN</span></div>
          <div className="readout-row"><span className="k">CBR @ 2.5mm</span><span className="v">{cbr2_5.toFixed(1)}%</span></div>
          <div className="readout-row"><span className="k">Load @ 5.0mm</span><span className="v">{load5_0.toFixed(2)} kN</span></div>
          <div className="readout-row"><span className="k">CBR @ 5.0mm</span><span className="v">{cbr5_0.toFixed(1)}%</span></div>
          <div className="readout-row">
            <span className="k">Governing CBR</span>
            <span className="badge" style={{ color: 'var(--cyan)', background: '#26240d' }}>{cbr.toFixed(1)}%</span>
          </div>
          <p style={{ color: 'var(--muted-2)', fontSize: 11, marginTop: 10, lineHeight: 1.5, fontFamily: 'var(--font-mono)' }}>
            Standard loads: 13.24kN @ 2.5mm, 19.93kN @ 5.0mm (100% CBR crushed stone reference).
          </p>
          <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
            onClick={() => saveAttempt({
              userId: user?.id, experiment: 'CBR Test', code: 'IS 2720-16',
              resultData: { cbrAt2_5mm: cbr2_5.toFixed(1), cbrAt5_0mm: cbr5_0.toFixed(1), governingCbr: cbr.toFixed(1) },
            })}>
            Save this result
          </button>
        </div>
      }
      stage={
        <div className="diagram-panel">
          <h2>Load–penetration curve</h2>
          <div className="graph-legend">
            <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--cyan)' }}></span>Test curve</span>
            <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--amber)' }}></span>2.5mm / 5mm readout</span>
          </div>
          <svg ref={graphRef} style={{ width: '100%', height: 320 }}></svg>
        </div>
      }
      table={
        <table className="obs-table">
          <thead><tr><th>Penetration (mm)</th><th>Load (kN)</th></tr></thead>
          <tbody>
            {PENETRATIONS.map((p, i) => (
              <tr key={p}>
                <td>{p}</td>
                <td><input type="number" min="0" step="0.01" value={loads[i]} onChange={e => updateLoad(i, e.target.value)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      }
      viva={
        <VivaCoach
          experimentName="CBR Test"
          code="IS 2720-16"
          resultData={{ cbrAt2_5mm: cbr2_5.toFixed(1), cbrAt5_0mm: cbr5_0.toFixed(1), governingCbr: cbr.toFixed(1) }}
          onFinish={setVivaScore}
        />
      }
      manualData={{
        title: 'CBR Test',
        code: 'IS 2720-16',
        studentName: user?.email,
        aim: 'To determine the California Bearing Ratio of a soil sample, used to design the thickness of flexible pavement layers.',
        procedure: [
          'Compact the soil sample into a CBR mould at the required density and moisture content.',
          'Place a surcharge weight on the sample to simulate overburden pressure, and soak if required.',
          'Mount the mould in the loading frame and seat the penetration plunger on the sample surface.',
          'Apply load at a constant rate of penetration (1.25mm/min) and record the load at fixed penetration intervals.',
          'Plot the load-penetration curve and read off the loads at 2.5mm and 5.0mm penetration.',
          'Compute CBR% at each depth by comparing against the standard load for crushed stone, and report the higher value.',
        ],
        inputsSummary: [],
        resultsSummary: [
          { label: 'Load @ 2.5mm', value: `${load2_5.toFixed(2)} kN` },
          { label: 'CBR @ 2.5mm', value: `${cbr2_5.toFixed(1)}%` },
          { label: 'Load @ 5.0mm', value: `${load5_0.toFixed(2)} kN` },
          { label: 'CBR @ 5.0mm', value: `${cbr5_0.toFixed(1)}%` },
          { label: 'Governing CBR', value: `${cbr.toFixed(1)}%` },
        ],
        tableColumns: ['Penetration (mm)', 'Load (kN)'],
        tableRows: PENETRATIONS.map((p, i) => [p, loads[i]]),
        vivaScore,
      }}
    />
  );
}
