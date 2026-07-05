import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import ExperimentLayout from '../components/ExperimentLayout';
import VivaCoach from '../components/VivaCoach';
import { useAuth } from '../context/AuthContext';
import { saveAttempt } from '../utils/saveAttempt';

// Standard IS 2386 sieve set. "plotSize" gives Pan a nominal position for the log-scale curve.
const SIEVES = [
  { label: '4.75 mm', size: 4.75, plotSize: 4.75 },
  { label: '2.36 mm', size: 2.36, plotSize: 2.36 },
  { label: '1.18 mm', size: 1.18, plotSize: 1.18 },
  { label: '600 μm', size: 0.6, plotSize: 0.6 },
  { label: '300 μm', size: 0.3, plotSize: 0.3 },
  { label: '150 μm', size: 0.15, plotSize: 0.15 },
  { label: 'Pan', size: 0, plotSize: 0.075 },
];

const DEFAULT_RETAINED = [45, 120, 180, 260, 210, 130, 55]; // grams, sums to 1000g sample

export default function SieveAnalysis() {
  const { user } = useAuth();
  const [totalWeight, setTotalWeight] = useState(1000);
  const [retained, setRetained] = useState(DEFAULT_RETAINED);
  const [vivaScore, setVivaScore] = useState(null);
  const graphRef = useRef(null);

  function updateRetained(i, value) {
    const next = [...retained];
    next[i] = value === '' ? 0 : parseFloat(value);
    setRetained(next);
  }

  // ---- derived rows: % retained, cumulative % retained, % passing ----
  let cumulative = 0;
  const rows = SIEVES.map((s, i) => {
    const w = retained[i] || 0;
    const pctRetained = totalWeight > 0 ? (w / totalWeight) * 100 : 0;
    cumulative += pctRetained;
    const pctPassing = Math.max(0, 100 - cumulative);
    return { ...s, weight: w, pctRetained, cumulative, pctPassing };
  });

  const sumRetained = retained.reduce((a, b) => a + (b || 0), 0);
  // Fineness modulus = sum of cumulative % retained on the six standard sieves (excludes pan) / 100
  const finenessModulus = rows.slice(0, 6).reduce((a, r) => a + r.cumulative, 0) / 100;

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

    const x = d3.scaleLog().domain([0.06, 6]).range([0, w]);
    const y = d3.scaleLinear().domain([0, 100]).range([h, 0]);

    g.append('g').selectAll('line').data(y.ticks(5)).enter().append('line')
      .attr('class', 'grid-line').attr('x1', 0).attr('x2', w).attr('y1', d => y(d)).attr('y2', d => y(d));

    g.append('g').attr('class', 'axis').attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(5, '.2~s').tickFormat(d => d >= 1 ? `${d}mm` : `${Math.round(d * 1000)}μm`));
    g.append('g').attr('class', 'axis').call(d3.axisLeft(y).ticks(5).tickFormat(d => d + '%'));

    svg.append('text').attr('x', margin.left + w / 2).attr('y', box.height - 2)
      .attr('text-anchor', 'middle').attr('fill', 'var(--muted-2)')
      .style('font', "10px 'IBM Plex Mono', monospace").text('sieve size (log scale)');
    svg.append('text').attr('transform', 'rotate(-90)').attr('x', -(margin.top + h / 2)).attr('y', 10)
      .attr('text-anchor', 'middle').attr('fill', 'var(--muted-2)')
      .style('font', "10px 'IBM Plex Mono', monospace").text('% passing');

    const sorted = [...rows].sort((a, b) => a.plotSize - b.plotSize);
    const line = d3.line().x(d => x(d.plotSize)).y(d => y(d.pctPassing)).curve(d3.curveMonotoneX);

    g.append('path').datum(sorted).attr('fill', 'none').attr('stroke', 'var(--cyan)')
      .attr('stroke-width', 2.5).attr('d', line);

    g.selectAll('circle').data(sorted).enter().append('circle')
      .attr('cx', d => x(d.plotSize)).attr('cy', d => y(d.pctPassing)).attr('r', 4)
      .attr('fill', '#0a0a0a').attr('stroke', 'var(--cyan)').attr('stroke-width', 2);
  }, [retained, totalWeight]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ExperimentLayout
      title="Sieve Analysis"
      code="IS 2386"
      description="Determines particle-size distribution of aggregate by passing a sample through a stack of standard sieves. Enter the weight retained on each sieve to get the gradation curve and fineness modulus."
      inputs={
        <>
          <h2>Inputs</h2>
          <div className="field">
            <label>Total sample weight</label>
            <div className="num-wrap">
              <input type="number" value={totalWeight} min="100" step="10"
                onChange={e => setTotalWeight(parseFloat(e.target.value) || 1)} />
              <span className="unit">g</span>
            </div>
          </div>

          <div className="readout">
            <h2 style={{ marginBottom: 14 }}>Result</h2>
            <div className="readout-row"><span className="k">Weight retained (Σ)</span><span className="v">{sumRetained.toFixed(0)} g</span></div>
            <div className="readout-row">
              <span className="k">Mass balance</span>
              <span className="badge" style={
                Math.abs(sumRetained - totalWeight) <= totalWeight * 0.02
                  ? { color: 'var(--green)', background: '#0d3324' }
                  : { color: 'var(--red)', background: '#3a1616' }
              }>
                {Math.abs(sumRetained - totalWeight) <= totalWeight * 0.02 ? 'OK' : 'Check weights'}
              </span>
            </div>
            <div className="readout-row"><span className="k">Fineness modulus</span><span className="v">{finenessModulus.toFixed(2)}</span></div>
            <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}
              onClick={() => saveAttempt({
                userId: user?.id, experiment: 'Sieve Analysis', code: 'IS 2386',
                resultData: { totalWeightG: totalWeight, finenessModulus: finenessModulus.toFixed(2) },
              })}>
              Save this result
            </button>
          </div>
        </>
      }
      stage={
        <>
          <div className="diagram-panel">
            <h2>Grain size distribution curve</h2>
            <div className="graph-legend">
              <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--cyan)' }}></span>% passing</span>
            </div>
            <svg ref={graphRef} style={{ width: '100%', height: 300 }}></svg>
          </div>
        </>
      }
      table={
        <table className="obs-table">
          <thead>
            <tr><th>Sieve</th><th>Wt. retained (g)</th><th>% retained</th><th>Cumulative %</th><th>% passing</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.label}>
                <td>{r.label}</td>
                <td><input type="number" min="0" value={retained[i]} onChange={e => updateRetained(i, e.target.value)} /></td>
                <td>{r.pctRetained.toFixed(1)}</td>
                <td>{r.cumulative.toFixed(1)}</td>
                <td>{r.pctPassing.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
      viva={
        <VivaCoach
          experimentName="Sieve Analysis"
          code="IS 2386"
          resultData={{ totalWeightG: totalWeight, finenessModulus: finenessModulus.toFixed(2) }}
          onFinish={setVivaScore}
        />
      }
      manualData={{
        title: 'Sieve Analysis',
        code: 'IS 2386',
        studentName: user?.email,
        aim: 'To determine the particle-size distribution of a given aggregate sample by passing it through a stack of standard sieves, and to compute its fineness modulus.',
        procedure: [
          'Weigh the dry aggregate sample accurately.',
          'Arrange the standard IS sieves in descending order of aperture size, with a pan at the bottom.',
          'Pour the sample onto the top sieve and shake the stack (by hand or mechanical shaker) for a fixed duration.',
          'Weigh the material retained on each sieve and on the pan.',
          'Calculate percentage retained, cumulative percentage retained, and percentage passing for each sieve.',
          'Plot the grain size distribution curve and compute the fineness modulus.',
        ],
        inputsSummary: [{ label: 'Total sample weight', value: `${totalWeight} g` }],
        resultsSummary: [
          { label: 'Weight retained (Σ)', value: `${sumRetained.toFixed(0)} g` },
          { label: 'Fineness modulus', value: finenessModulus.toFixed(2) },
        ],
        tableColumns: ['Sieve', 'Wt. retained (g)', '% retained', 'Cumulative %', '% passing'],
        tableRows: rows.map(r => [r.label, r.weight, r.pctRetained.toFixed(1), r.cumulative.toFixed(1), r.pctPassing.toFixed(1)]),
        vivaScore,
      }}
    />
  );
}
