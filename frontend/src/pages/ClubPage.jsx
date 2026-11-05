import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import TopBar from '../components/TopBar.jsx';
import ClubBadge from '../components/ClubBadge.jsx';
import { EventGrid } from '../components/EventTile.jsx';
import { FormMessage } from '../components/Field.jsx';
import { themeStyle } from '../themes.js';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';

export default function ClubPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  const [club, setClub] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(location.state?.flash || '');

  const load = useCallback(async () => {
    try { setClub(await api.getClub(id, user.id)); setStatus('ready'); }
    catch (err) { setError(err.status === 404 ? 'This club doesn’t exist anymore.' : err.message); setStatus('error'); }
  }, [id, user.id]);

  useEffect(() => { load(); }, [load]);

  async function act(fn, msg) {
    setBusy(true);
    setActionError('');
    try { await fn(); await load(); setNotice(msg); }
    catch (err) { setActionError(err.message); }
    finally { setBusy(false); }
  }

  if (status !== 'ready') {
    return (
      <div className="app">
        <TopBar />
        <main className="page">
          {status === 'loading' ? <p className="state" role="status">Loading club…</p> : (
            <div className="state state-empty">
              <h1>Club not found</h1>
              <p role="alert">{error}</p>
              <Link className="btn btn-quiet" to="/clubs">Browse clubs</Link>
            </div>
          )}
        </main>
      </div>
    );
  }

  const officer = club.MyRole === 'officer';
  const officers = club.Members.filter((m) => m.Role === 'officer');
  const members = club.Members.filter((m) => m.Role !== 'officer');

  return (
    <div className="app">
      <TopBar />
      <main className="page club" style={themeStyle(club.Theme)}>
        <p className="visually-hidden" role="status" aria-live="polite">{notice}</p>
        {notice && <p className="flash" aria-hidden="true">{notice}</p>}

        <header className="club-hero">
          <ClubBadge club={club} size="lg" />
          <div className="club-hero-text">
            <h1 className="page-title">{club.Name}</h1>
            <p className="club-row-meta">{club.Category}, {club.Members.length} {club.Members.length === 1 ? 'member' : 'members'}</p>
          </div>
          <div className="club-hero-actions">
            {officer && <Link className="btn btn-theme" to={`/events/new?club=${club._id}`}>New event</Link>}
            {officer && <Link className="btn btn-quiet" to={`/clubs/${club._id}/edit`}>Edit club</Link>}
            {!club.MyRole && (
              <button type="button" className="btn btn-theme" disabled={busy} onClick={() => act(() => api.joinClub(club._id, user.id), `You joined ${club.Name}.`)}>
                Join club
              </button>
            )}
            {club.MyRole && (
              <button type="button" className="btn btn-quiet" disabled={busy} onClick={() => act(() => api.leaveClub(club._id, user.id), `You left ${club.Name}.`)}>
                Leave club
              </button>
            )}
          </div>
        </header>
        <FormMessage error={actionError} />

        {club.Description && <p className="club-description">{club.Description}</p>}

        <div className="club-layout">
          <section aria-labelledby="club-events">
            <h2 id="club-events" className="section-title">Upcoming events</h2>
            {club.Events.length === 0
              ? <p className="muted">{officer ? 'Nothing scheduled. Post the club’s next event so members can RSVP.' : 'Nothing scheduled yet.'}</p>
              : <EventGrid events={club.Events} />}
          </section>

          <aside className="panel" aria-labelledby="club-members">
            <h2 id="club-members" className="panel-title">Members</h2>
            <MemberGroup title="Officers" people={officers} officer={officer} self={user.id}
              onRole={(m) => act(() => api.setRole(club._id, user.id, m.UserId, 'member'), `${m.Name} is now a member.`)} busy={busy} />
            <MemberGroup title="Members" people={members} officer={officer} self={user.id}
              onRole={(m) => act(() => api.setRole(club._id, user.id, m.UserId, 'officer'), `${m.Name} is now an officer.`)} busy={busy} />
          </aside>
        </div>
      </main>
    </div>
  );
}

function MemberGroup({ title, people, officer, self, onRole, busy }) {
  if (people.length === 0) return null;
  const promote = title === 'Members';
  return (
    <div className="guest-group">
      <h3>{title}</h3>
      <ul>
        {people.map((p) => (
          <li key={p.UserId}>
            <span className="avatar" aria-hidden="true">{(p.Name || '?')[0]}</span>
            <span className="member-name">{p.Name}{p.UserId === self && <span className="muted"> (you)</span>}</span>
            {officer && p.UserId !== self && (
              <button type="button" className="link-button member-action" disabled={busy} onClick={() => onRole(p)}>
                {promote ? 'Make officer' : 'Remove officer'}<span className="visually-hidden"> for {p.Name}</span>
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
