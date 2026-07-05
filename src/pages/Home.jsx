import { Link } from 'react-router-dom';

const experiments = [
  { to: '/slump', status: 'Live', code: 'IS 1199', name: 'Slump Test',
    desc: 'Adjust the water/cement ratio and watch the concrete cone slump in real time, plotted against the IS 1199 reference curve.' },
  { to: '/beam', status: 'Live', code: 'IS 456', name: 'Beam Deflection',
    desc: 'Set span, load and moment of inertia to see a simply-supported beam deflect, with a live bending moment diagram.' },
  { to: '/sieve', status: 'Live', code: 'IS 2386', name: 'Sieve Analysis',
    desc: 'Enter retained weights per sieve and get percentage passing plus a live grain-size distribution curve.' },
  { to: '/cbr', status: 'Live', code: 'IS 2720-16', name: 'CBR Test',
    desc: 'Enter load–penetration readings and read the California Bearing Ratio straight off the plotted curve at 2.5mm and 5mm.' },
  { to: null, status: 'Phase 3', code: 'IS 516', name: 'Cube Crushing',
    desc: '28-day compressive strength simulation with a pass/fail check against target grade.' },
];

function ExperimentCard({ exp }) {
  const isLive = !!exp.to;
  const Wrapper = isLive ? Link : 'div';
  const props = isLive ? { to: exp.to } : {};
  return (
    <Wrapper className={`card ${isLive ? 'live' : 'locked'}`} {...props}>
      <div className="card-top blueprint">
        <span className="card-status">{exp.status}</span>
        <i className="ti ti-flask"></i>
      </div>
      <div className="card-body">
        <h3>{exp.name}</h3>
        <p>{exp.desc}</p>
        <div className="card-code">{exp.code}{isLive ? ` · ${exp.to.slice(1)}` : ''}</div>
      </div>
    </Wrapper>
  );
}

export default function Home() {
  return (
    <>
      <header className="hero blueprint">
        <span className="tick" style={{ top: 18, left: 18 }}>N 23.83°</span>
        <span className="tick" style={{ top: 18, right: 18 }}>E 91.27°</span>
        <span className="tick" style={{ bottom: 18, left: 18 }}>SHEET 01/05</span>
        <span className="tick" style={{ bottom: 18, right: 18 }}>SCALE 1:1</span>
        <div className="hero-inner">
          <div className="eyebrow" style={{ justifyContent: 'center' }}>NIT AGARTALA · DEPT. OF CIVIL ENGINEERING</div>
          <h1>The lab your college<br />couldn't <span className="accent">afford to build.</span></h1>
          <p>Four standard IS-code experiments, simulated in the browser — slump cone to CBR test. Built for Tier-2/3 colleges where physical lab access is limited, exam season is short, and a real result should still mean something.</p>
          <div className="hero-actions">
            <Link className="btn btn-primary" to="/slump">Try the slump test</Link>
            <a className="btn btn-ghost" href="#experiments">See all experiments</a>
          </div>
          <div className="hero-stats">
            <div className="stat"><b>5</b><span>Experiments planned</span></div>
            <div className="stat"><b>4</b><span>Live now</span></div>
            <div className="stat"><b>IS 456</b><span>Code reference</span></div>
          </div>
        </div>
      </header>

      <section className="section" id="experiments">
        <div className="wrap">
          <h2>Experiments</h2>
          <p className="sub">Phase 2 ships as a full React app — four interactive simulations, one shared layout.</p>
          <div className="grid">
            {experiments.map((exp) => <ExperimentCard exp={exp} key={exp.name} />)}
          </div>
        </div>
      </section>

      <section className="section" id="how">
        <div className="wrap">
          <h2>How it works</h2>
          <p className="sub">No install, no lab slot booking, no waiting for equipment to free up.</p>
          <div className="steps">
            <div className="stepitem">
              <div className="n">01</div>
              <h4>Pick an experiment</h4>
              <p>Every simulation matches a real IS-code procedure your syllabus already covers.</p>
            </div>
            <div className="stepitem">
              <div className="n">02</div>
              <h4>Change the inputs</h4>
              <p>Drag sliders and type values the way you would on the actual apparatus.</p>
            </div>
            <div className="stepitem">
              <div className="n">03</div>
              <h4>Read the live result</h4>
              <p>Graphs and readouts update instantly, referenced against the IS standard curve.</p>
            </div>
            <div className="stepitem">
              <div className="n">04</div>
              <h4>Submit &amp; learn</h4>
              <p>AI viva, PDF lab manuals and teacher dashboards are coming in Phase 3.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
