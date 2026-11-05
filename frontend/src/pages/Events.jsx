import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TopBar from '../components/TopBar.jsx';
import { EventGrid } from '../components/EventTile.jsx';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';

const VIEWS = [
  { id: 'all', label: 'All campus' },
  { id: 'clubs', label: 'My clubs' },
  { id: 'going', label: 'Going' },
  { id: 'past', label: 'Past' },
];

const EMPTY = {
  all: ['No upcoming events yet', 'When clubs post events they show up here.', { to: '/clubs', label: 'Browse clubs' }],
  clubs: ['Nothing from your clubs yet', 'Join a few clubs to see their events here.', { to: '/clubs', label: 'Browse clubs' }],
  going: ['You haven’t RSVP’d to anything', 'Open an event and tap Going or Maybe to save it here.', { to: '/events', label: 'See all campus events', view: 'all' }],
  past: ['No past events', 'Events you went to or your clubs hosted show up here afterward.', null],
};

export default function Events() {
  const { user } = useAuth();
  const [view, setView] = useState('all');
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [isOfficer, setIsOfficer] = useState(false);

  useEffect(() => {
    api.listClubs(user.id, { mine: 'officer' }).then((cs) => setIsOfficer(cs.length > 0)).catch(() => {});
  }, [user.id]);

  useEffect(() => {
    let live = true;
    setStatus('loading');
    api.listEvents(user.id, view)
      .then((data) => { if (live) { setEvents(Array.isArray(data) ? data : []); setStatus('ready'); } })
      .catch((err) => { if (live) { setError(err.message); setStatus('error'); } });
    return () => { live = false; };
  }, [user.id, view, reload]);

  const [title, body, cta] = EMPTY[view];

  return (
    <div className="app">
      <TopBar />
      <main className="page">
        <div className="page-head">
          <h1 className="page-title">Events</h1>
          {isOfficer && <Link to="/events/new" className="btn btn-primary">New event</Link>}
        </div>
        <div className="tabs" role="group" aria-label="Show events">
          {VIEWS.map((v) => (
            <button key={v.id} type="button" className="tab" aria-pressed={view === v.id} onClick={() => setView(v.id)}>
              {v.label}
            </button>
          ))}
        </div>

        {status === 'loading' && <p className="state" role="status">Loading events…</p>}

        {status === 'error' && (
          <div className="state">
            <p role="alert">Couldn’t load events. {error}</p>
            <button type="button" className="btn btn-quiet" onClick={() => setReload((n) => n + 1)}>Try again</button>
          </div>
        )}

        {status === 'ready' && events.length === 0 && (
          <div className="state state-empty">
            <h2>{title}</h2>
            <p>{body}</p>
            {cta && (cta.view
              ? <button type="button" className="btn btn-primary" onClick={() => setView(cta.view)}>{cta.label}</button>
              : <Link to={cta.to} className="btn btn-primary">{cta.label}</Link>)}
          </div>
        )}

        {status === 'ready' && events.length > 0 && <EventGrid events={events} level={2} />}
      </main>
    </div>
  );
}
