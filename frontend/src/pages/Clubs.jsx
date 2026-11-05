import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TopBar from '../components/TopBar.jsx';
import ClubBadge from '../components/ClubBadge.jsx';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { CATEGORIES } from '../catalog.js';

export default function Clubs() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [mineOnly, setMineOnly] = useState(false);
  const [clubs, setClubs] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState('');

  // Search as you type, waiting for a short pause so each keystroke isn't a request.
  useEffect(() => {
    let live = true;
    const t = setTimeout(() => {
      api.listClubs(user.id, { search: search.trim(), category, mine: mineOnly ? 'member' : '' })
        .then((cs) => { if (live) { setClubs(cs); setStatus('ready'); } })
        .catch((err) => { if (live) { setError(err.message); setStatus('error'); } });
    }, search ? 250 : 0);
    return () => { live = false; clearTimeout(t); };
  }, [user.id, search, category, mineOnly]);

  async function join(club) {
    setBusyId(club._id);
    try {
      await api.joinClub(club._id, user.id);
      setClubs((cs) => cs.map((c) => (c._id === club._id ? { ...c, MyRole: 'member', MemberCount: (c.MemberCount || 0) + 1 } : c)));
      setNotice(`Joined ${club.Name}.`);
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="app">
      <TopBar />
      <main className="page">
        <div className="page-head">
          <h1 className="page-title">Clubs</h1>
          <Link to="/clubs/new" className="btn btn-primary">Start a club</Link>
        </div>

        <div className="toolbar">
          <div className="search">
            <label htmlFor="club-search" className="visually-hidden">Search clubs</label>
            <input id="club-search" type="search" placeholder="Search clubs" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="select-wrap">
            <label htmlFor="club-category" className="visually-hidden">Category</label>
            <select id="club-category" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <label className="check">
            <input type="checkbox" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} />
            Only clubs I’m in
          </label>
        </div>

        <p className="visually-hidden" role="status" aria-live="polite">{notice}</p>

        {status === 'loading' && <p className="state" role="status">Loading clubs…</p>}
        {status === 'error' && <p className="state" role="alert">Couldn’t load clubs. {error}</p>}

        {status === 'ready' && clubs.length === 0 && (
          <div className="state state-empty">
            <h2>{search || category || mineOnly ? 'No clubs match' : 'No clubs yet'}</h2>
            <p>{search || category || mineOnly ? 'Try a different search or category.' : 'Be the first to start one.'}</p>
            <Link to="/clubs/new" className="btn btn-primary">Start a club</Link>
          </div>
        )}

        {status === 'ready' && clubs.length > 0 && (
          <ul className="club-list">
            {clubs.map((c) => (
              <li key={c._id} className="club-row">
                <ClubBadge club={c} />
                <div className="club-row-text">
                  <h2 className="club-row-name"><Link to={`/clubs/${c._id}`}>{c.Name}</Link></h2>
                  <p className="club-row-meta">{c.Category}, {c.MemberCount} {c.MemberCount === 1 ? 'member' : 'members'}</p>
                  {c.Description && <p className="club-row-desc">{c.Description}</p>}
                </div>
                {c.MyRole ? (
                  <span className={`pill ${c.MyRole === 'officer' ? 'pill-host' : 'pill-going'}`}>{c.MyRole === 'officer' ? 'Officer' : 'Member'}</span>
                ) : (
                  <button type="button" className="btn btn-quiet btn-sm" disabled={busyId === c._id} onClick={() => join(c)}>
                    Join<span className="visually-hidden"> {c.Name}</span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
