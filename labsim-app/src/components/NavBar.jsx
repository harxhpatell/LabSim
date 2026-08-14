import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CIVIL = [
  { to: '/slump', label: 'Slump Test' },
  { to: '/beam', label: 'Beam Deflection' },
  { to: '/sieve', label: 'Sieve Analysis' },
  { to: '/cbr', label: 'CBR Test' },
  { to: '/cube', label: 'Cube Crushing' },
  { to: '/proctor', label: 'Compaction Test' },
];

const MECHANICAL = [
  { to: '/tension', label: 'Tension Test' },
  { to: '/torsion', label: 'Torsion Test' },
  { to: '/impact', label: 'Impact Test' },
];

function DropdownGroup({ label, items, openGroup, setOpenGroup, closeAll }) {
  const isOpen = openGroup === label;
  return (
    <div className="nav-dropdown">
      <button
        type="button"
        className={`nav-dropdown-trigger ${isOpen ? 'is-open' : ''}`}
        onClick={() => setOpenGroup(isOpen ? null : label)}
        aria-expanded={isOpen}
      >
        {label} <span className="chev">▾</span>
      </button>
      {isOpen && (
        <div className="nav-dropdown-panel">
          {items.map(item => (
            <NavLink key={item.to} to={item.to} onClick={closeAll}>{item.label}</NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NavBar() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState(null);
  const navRef = useRef(null);

  function closeAll() {
    setMobileOpen(false);
    setOpenGroup(null);
  }

  useEffect(() => {
    function onClick(e) {
      if (navRef.current && !navRef.current.contains(e.target)) setOpenGroup(null);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <>
      <nav className="topnav" ref={navRef}>
        <Link to="/" className="brand" onClick={closeAll}>
          <div className="mark"></div>
          <div>LabSim<small>Virtual Engineering Lab</small></div>
        </Link>

        <div className="navlinks navlinks-desktop">
          <NavLink to="/" end onClick={closeAll}>Home</NavLink>
          <DropdownGroup label="Civil" items={CIVIL} openGroup={openGroup} setOpenGroup={setOpenGroup} closeAll={closeAll} />
          <DropdownGroup label="Mechanical" items={MECHANICAL} openGroup={openGroup} setOpenGroup={setOpenGroup} closeAll={closeAll} />
          <NavLink to={user ? '/dashboard' : '/login'} onClick={closeAll}>
            {user ? 'Dashboard' : 'Sign in'}
          </NavLink>
        </div>

        <a className="nav-gh nav-gh-desktop" href="https://github.com/harxhpatell" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>

        <button
          type="button"
          className={`nav-toggle ${mobileOpen ? 'is-open' : ''}`}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(o => !o)}
        >
          <span></span><span></span><span></span>
        </button>
      </nav>

      <div className={`mobile-menu ${mobileOpen ? 'is-open' : ''}`}>
        <div className="navlinks-mobile">
          <NavLink to="/" end onClick={closeAll}>Home</NavLink>

          <div className="mobile-group-label">Civil</div>
          {CIVIL.map(item => <NavLink key={item.to} to={item.to} onClick={closeAll}>{item.label}</NavLink>)}

          <div className="mobile-group-label">Mechanical</div>
          {MECHANICAL.map(item => <NavLink key={item.to} to={item.to} onClick={closeAll}>{item.label}</NavLink>)}

          <NavLink to={user ? '/dashboard' : '/login'} onClick={closeAll}>
            {user ? 'Dashboard' : 'Sign in'}
          </NavLink>
        </div>
        <a className="nav-gh" href="https://github.com/harxhpatell" target="_blank" rel="noopener noreferrer" onClick={closeAll}>
          GitHub
        </a>
      </div>

      <div className="hazard-strip"></div>
    </>
  );
}
