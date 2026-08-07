import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import ExperimentLayout from '../components/ExperimentLayout';
import VivaCoach from '../components/VivaCoach';
import { useAuth } from '../context/AuthContext';
import { saveAttempt } from '../utils/saveAttempt';

// Fixed angle-of-twist readings (degrees) — student enters the torque (N·mm) recorded at each.
// Defaults trace a straight line through the origin (purely elastic range) for a
// specimen with G ≈ 80,000 N/mm² (typical mild steel).
const ANGLES_DEG = [2, 4, 6, 8, 10, 12, 14, 16];
const DEFAULT_TORQUES = [74, 148, 222, 296, 370, 444, 518, 592]; // N·mm

export default function TorsionTest() {
  const { user } = useAuth();
  const [diameter, setDiameter] = useState(3); // mm
  const [gaugeLength, setGaugeLength] = useState(300); // mm
  const [torques, setTorques] = useState(DEFAULT_TORQUES);
  const [vivaScore, setVivaScore] = useState(null);
  const graphRef = useRef(null);

  function updateTorque(i, value) {
    const next = [...torques];
    next[i] = value === '' ? 0 : parseFloat(value);
    setTorques(next);
  }

  const J = (Math.PI * Math.pow(diameter, 4)) / 32; // mm⁴, polar moment of inertia
  const radius = diameter / 2;

  const rows = ANGLES_DEG.map((deg, i) => {
    const rad = (deg * Math.PI) / 180;
    const shearStress = (torques[i] * radius) / J; // N/mm²
    const shearStrain = (radius * rad) / gaugeLength;
    const G = rad > 0 ? (torques[i] * gaugeLength) / (J * rad) : 0; // N/mm²
    return { angleDeg: deg, angleRad: rad, torque: torques[i], shearStress, shearStrain, G };
  });

  const meanG = rows.reduce((sum, r) => sum + r.G, 0) / rows.length;

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

    const x = d3.scaleLinear().domain([0, Math.max(...ANGLES_DEG) * 1.05]).range([0, w]);
    const y = d3.scaleLinear().domain([0, Math.max(...rows.map(r => r.torque)) * 1.15]).range([h, 0]);

    g.append('g').selectAll('line').data(y.ticks(5)).enter().append('line')
      .attr('class', 'grid-line').attr('x1', 0).attr('x2', w).attr('y1', d => y(d)).attr('y2', d => y(d));

    g.append('g').attr('class', 'axis').attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat(d => d + '°'));
    g.append('g').attr('class', 'axis').call(d3.axisLeft(y).ticks(5));

    svg.append('text').attr('x', margin.left + w / 2).attr('y', box.height - 2)
      .attr('text-anchor', 'middle').attr('fill', 'var(--muted-2)')
      .style('font', "10px 'IBM Plex Mono', monospace").text('angle of twist');
    svg.append('text').attr('transform', 'rotate(-90)').attr('x', -(margin.top + h / 2)).attr('y', 12)
      .attr('text-anchor', 'middle').attr('fill', 'var(--muted-2)')
      .style('font', "10px 'IBM Plex Mono', monospace").text('torque (N·mm)');

    const line = d3.line().x(d => x(d.angleDeg)).y(d => y(d.torque));
    g.append('path').datum([{ angleDeg: 0, torque: 0 }, ...rows]).attr('fill', 'none')
      .attr('stroke', 'var(--cyan)').attr('stroke-width', 2.5).attr('d', line);
    g.selectAll('circle').data(rows).enter().append('circle')
      .attr('cx', d => x(d.angleDeg)).attr('cy', d => y(d.torque)).attr('r', 3.5)
      .attr('fill', '#0a0a0a').attr('stroke', 'var(--cyan)').attr('stroke-width', 2);
  }, [torques, diameter, gaugeLength]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ExperimentLayout
      title="Torsion Test"
      code="IS 1717"
      description="Determines the shear modulus of a metal specimen by twisting it and measuring the resulting angle of twist against applied torque. Enter the torque recorded at each twist-angle reading."
      inputs={
        <>
          <h2>Inputs</h2>
          <div className="field">
            <label>Specimen diameter</label>
            <div className="num-wrap">
              <input type="number" value={diameter} min="1" max="12" step="0.5" onChange={e => setDiameter(parseFloat(e.target.value) || 1)} />
              <span className="unit">mm</span>
            </div>
          </div>
          <div className="field">
            <label>Gauge length</label>
            <div className="num-wrap">
              <input type="number" value={gaugeLength} min="50" max="600" step="10" onChange={e => setGaugeLength(parseFloat(e.target.value) || 1)} />
              <span className="unit">mm</span>
            </div>
          </div>

          <div className="readout">
            <h2 style={{ marginBottom: 14 }}>Result</h2>
            <div className="readout-row"><span className="k">Shear modulus (G)</span><span className="v">{(meanG / 1000).toFixed(1)} kN/mm²</span></div>
            <div className="readout-row"><span className="k">Shear modulus (G)</span><span className="v">{(meanG / 1000).toFixed(0)} GPa</span></div>
            <div className="readout-row"><span className="k">Polar moment (J)</span><span className="v">{J.toFixed(2)} mm⁴</span></div>
            <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
              onClick={() => saveAttempt({
                userId: user?.id, experiment: 'Torsion Test', code: 'IS 1717',
                resultData: { shearModulusGPa: (meanG / 1000).toFixed(0), diameterMm: diameter, gaugeLengthMm: gaugeLength },
              })}>
              Save this result
            </button>
          </div>
        </>
      }
      stage={
        <div className="diagram-panel">
          <h2>Torque vs angle of twist</h2>
          <div className="graph-legend">
            <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--cyan)' }}></span>Torque-twist curve</span>
          </div>
          <svg ref={graphRef} style={{ width: '100%', height: 320 }}></svg>
        </div>
      }
      table={
        <table className="obs-table">
          <thead><tr><th>Twist angle (°)</th><th>Torque (N·mm)</th><th>Shear stress (N/mm²)</th><th>G (N/mm²)</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.angleDeg}>
                <td>{r.angleDeg}</td>
                <td><input type="number" min="0" step="1" value={torques[i]} onChange={e => updateTorque(i, e.target.value)} /></td>
                <td>{r.shearStress.toFixed(2)}</td>
                <td>{r.G.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
      viva={
        <VivaCoach
          experimentName="Torsion Test"
          code="IS 1717"
          resultData={{ shearModulusGPa: (meanG / 1000).toFixed(0), diameterMm: diameter, gaugeLengthMm: gaugeLength }}
          onFinish={setVivaScore}
        />
      }
      manualData={{
        title: 'Torsion Test',
        code: 'IS 1717',
        studentName: user?.email,
        aim: 'To determine the shear modulus (modulus of rigidity) of a metal specimen by applying a torque and measuring the resulting angle of twist over a known gauge length.',
        procedure: [
          'Measure the diameter of the specimen and mark the gauge length.',
          'Clamp one end of the specimen rigidly and connect the other end to a torque-applying chuck with an angle-measuring device.',
          'Apply torque in small increments and record the corresponding angle of twist at each step.',
          'Keep all readings within the elastic range — the torque-twist relationship should stay linear.',
          'Calculate shear stress, shear strain, and shear modulus (G = T·L / J·θ) at each reading.',
          'Take the average G across all readings as the specimen\u2019s shear modulus.',
        ],
        inputsSummary: [{ label: 'Specimen diameter', value: `${diameter} mm` }, { label: 'Gauge length', value: `${gaugeLength} mm` }],
        resultsSummary: [
          { label: 'Shear modulus (G)', value: `${(meanG / 1000).toFixed(1)} kN/mm² (${(meanG / 1000).toFixed(0)} GPa)` },
          { label: 'Polar moment of inertia (J)', value: `${J.toFixed(2)} mm⁴` },
        ],
        tableColumns: ['Twist angle (°)', 'Torque (N·mm)', 'Shear stress (N/mm²)', 'G (N/mm²)'],
        tableRows: rows.map(r => [r.angleDeg, r.torque, r.shearStress.toFixed(2), r.G.toFixed(0)]),
        vivaScore,
      }}
    />
  );
}
