import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NavBar() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const links = (
    <>
      <NavLink to="/" end onClick={() => setOpen(false)}>Home</NavLink>
      <NavLink to="/slump" onClick={() => setOpen(false)}>Slump</NavLink>
      <NavLink to="/beam" onClick={() => setOpen(false)}>Beam</NavLink>
      <NavLink to="/sieve" onClick={() => setOpen(false)}>Sieve</NavLink>
      <NavLink to="/cbr" onClick={() => setOpen(false)}>CBR</NavLink>
      <NavLink to="/cube" onClick={() => setOpen(false)}>Cube</NavLink>
      <NavLink to="/proctor" onClick={() => setOpen(false)}>Proctor</NavLink>
      <NavLink to={user ? '/dashboard' : '/login'} onClick={() => setOpen(false)}>
        {user ? 'Dashboard' : 'Sign in'}
      </NavLink>
    </>
  );

  return (
    <>
      <nav className="topnav">
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <div className="mark"></div>
          <div>LabSim<small>Virtual Civil Engineering Lab</small></div>
        </Link>

        <div className="navlinks navlinks-desktop">{links}</div>
        <a className="nav-gh nav-gh-desktop" href="https://github.com/harxhpatell" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>

        <button
          type="button"
          className={`nav-toggle ${open ? 'is-open' : ''}`}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
        >
          <span></span><span></span><span></span>
        </button>
      </nav>

      <div className={`mobile-menu ${open ? 'is-open' : ''}`}>
        <div className="navlinks navlinks-mobile">{links}</div>
        <a className="nav-gh" href="https://github.com/harxhpatell" target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
          GitHub
        </a>
      </div>

      <div className="hazard-strip"></div>
    </>
  );
}
