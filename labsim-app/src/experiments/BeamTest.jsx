import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import ExperimentLayout from '../components/ExperimentLayout';
import VivaCoach from '../components/VivaCoach';
import { useAuth } from '../context/AuthContext';
import { saveAttempt } from '../utils/saveAttempt';

const E = 25000; // N/mm^2, assumed for M25 concrete

function compute(Lm, Wkn, Icm4) {
  const L = Lm * 1000, W = Wkn * 1000, I = Icm4 * 1e4;
  const deflection = (W * Math.pow(L, 3)) / (48 * E * I);
  const limit = L / 360;
  const maxMoment = (Wkn * Lm) / 4;
  return { deflection, limit, maxMoment };
}

function deflectionAt(x, L, W, I) {
  if (x > L / 2) x = L - x;
  return (W * x * (3 * L * L - 4 * x * x)) / (48 * E * I);
}

export default function BeamTest() {
  const { user } = useAuth();
  const [Lm, setLm] = useState(4);
  const [Wkn, setWkn] = useState(10);
  const [Icm4, setIcm4] = useState(15000);
  const [log, setLog] = useState([]);
  const [vivaScore, setVivaScore] = useState(null);

  const beamRef = useRef(null);
  const bmdRef = useRef(null);

  const { deflection, limit, maxMoment } = compute(Lm, Wkn, Icm4);
  const pass = deflection <= limit;

  useEffect(() => {
    const container = beamRef.current;
    if (!container) return;
    const svg = d3.select(container);
    svg.selectAll('*').remove();
    const box = container.getBoundingClientRect();
    const margin = { top: 30, right: 24, bottom: 26, left: 44 };
    const w = box.width - margin.left - margin.right;
    const h = box.height - margin.top - margin.bottom;
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const L = Lm * 1000, W = Wkn * 1000, I = Icm4 * 1e4;
    const x = d3.scaleLinear().domain([0, L]).range([0, w]);
    const maxDefl = deflectionAt(L / 2, L, W, I);
    const exaggeration = maxDefl > 0 ? Math.min(40, (h * 0.35) / maxDefl) : 1;
    const y = d3.scaleLinear().domain([0, h / exaggeration]).range([0, h]);

    g.append('line').attr('x1', 0).attr('x2', w).attr('y1', 0).attr('y2', 0)
      .attr('stroke', '#3a4a68').attr('stroke-width', 1.5).attr('stroke-dasharray', '5,4');

    const pts = d3.range(0, L + 1, L / 100).map(px => ({ px, py: deflectionAt(px, L, W, I) }));
    const line = d3.line().x(d => x(d.px)).y(d => y(d.py)).curve(d3.curveNatural);
    g.append('path').datum(pts).attr('fill', 'none').attr('stroke', 'var(--cyan)').attr('stroke-width', 2.5).attr('d', line);

    svg.append('defs').append('marker')
      .attr('id', 'arrowHead').attr('markerWidth', 8).attr('markerHeight', 8)
      .attr('refX', 4).attr('refY', 4).attr('orient', 'auto')
      .append('path').attr('d', 'M0,0 L8,4 L0,8 Z').attr('fill', 'var(--amber)');

    [0, L].forEach(px => {
      g.append('path')
        .attr('d', `M ${x(px) - 9},16 L ${x(px) + 9},16 L ${x(px)},2 Z`)
        .attr('fill', '#f5c51833').attr('stroke', 'var(--cyan-dim)');
    });

    const midY = y(deflectionAt(L / 2, L, W, I));
    g.append('line').attr('x1', x(L / 2)).attr('x2', x(L / 2)).attr('y1', midY - 34).attr('y2', midY - 4)
      .attr('stroke', 'var(--amber)').attr('stroke-width', 2).attr('marker-end', 'url(#arrowHead)');
    g.append('text').attr('x', x(L / 2)).attr('y', midY - 38).attr('text-anchor', 'middle')
      .attr('fill', 'var(--amber)').style('font', "11px 'IBM Plex Mono', monospace").text(`W = ${Wkn} kN`);

    g.append('line').attr('x1', 0).attr('x2', w).attr('y1', h + 22).attr('y2', h + 22).attr('stroke', '#4a5262');
    g.append('text').attr('x', w / 2).attr('y', h + 18).attr('text-anchor', 'middle')
      .attr('fill', '#7c8698').style('font', "10px 'IBM Plex Mono', monospace").text(`L = ${Lm} m`);
  }, [Lm, Wkn, Icm4]);

  useEffect(() => {
    const container = bmdRef.current;
    if (!container) return;
    const svg = d3.select(container);
    svg.selectAll('*').remove();
    const box = container.getBoundingClientRect();
    const margin = { top: 30, right: 24, bottom: 26, left: 44 };
    const w = box.width - margin.left - margin.right;
    const h = box.height - margin.top - margin.bottom;
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([0, Lm]).range([0, w]);
    const y = d3.scaleLinear().domain([0, maxMoment * 1.15 || 1]).range([h, 0]);

    g.append('g').attr('class', 'axis').attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(4).tickFormat(d => d + 'm'));
    g.append('g').attr('class', 'axis').call(d3.axisLeft(y).ticks(4));

    const pts = [{ px: 0, m: 0 }, { px: Lm / 2, m: maxMoment }, { px: Lm, m: 0 }];
    g.append('path').datum(pts).attr('fill', 'var(--amber)').attr('fill-opacity', 0.15)
      .attr('stroke', 'var(--amber)').attr('stroke-width', 2)
      .attr('d', d3.area().x(d => x(d.px)).y0(h).y1(d => y(d.m)));

    g.append('text').attr('x', x(Lm / 2)).attr('y', y(maxMoment) - 8).attr('text-anchor', 'middle')
      .attr('fill', 'var(--amber)').style('font', "11px 'IBM Plex Mono', monospace").text(`${maxMoment.toFixed(1)} kN·m`);
  }, [Lm, maxMoment]);

  function logReading() {
    const reading = {
      trial: log.length + 1, L: Lm, W: Wkn, I: Icm4,
      deflection: deflection.toFixed(2), check: pass ? 'Pass' : 'Fail',
    };
    setLog(prev => [...prev, reading]);
    saveAttempt({
      userId: user?.id, experiment: 'Beam Deflection', code: 'IS 456',
      resultData: { spanM: reading.L, loadKn: reading.W, deflectionMm: reading.deflection, check: reading.check },
    });
  }

  return (
    <ExperimentLayout
      title="Beam Deflection"
      code="IS 456"
      description="A simply-supported beam under a centre point load. Set the span, load and second moment of area, and check the deflection against the IS 456 serviceability limit of L/360."
      inputs={
        <>
          <h2>Inputs</h2>
          <div className="field">
            <label>Span, L</label>
            <div className="num-wrap">
              <input type="number" value={Lm} min="2" max="8" step="0.1" onChange={e => setLm(parseFloat(e.target.value) || 0)} />
              <span className="unit">m</span>
            </div>
          </div>
          <div className="field">
            <label>Point load, W (at centre)</label>
            <div className="num-wrap">
              <input type="number" value={Wkn} min="1" max="50" step="0.5" onChange={e => setWkn(parseFloat(e.target.value) || 0)} />
              <span className="unit">kN</span>
            </div>
          </div>
          <div className="field">
            <label>Moment of inertia, I</label>
            <div className="num-wrap">
              <input type="number" value={Icm4} min="2000" max="50000" step="500" onChange={e => setIcm4(parseFloat(e.target.value) || 1)} />
              <span className="unit">cm⁴</span>
            </div>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Modulus of elasticity, E</label>
            <div className="num-wrap">
              <input type="number" value={25000} disabled style={{ opacity: .55 }} />
              <span className="unit">N/mm²</span>
            </div>
          </div>

          <div className="readout">
            <h2 style={{ marginBottom: 14 }}>Result</h2>
            <div className="readout-row"><span className="k">Max deflection δ</span><span className="v">{deflection.toFixed(2)} mm</span></div>
            <div className="readout-row"><span className="k">Limit (L/360)</span><span className="v">{limit.toFixed(2)} mm</span></div>
            <div className="readout-row"><span className="k">Max moment</span><span className="v">{maxMoment.toFixed(2)} kN·m</span></div>
            <div className="readout-row">
              <span className="k">Check</span>
              <span className="badge" style={pass ? { color: 'var(--green)', background: '#0d3324' } : { color: 'var(--red)', background: '#3a1616' }}>
                {pass ? 'Pass' : 'Fail'}
              </span>
            </div>
            <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 6 }} onClick={logReading}>
              Log this reading
            </button>
          </div>
        </>
      }
      stage={
        <>
          <div className="diagram-panel">
            <h2>Deflected shape</h2>
            <svg ref={beamRef} style={{ width: '100%', height: 220 }}></svg>
          </div>
          <div className="diagram-panel">
            <h2>Bending moment diagram</h2>
            <svg ref={bmdRef} style={{ width: '100%', height: 140 }}></svg>
          </div>
        </>
      }
      table={
        log.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>No readings logged yet — adjust the inputs and click "Log this reading".</p>
        ) : (
          <table className="obs-table">
            <thead><tr><th>Trial</th><th>L (m)</th><th>W (kN)</th><th>I (cm⁴)</th><th>δ (mm)</th><th>Check</th></tr></thead>
            <tbody>
              {log.map(row => (
                <tr key={row.trial}>
                  <td>{row.trial}</td><td>{row.L}</td><td>{row.W}</td><td>{row.I}</td><td>{row.deflection}</td><td>{row.check}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      }
      viva={
        <VivaCoach
          experimentName="Beam Deflection"
          code="IS 456"
          resultData={{ spanM: Lm, loadKn: Wkn, momentOfInertiaCm4: Icm4, deflectionMm: deflection.toFixed(2), limitMm: limit.toFixed(2), check: pass ? 'Pass' : 'Fail' }}
          onFinish={setVivaScore}
        />
      }
      manualData={{
        title: 'Beam Deflection',
        code: 'IS 456',
        studentName: user?.email,
        aim: 'To verify the mid-span deflection of a simply-supported beam under a centre point load against the theoretical formula, and check it against the IS 456 serviceability limit.',
        procedure: [
          'Set up a simply-supported beam of the given span, resting on knife-edge or roller supports at each end.',
          'Apply a known point load at the exact centre of the span using a loading frame or hanger.',
          'Measure the vertical deflection at mid-span using a dial gauge fixed to a reference frame.',
          'Compare the measured deflection against the theoretical value calculated from beam bending theory.',
          'Check the deflection against the IS 456 serviceability limit of span/360.',
        ],
        inputsSummary: [
          { label: 'Span, L', value: `${Lm} m` },
          { label: 'Point load, W', value: `${Wkn} kN` },
          { label: 'Moment of inertia, I', value: `${Icm4} cm⁴` },
          { label: 'Modulus of elasticity, E', value: '25,000 N/mm²' },
        ],
        resultsSummary: [
          { label: 'Max deflection', value: `${deflection.toFixed(2)} mm` },
          { label: 'Limit (L/360)', value: `${limit.toFixed(2)} mm` },
          { label: 'Max moment', value: `${maxMoment.toFixed(2)} kN·m` },
          { label: 'Check', value: pass ? 'Pass' : 'Fail' },
        ],
        tableColumns: ['Trial', 'L (m)', 'W (kN)', 'I (cm⁴)', 'δ (mm)', 'Check'],
        tableRows: log.map(r => [r.trial, r.L, r.W, r.I, r.deflection, r.check]),
        vivaScore,
      }}
    />
  );
}
