import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function TopBar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="topbar">
      <Link to="/events" className="brand">Quad</Link>
      <nav className="topbar-nav" aria-label="Main">
        <NavLink to="/events" end>Events</NavLink>
        <NavLink to="/clubs">Clubs</NavLink>
      </nav>
      <div className="topbar-actions">
        {user ? (
          <>
            <span className="topbar-name">{user.FirstName}</span>
            <button type="button" className="btn btn-quiet btn-sm" onClick={() => { signOut(); navigate('/login'); }}>
              Log out
            </button>
          </>
        ) : (
          <Link to="/login" className="btn btn-quiet btn-sm">Log in</Link>
        )}
      </div>
    </header>
  );
}
