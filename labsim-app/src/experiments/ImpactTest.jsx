import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import ExperimentLayout from '../components/ExperimentLayout';
import VivaCoach from '../components/VivaCoach';
import { useAuth } from '../context/AuthContext';
import { saveAttempt } from '../utils/saveAttempt';

const DEFAULT_RISE_ANGLES = [58, 61, 59];

function toughnessInfo(energy) {
  if (energy < 20) return { label: 'Brittle / Low', color: 'var(--red)', bg: '#3a1616' };
  if (energy < 50) return { label: 'Moderate', color: 'var(--amber)', bg: '#3a2b12' };
  return { label: 'High / Ductile', color: 'var(--green)', bg: '#0d3324' };
}

export default function ImpactTest() {
  const { user } = useAuth();
  const [weight, setWeight] = useState(140);
  const [radius, setRadius] = useState(0.6);
  const [releaseAngle, setReleaseAngle] = useState(90);
  const [riseAngles, setRiseAngles] = useState(DEFAULT_RISE_ANGLES);
  const [vivaScore, setVivaScore] = useState(null);
  const diagramRef = useRef(null);

  function updateRise(i, value) {
    const next = [...riseAngles];
    next[i] = value === '' ? 0 : parseFloat(value);
    setRiseAngles(next);
  }

  const alphaRad = (releaseAngle * Math.PI) / 180;
  const energies = riseAngles.map(beta => {
    const betaRad = (beta * Math.PI) / 180;
    return weight * radius * (Math.cos(betaRad) - Math.cos(alphaRad));
  });
  const meanEnergy = energies.reduce((a, b) => a + b, 0) / energies.length;
  const info = toughnessInfo(meanEnergy);
  const meanBeta = riseAngles.reduce((a, b) => a + b, 0) / riseAngles.length;

  useEffect(() => {
    const container = diagramRef.current;
    if (!container) return;
    const svg = d3.select(container);
    svg.selectAll('*').remove();
    const box = container.getBoundingClientRect();
    const w = box.width, h = box.height;
    const pivot = { x: w / 2, y: 34 };
    const R = Math.min(w, h) - 70;

    const g = svg.append('g');

    g.append('circle').attr('cx', pivot.x).attr('cy', pivot.y).attr('r', 5).attr('fill', 'var(--muted-2)');
    g.append('text').attr('x', pivot.x).attr('y', pivot.y - 12).attr('text-anchor', 'middle')
      .attr('fill', 'var(--muted-2)').style('font', "9px 'IBM Plex Mono', monospace").text('PIVOT');

    g.append('line').attr('x1', pivot.x).attr('y1', pivot.y).attr('x2', pivot.x).attr('y2', pivot.y + R)
      .attr('stroke', '#3a4a68').attr('stroke-dasharray', '4,4').attr('stroke-width', 1);

    function armEnd(angleDeg) {
      const rad = (angleDeg * Math.PI) / 180;
      return { x: pivot.x + R * Math.sin(rad), y: pivot.y + R * Math.cos(rad) };
    }

    const relEnd = armEnd(releaseAngle);
    g.append('line').attr('x1', pivot.x).attr('y1', pivot.y).attr('x2', relEnd.x).attr('y2', relEnd.y)
      .attr('stroke', 'var(--muted)').attr('stroke-dasharray', '5,4').attr('stroke-width', 1.5);
    g.append('circle').attr('cx', relEnd.x).attr('cy', relEnd.y).attr('r', 8).attr('fill', 'var(--muted)').attr('opacity', 0.5);
    g.append('text').attr('x', relEnd.x).attr('y', relEnd.y - 14).attr('text-anchor', 'middle')
      .attr('fill', 'var(--muted)').style('font', "10px 'IBM Plex Mono', monospace").text(`α=${releaseAngle}°`);

    const riseEnd = armEnd(meanBeta);
    g.append('line').attr('x1', pivot.x).attr('y1', pivot.y).attr('x2', riseEnd.x).attr('y2', riseEnd.y)
      .attr('stroke', 'var(--amber)').attr('stroke-width', 2);
    g.append('circle').attr('cx', riseEnd.x).attr('cy', riseEnd.y).attr('r', 8).attr('fill', 'var(--amber)');
    g.append('text').attr('x', riseEnd.x).attr('y', riseEnd.y - 14).attr('text-anchor', 'middle')
      .attr('fill', 'var(--amber)').style('font', "10px 'IBM Plex Mono', monospace").text(`β=${meanBeta.toFixed(0)}°`);

    const specimenPos = armEnd(0);
    g.append('rect').attr('x', specimenPos.x - 14).attr('y', specimenPos.y - 4).attr('width', 28).attr('height', 8)
      .attr('fill', 'var(--cyan)').attr('opacity', 0.8);
    g.append('text').attr('x', specimenPos.x).attr('y', specimenPos.y + 22).attr('text-anchor', 'middle')
      .attr('fill', 'var(--cyan)').style('font', "9px 'IBM Plex Mono', monospace").text('SPECIMEN');

    const arcPath = d3.arc()
      .innerRadius(R * 0.3).outerRadius(R * 0.32)
      .startAngle((meanBeta * Math.PI) / 180).endAngle((releaseAngle * Math.PI) / 180);
    g.append('path').attr('d', arcPath()).attr('transform', `translate(${pivot.x},${pivot.y})`)
      .attr('fill', 'var(--cyan)').attr('opacity', 0.4);
  }, [releaseAngle, meanBeta]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ExperimentLayout
      title="Impact Test (Izod)"
      code="IS 1598"
      description="Measures the energy a notched specimen absorbs when struck by a swinging pendulum — a quick indicator of a material's toughness. Enter the pendulum's rise angle after breaking each specimen."
      inputs={
        <>
          <h2>Inputs</h2>
          <div className="field">
            <label>Pendulum weight</label>
            <div className="num-wrap">
              <input type="number" value={weight} min="10" max="500" step="1" onChange={e => setWeight(parseFloat(e.target.value) || 1)} />
              <span className="unit">N</span>
            </div>
          </div>
          <div className="field">
            <label>Pendulum arm radius</label>
            <div className="num-wrap">
              <input type="number" value={radius} min="0.1" max="1.5" step="0.05" onChange={e => setRadius(parseFloat(e.target.value) || 0.1)} />
              <span className="unit">m</span>
            </div>
          </div>
          <div className="field">
            <label>Release angle (α)</label>
            <div className="num-wrap">
              <input type="number" value={releaseAngle} min="0" max="90" step="1" onChange={e => setReleaseAngle(parseFloat(e.target.value) || 0)} />
              <span className="unit">deg</span>
            </div>
          </div>

          <div className="readout">
            <h2 style={{ marginBottom: 14 }}>Result</h2>
            <div className="readout-row"><span className="k">Mean energy absorbed</span><span className="v">{meanEnergy.toFixed(1)} J</span></div>
            <div className="readout-row">
              <span className="k">Toughness</span>
              <span className="badge" style={{ color: info.color, background: info.bg }}>{info.label}</span>
            </div>
            <p style={{ color: 'var(--muted-2)', fontSize: 11, marginTop: 6, lineHeight: 1.5, fontFamily: 'var(--font-mono)' }}>
              E = W·R·(cos β − cos α). Toughness bands here are a teaching simplification, not a numeric IS 1598 clause.
            </p>
            <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
              onClick={() => saveAttempt({
                userId: user?.id, experiment: 'Impact Test (Izod)', code: 'IS 1598',
                resultData: { meanEnergyJ: meanEnergy.toFixed(1), toughness: info.label },
              })}>
              Save this result
            </button>
          </div>
        </>
      }
      stage={
        <div className="diagram-panel">
          <h2>Pendulum swing diagram</h2>
          <div className="graph-legend">
            <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--muted)' }}></span>Release (α)</span>
            <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--amber)' }}></span>Rise, mean (β)</span>
          </div>
          <svg ref={diagramRef} style={{ width: '100%', height: 320 }}></svg>
        </div>
      }
      table={
        <table className="obs-table">
          <thead><tr><th>Specimen</th><th>Rise angle β (°)</th><th>Energy absorbed (J)</th></tr></thead>
          <tbody>
            {riseAngles.map((beta, i) => (
              <tr key={i}>
                <td>Specimen {i + 1}</td>
                <td><input type="number" min="0" max="90" value={beta} onChange={e => updateRise(i, e.target.value)} /></td>
                <td>{energies[i].toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
      viva={
        <VivaCoach
          experimentName="Impact Test (Izod)"
          code="IS 1598"
          resultData={{ meanEnergyJ: meanEnergy.toFixed(1), toughness: info.label, releaseAngleDeg: releaseAngle }}
          onFinish={setVivaScore}
        />
      }
      manualData={{
        title: 'Impact Test (Izod)',
        code: 'IS 1598',
        studentName: user?.email,
        aim: 'To determine the impact toughness of a notched metal specimen by measuring the energy absorbed when struck by a swinging pendulum.',
        procedure: [
          'Prepare notched specimens to the standard Izod dimensions and clamp one vertically in the machine vice, notch facing the striker.',
          'Raise the pendulum to the release angle (α) and lock it in place.',
          'Release the pendulum so it swings down, strikes the specimen, breaks it, and continues to rise on the far side.',
          'Record the angle the pendulum rises to (β) after breaking the specimen.',
          'Calculate the energy absorbed: E = W·R·(cos β − cos α).',
          'Repeat for multiple specimens and take the average as the material\u2019s impact toughness.',
        ],
        inputsSummary: [
          { label: 'Pendulum weight', value: `${weight} N` },
          { label: 'Pendulum arm radius', value: `${radius} m` },
          { label: 'Release angle (α)', value: `${releaseAngle}°` },
        ],
        resultsSummary: [
          { label: 'Mean energy absorbed', value: `${meanEnergy.toFixed(1)} J` },
          { label: 'Toughness', value: info.label },
        ],
        tableColumns: ['Specimen', 'Rise angle β (°)', 'Energy absorbed (J)'],
        tableRows: riseAngles.map((beta, i) => [`Specimen ${i + 1}`, beta, energies[i].toFixed(1)]),
        vivaScore,
      }}
    />
  );
}
