import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import ExperimentLayout from '../components/ExperimentLayout';
import VivaCoach from '../components/VivaCoach';
import { useAuth } from '../context/AuthContext';
import { saveAttempt } from '../utils/saveAttempt';

const MOULD_VOLUME_CC = 1000; // standard Proctor mould, cm³
const MOISTURE_PCT = [8, 10, 12, 14, 16, 18];
const DEFAULT_WET_MASS = [1750, 1850, 1920, 1960, 1940, 1880]; // grams, gives a peak around 14%

export default function CompactionTest() {
  const { user } = useAuth();
  const [wetMass, setWetMass] = useState(DEFAULT_WET_MASS);
  const [vivaScore, setVivaScore] = useState(null);
  const graphRef = useRef(null);

  function updateMass(i, value) {
    const next = [...wetMass];
    next[i] = value === '' ? 0 : parseFloat(value);
    setWetMass(next);
  }

  const rows = MOISTURE_PCT.map((mc, i) => {
    const bulkDensity = wetMass[i] / MOULD_VOLUME_CC; // g/cm³
    const dryDensity = bulkDensity / (1 + mc / 100); // g/cm³
    return { moisture: mc, wetMass: wetMass[i], bulkDensity, dryDensity };
  });

  // Peak of the entered data points — a reasonable estimate of OMC/MDD for a teaching simulator.
  const peak = rows.reduce((best, r) => (r.dryDensity > best.dryDensity ? r : best), rows[0]);

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

    const x = d3.scaleLinear().domain([MOISTURE_PCT[0] - 1, MOISTURE_PCT[MOISTURE_PCT.length - 1] + 1]).range([0, w]);
    const minD = Math.min(...rows.map(r => r.dryDensity)) * 0.95;
    const maxD = Math.max(...rows.map(r => r.dryDensity)) * 1.05;
    const y = d3.scaleLinear().domain([minD, maxD]).range([h, 0]);

    g.append('g').selectAll('line').data(y.ticks(5)).enter().append('line')
      .attr('class', 'grid-line').attr('x1', 0).attr('x2', w).attr('y1', d => y(d)).attr('y2', d => y(d));

    g.append('g').attr('class', 'axis').attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat(d => d + '%'));
    g.append('g').attr('class', 'axis').call(d3.axisLeft(y).ticks(5).tickFormat(d => d.toFixed(2)));

    svg.append('text').attr('x', margin.left + w / 2).attr('y', box.height - 2)
      .attr('text-anchor', 'middle').attr('fill', 'var(--muted-2)')
      .style('font', "10px 'IBM Plex Mono', monospace").text('moisture content');
    svg.append('text').attr('transform', 'rotate(-90)').attr('x', -(margin.top + h / 2)).attr('y', 12)
      .attr('text-anchor', 'middle').attr('fill', 'var(--muted-2)')
      .style('font', "10px 'IBM Plex Mono', monospace").text('dry density (g/cm³)');

    const line = d3.line().x(d => x(d.moisture)).y(d => y(d.dryDensity)).curve(d3.curveNatural);
    g.append('path').datum(rows).attr('fill', 'none').attr('stroke', 'var(--cyan)').attr('stroke-width', 2.5).attr('d', line);

    g.selectAll('circle').data(rows).enter().append('circle')
      .attr('cx', d => x(d.moisture)).attr('cy', d => y(d.dryDensity)).attr('r', 4)
      .attr('fill', '#0a0a0a').attr('stroke', 'var(--cyan)').attr('stroke-width', 2);

    // OMC / MDD marker
    g.append('line').attr('x1', x(peak.moisture)).attr('x2', x(peak.moisture)).attr('y1', h).attr('y2', y(peak.dryDensity))
      .attr('stroke', 'var(--amber)').attr('stroke-dasharray', '3,3').attr('stroke-width', 1);
    g.append('circle').attr('cx', x(peak.moisture)).attr('cy', y(peak.dryDensity)).attr('r', 5)
      .attr('fill', 'var(--amber)').attr('stroke', '#0a0a0a').attr('stroke-width', 1.5);
    g.append('text').attr('x', x(peak.moisture)).attr('y', y(peak.dryDensity) - 12).attr('text-anchor', 'middle')
      .attr('fill', 'var(--amber)').style('font', "10.5px 'IBM Plex Mono', monospace").text('OMC / MDD');
  }, [wetMass]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ExperimentLayout
      title="Compaction Test"
      code="IS 2720-7"
      description="Standard Proctor compaction test — determines the Optimum Moisture Content (OMC) and Maximum Dry Density (MDD) of a soil, used to specify field compaction requirements for embankments and fill."
      inputs={
        <div className="readout" style={{ borderTop: 'none', paddingTop: 0 }}>
          <h2 style={{ marginBottom: 14 }}>Result</h2>
          <div className="readout-row"><span className="k">Optimum Moisture Content</span><span className="v">{peak.moisture}%</span></div>
          <div className="readout-row"><span className="k">Max. Dry Density</span><span className="v">{peak.dryDensity.toFixed(3)} g/cm³</span></div>
          <p style={{ color: 'var(--muted-2)', fontSize: 11, marginTop: 10, lineHeight: 1.5, fontFamily: 'var(--font-mono)' }}>
            Mould volume: {MOULD_VOLUME_CC} cm³ (standard Proctor mould). OMC/MDD read off the peak of the entered data points.
          </p>
          <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
            onClick={() => saveAttempt({
              userId: user?.id, experiment: 'Compaction Test', code: 'IS 2720-7',
              resultData: { omcPct: peak.moisture, mddGcm3: peak.dryDensity.toFixed(3) },
            })}>
            Save this result
          </button>
        </div>
      }
      stage={
        <div className="diagram-panel">
          <h2>Dry density vs moisture content</h2>
          <div className="graph-legend">
            <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--cyan)' }}></span>Compaction curve</span>
            <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--amber)' }}></span>OMC / MDD</span>
          </div>
          <svg ref={graphRef} style={{ width: '100%', height: 320 }}></svg>
        </div>
      }
      table={
        <table className="obs-table">
          <thead><tr><th>Moisture content (%)</th><th>Wet mass in mould (g)</th><th>Bulk density (g/cm³)</th><th>Dry density (g/cm³)</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.moisture}>
                <td>{r.moisture}</td>
                <td><input type="number" min="0" value={wetMass[i]} onChange={e => updateMass(i, e.target.value)} /></td>
                <td>{r.bulkDensity.toFixed(3)}</td>
                <td>{r.dryDensity.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
      viva={
        <VivaCoach
          experimentName="Compaction Test"
          code="IS 2720-7"
          resultData={{ omcPct: peak.moisture, mddGcm3: peak.dryDensity.toFixed(3) }}
          onFinish={setVivaScore}
        />
      }
      manualData={{
        title: 'Compaction Test',
        code: 'IS 2720-7',
        studentName: user?.email,
        aim: 'To determine the Optimum Moisture Content (OMC) and Maximum Dry Density (MDD) of a soil sample using the standard Proctor compaction test.',
        procedure: [
          'Take a representative soil sample and mix it with a known percentage of water.',
          'Compact the moist soil into the standard Proctor mould in 3 layers, each with 25 blows of the standard rammer.',
          'Weigh the mould with compacted soil and subtract the mould\u2019s own weight to get the wet mass of soil.',
          'Take a small sample from the compacted soil to determine its actual moisture content in an oven.',
          'Repeat the process at increasing moisture contents, compacting a fresh sample each time.',
          'Calculate bulk density and dry density for each trial, plot the compaction curve, and read off the peak as OMC and MDD.',
        ],
        inputsSummary: [{ label: 'Mould volume', value: `${MOULD_VOLUME_CC} cm³` }],
        resultsSummary: [
          { label: 'Optimum Moisture Content', value: `${peak.moisture}%` },
          { label: 'Max. Dry Density', value: `${peak.dryDensity.toFixed(3)} g/cm³` },
        ],
        tableColumns: ['Moisture (%)', 'Wet mass (g)', 'Bulk density (g/cm³)', 'Dry density (g/cm³)'],
        tableRows: rows.map(r => [r.moisture, r.wetMass, r.bulkDensity.toFixed(3), r.dryDensity.toFixed(3)]),
        vivaScore,
      }}
    />
  );
}
