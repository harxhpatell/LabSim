import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import ExperimentLayout from '../components/ExperimentLayout';
import VivaCoach from '../components/VivaCoach';
import { useAuth } from '../context/AuthContext';
import { saveAttempt } from '../utils/saveAttempt';

// Simplified IS 1199 relationship: slump (mm) = (w/c ratio − 0.40) × 200, clamped 0–80
function computeSlump(wc) {
  return Math.max(0, Math.min(80, (wc - 0.40) * 200));
}

function workabilityInfo(slump) {
  if (slump < 25) return { label: 'Very Low', color: 'var(--red)', bg: '#3a1616' };
  if (slump < 50) return { label: 'Low – Medium', color: 'var(--amber)', bg: '#3a2b12' };
  return { label: 'High', color: 'var(--green)', bg: '#0d3324' };
}

export default function SlumpTest() {
  const { user } = useAuth();
  const [wc, setWc] = useState(0.55);
  const [log, setLog] = useState([]);
  const [vivaScore, setVivaScore] = useState(null);
  const canvasRef = useRef(null);
  const graphRef = useRef(null);

  const slump = computeSlump(wc);
  const info = workabilityInfo(slump);

  // ---- draw the cone on canvas whenever slump changes ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const CW = canvas.width, CH = canvas.height;
    const baseY = 300, mouldTopY = 40;
    const mouldBotW = 110, mouldTopW = 55;
    const cx = CW / 2;

    ctx.clearRect(0, 0, CW, CH);

    ctx.strokeStyle = '#26406b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, baseY); ctx.lineTo(CW - 30, baseY);
    ctx.stroke();

    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#3a4a68';
    ctx.beginPath();
    ctx.moveTo(cx - mouldBotW / 2, baseY);
    ctx.lineTo(cx - mouldTopW / 2, mouldTopY);
    ctx.lineTo(cx + mouldTopW / 2, mouldTopY);
    ctx.lineTo(cx + mouldBotW / 2, baseY);
    ctx.stroke();
    ctx.setLineDash([]);

    const pxPerMm = (baseY - mouldTopY) / 300;
    const slumpedTopY = mouldTopY + slump * pxPerMm;
    const spread = slump * 0.55;
    const fillColor = slump < 25 ? '#f87171' : slump < 50 ? '#ff8a3d' : '#4ade80';

    ctx.beginPath();
    ctx.moveTo(cx - mouldBotW / 2 - spread * 0.3, baseY);
    ctx.lineTo(cx - mouldTopW / 2 - spread, slumpedTopY);
    ctx.lineTo(cx + mouldTopW / 2 + spread, slumpedTopY);
    ctx.lineTo(cx + mouldBotW / 2 + spread * 0.3, baseY);
    ctx.closePath();
    ctx.fillStyle = fillColor + '33';
    ctx.fill();
    ctx.strokeStyle = fillColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    const dimX = cx + mouldBotW / 2 + spread + 26;
    ctx.strokeStyle = '#4a5262';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(dimX, mouldTopY); ctx.lineTo(dimX, slumpedTopY);
    ctx.moveTo(dimX - 4, mouldTopY); ctx.lineTo(dimX + 4, mouldTopY);
    ctx.moveTo(dimX - 4, slumpedTopY); ctx.lineTo(dimX + 4, slumpedTopY);
    ctx.stroke();

    ctx.fillStyle = '#7c8698';
    ctx.font = '10px "IBM Plex Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(Math.round(slump) + 'mm', dimX + 8, (mouldTopY + slumpedTopY) / 2 + 3);

    ctx.fillStyle = '#4a5262';
    ctx.textAlign = 'center';
    ctx.fillText('300mm mould', cx, mouldTopY - 14);
  }, [slump]);

  // ---- D3 graph, rebuilt on resize, updated on wc change ----
  useEffect(() => {
    const container = graphRef.current;
    if (!container) return;

    function build() {
      const svg = d3.select(container);
      svg.selectAll('*').remove();
      const bbox = container.getBoundingClientRect();
      const margin = { top: 14, right: 18, bottom: 26, left: 38 };
      const gw = bbox.width - margin.left - margin.right;
      const gh = bbox.height - margin.top - margin.bottom;

      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
      const x = d3.scaleLinear().domain([0.40, 0.80]).range([0, gw]);
      const y = d3.scaleLinear().domain([0, 80]).range([gh, 0]);

      g.append('g').selectAll('line').data(x.ticks(5)).enter().append('line')
        .attr('class', 'grid-line').attr('x1', d => x(d)).attr('x2', d => x(d)).attr('y1', 0).attr('y2', gh);
      g.append('g').selectAll('line').data(y.ticks(5)).enter().append('line')
        .attr('class', 'grid-line').attr('x1', 0).attr('x2', gw).attr('y1', d => y(d)).attr('y2', d => y(d));

      g.append('g').attr('class', 'axis').attr('transform', `translate(0,${gh})`)
        .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format('.2f')));
      g.append('g').attr('class', 'axis').call(d3.axisLeft(y).ticks(5));

      svg.append('text').attr('x', margin.left + gw / 2).attr('y', bbox.height - 2)
        .attr('text-anchor', 'middle').attr('fill', 'var(--muted-2)')
        .style('font', "10px 'IBM Plex Mono', monospace").text('w/c ratio');
      svg.append('text').attr('transform', 'rotate(-90)').attr('x', -(margin.top + gh / 2)).attr('y', 10)
        .attr('text-anchor', 'middle').attr('fill', 'var(--muted-2)')
        .style('font', "10px 'IBM Plex Mono', monospace").text('slump (mm)');

      const curveData = d3.range(0.40, 0.801, 0.01).map(v => ({ wc: v, slump: computeSlump(v) }));
      const line = d3.line().x(d => x(d.wc)).y(d => y(d.slump));

      g.append('path').datum(curveData).attr('fill', 'none').attr('stroke', '#4a5262')
        .attr('stroke-width', 1.5).attr('stroke-dasharray', '4,4').attr('d', line);

      const liveLine = g.append('path').attr('class', 'live-line')
        .attr('fill', 'none').attr('stroke', 'var(--cyan)').attr('stroke-width', 2);
      const dot = g.append('circle').attr('class', 'live-dot').attr('r', 5).attr('fill', 'var(--cyan)')
        .attr('stroke', '#0a0a0a').attr('stroke-width', 2);

      container._d3 = { x, y, curveData, line, liveLine, dot };
      update();
    }

    function update() {
      const d3state = container._d3;
      if (!d3state) return;
      const traced = d3state.curveData.filter(d => d.wc <= wc + 1e-9);
      d3state.liveLine.attr('d', d3state.line(traced));
      d3state.dot.attr('cx', d3state.x(wc)).attr('cy', d3state.y(computeSlump(wc)));
    }

    build();
    const onResize = () => build();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wc]);

  function logReading() {
    const reading = { trial: log.length + 1, wc: wc.toFixed(2), slump: Math.round(slump), workability: info.label };
    setLog(prev => [...prev, reading]);
    saveAttempt({
      userId: user?.id, experiment: 'Slump Test', code: 'IS 1199',
      resultData: { wcRatio: reading.wc, slumpMm: reading.slump, workability: reading.workability },
    });
  }

  return (
    <ExperimentLayout
      title="Slump Test"
      code="IS 1199"
      description="Measures the workability of fresh concrete. Fill the standard cone mould, lift it vertically, and measure how far the concrete slumps from the mould height of 300mm."
      inputs={
        <>
          <h2>Inputs</h2>
          <div className="field">
            <div className="field-label">
              <span>Water / Cement ratio</span>
              <span className="field-value">{wc.toFixed(2)}</span>
            </div>
            <input type="range" min="0.40" max="0.80" step="0.01" value={wc}
              onChange={e => setWc(parseFloat(e.target.value))} />
            <div className="range-scale"><span>0.40</span><span>0.80</span></div>
          </div>

          <div className="readout">
            <h2 style={{ marginBottom: 14 }}>Result</h2>
            <div className="readout-row"><span className="k">Slump</span><span className="v">{Math.round(slump)} mm</span></div>
            <div className="readout-row">
              <span className="k">Workability</span>
              <span className="badge" style={{ color: info.color, background: info.bg }}>{info.label}</span>
            </div>
            <div className="readout-row"><span className="k">Mould height</span><span className="v">300 mm</span></div>
            <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 6 }} onClick={logReading}>
              Log this reading
            </button>
          </div>
        </>
      }
      stage={
        <>
          <div className="stage-top blueprint">
            <canvas ref={canvasRef} width="320" height="340"></canvas>
            <span className="stage-caption">FIG 01 — SLUMP CONE, SECTION VIEW</span>
          </div>
          <div className="diagram-panel">
            <h2>W/C ratio vs slump</h2>
            <div className="graph-legend">
              <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--muted-2)', borderTop: '1px dashed var(--muted-2)' }}></span>IS 1199 reference</span>
              <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--cyan)' }}></span>Your result</span>
            </div>
            <svg ref={graphRef} style={{ width: '100%', height: 260 }}></svg>
          </div>
        </>
      }
      table={
        log.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>No readings logged yet — adjust the slider and click "Log this reading".</p>
        ) : (
          <table className="obs-table">
            <thead><tr><th>Trial</th><th>W/C Ratio</th><th>Slump (mm)</th><th>Workability</th></tr></thead>
            <tbody>
              {log.map(row => (
                <tr key={row.trial}><td>{row.trial}</td><td>{row.wc}</td><td>{row.slump}</td><td>{row.workability}</td></tr>
              ))}
            </tbody>
          </table>
        )
      }
      viva={
        <VivaCoach
          experimentName="Slump Test"
          code="IS 1199"
          resultData={{ wcRatio: wc.toFixed(2), slumpMm: Math.round(slump), workability: info.label }}
          onFinish={setVivaScore}
        />
      }
      manualData={{
        title: 'Slump Test',
        code: 'IS 1199',
        studentName: user?.email,
        aim: 'To determine the workability of fresh concrete by measuring the slump using the standard slump cone apparatus.',
        procedure: [
          'Clean and lightly oil the inside of the slump cone mould, then place it on a smooth, level, non-absorbent base plate.',
          'Fill the mould with fresh concrete in four layers of roughly equal depth, tamping each layer 25 times with a standard tamping rod.',
          'Strike off the excess concrete level with the top of the mould using a trowel.',
          'Lift the mould vertically and slowly, without disturbing the concrete, over about 5-10 seconds.',
          'Measure the vertical difference between the height of the mould (300mm) and the highest point of the slumped concrete.',
          'Record the slump value and classify the workability using the standard chart.',
        ],
        inputsSummary: [{ label: 'Water / Cement ratio', value: wc.toFixed(2) }],
        resultsSummary: [
          { label: 'Slump', value: `${Math.round(slump)} mm` },
          { label: 'Workability', value: info.label },
          { label: 'Mould height', value: '300 mm' },
        ],
        tableColumns: ['Trial', 'W/C Ratio', 'Slump (mm)', 'Workability'],
        tableRows: log.map(r => [r.trial, r.wc, r.slump, r.workability]),
        vivaScore,
      }}
    />
  );
}
