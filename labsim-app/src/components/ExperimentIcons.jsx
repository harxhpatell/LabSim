// Small looping SVG animations for the Home page experiment cards.
// Each one hints at the actual physical phenomenon the experiment simulates —
// not decorative, a genuine (if simplified) preview of what happens.

export function SlumpIcon() {
  return (
    <svg viewBox="0 0 60 60" width="40" height="40">
      <g className="anim-slump" style={{ transformOrigin: '30px 46px' }}>
        <polygon points="20,46 40,46 34,20 26,20" fill="var(--cyan)" opacity="0.85" />
      </g>
      <line x1="14" y1="46" x2="46" y2="46" stroke="var(--muted-2)" strokeWidth="2" />
    </svg>
  );
}

export function BeamIcon() {
  return (
    <svg viewBox="0 0 60 60" width="40" height="40">
      <path className="anim-beam-straight" d="M12,26 L48,26" stroke="var(--cyan)" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path className="anim-beam-bent" d="M12,26 Q30,38 48,26" stroke="var(--cyan)" strokeWidth="4" fill="none" strokeLinecap="round" />
      <polygon points="12,46 8,54 16,54" fill="var(--muted-2)" />
      <polygon points="48,46 44,54 52,54" fill="var(--muted-2)" />
      <line x1="12" y1="46" x2="48" y2="46" stroke="var(--muted-2)" strokeWidth="2" />
    </svg>
  );
}

export function SieveIcon() {
  return (
    <svg viewBox="0 0 60 60" width="40" height="40">
      <line x1="14" y1="20" x2="46" y2="20" stroke="var(--muted-2)" strokeWidth="2" />
      <line x1="14" y1="32" x2="46" y2="32" stroke="var(--muted-2)" strokeWidth="2" />
      <line x1="14" y1="44" x2="46" y2="44" stroke="var(--muted-2)" strokeWidth="2" />
      <circle className="anim-sieve-dot" cx="22" cy="14" r="2.5" fill="var(--cyan)" style={{ animationDelay: '0s' }} />
      <circle className="anim-sieve-dot" cx="30" cy="14" r="2.5" fill="var(--cyan)" style={{ animationDelay: '.4s' }} />
      <circle className="anim-sieve-dot" cx="38" cy="14" r="2.5" fill="var(--cyan)" style={{ animationDelay: '.8s' }} />
    </svg>
  );
}

export function CbrIcon() {
  return (
    <svg viewBox="0 0 60 60" width="40" height="40">
      <line x1="14" y1="44" x2="46" y2="44" stroke="var(--muted-2)" strokeWidth="2" />
      <rect className="anim-cbr-rod" x="27" y="10" width="6" height="26" fill="var(--cyan)" />
    </svg>
  );
}

export function CubeIcon() {
  return (
    <svg viewBox="0 0 60 60" width="40" height="40">
      <rect className="anim-cube" x="18" y="18" width="24" height="24" fill="var(--cyan)" opacity="0.85" style={{ transformOrigin: '30px 42px' }} />
    </svg>
  );
}

export function CompactionIcon() {
  return (
    <svg viewBox="0 0 60 60" width="40" height="40">
      <line x1="14" y1="42" x2="46" y2="42" stroke="var(--muted-2)" strokeWidth="2" />
      <line x1="14" y1="48" x2="46" y2="48" stroke="var(--muted-2)" strokeWidth="2" />
      <rect className="anim-rammer" x="24" y="10" width="12" height="10" fill="var(--cyan)" />
    </svg>
  );
}

export function TensionIcon() {
  return (
    <svg viewBox="0 0 60 60" width="40" height="40">
      <rect x="10" y="26" width="6" height="8" fill="var(--muted-2)" />
      <rect x="44" y="26" width="6" height="8" fill="var(--muted-2)" />
      <rect className="anim-tension-bar" x="16" y="28" width="28" height="4" fill="var(--cyan)" style={{ transformOrigin: '30px 30px' }} />
    </svg>
  );
}

export function TorsionIcon() {
  return (
    <svg viewBox="0 0 60 60" width="40" height="40">
      <line x1="14" y1="30" x2="40" y2="30" stroke="var(--cyan)" strokeWidth="4" strokeLinecap="round" />
      <g className="anim-torsion" style={{ transformOrigin: '40px 30px' }}>
        <line x1="40" y1="30" x2="40" y2="18" stroke="var(--amber)" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function ImpactIcon() {
  return (
    <svg viewBox="0 0 60 60" width="40" height="40">
      <circle cx="30" cy="12" r="2" fill="var(--muted-2)" />
      <g className="anim-pendulum" style={{ transformOrigin: '30px 12px' }}>
        <line x1="30" y1="12" x2="30" y2="38" stroke="var(--muted)" strokeWidth="2" />
        <circle cx="30" cy="42" r="5" fill="var(--amber)" />
      </g>
      <line x1="16" y1="50" x2="44" y2="50" stroke="var(--muted-2)" strokeWidth="2" />
    </svg>
  );
}
