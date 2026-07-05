import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NavBar() {
  const { user } = useAuth();
  return (
    <>
      <nav className="topnav">
        <Link to="/" className="brand">
          <div className="mark"></div>
          <div>LabSim<small>Virtual Civil Engineering Lab</small></div>
        </Link>
        <div className="navlinks">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/slump">Slump</NavLink>
          <NavLink to="/beam">Beam</NavLink>
          <NavLink to="/sieve">Sieve</NavLink>
          <NavLink to="/cbr">CBR</NavLink>
          <NavLink to={user ? '/dashboard' : '/login'}>{user ? 'Dashboard' : 'Sign in'}</NavLink>
        </div>
        <a className="nav-gh" href="https://github.com/harxhpatell" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
      </nav>
      <div className="hazard-strip"></div>
    </>
  );
}
