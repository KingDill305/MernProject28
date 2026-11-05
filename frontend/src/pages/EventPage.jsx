import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import TopBar from '../components/TopBar.jsx';
import Poster from '../components/Poster.jsx';
import { FormMessage } from '../components/Field.jsx';
import { formatWhen, googleCalendarUrl, downloadIcs } from '../dates.js';
import { themeStyle } from '../themes.js';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';

const CHOICES = [
  { id: 'going', label: 'Going', emoji: '👍' },
  { id: 'maybe', label: 'Maybe', emoji: '🤔' },
  { id: 'no', label: 'Can’t go', emoji: '😢' },
];

const timeAgo = (d) => {
  const s = Math.round((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// The page people get when the host shares the link: /e/:code
export default function EventPage() {
  const { code } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  const [ev, setEv] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(location.state?.flash || '');

  const load = useCallback(async () => {
    try {
      setEv(await api.getEvent(code, user?.id));
      setStatus('ready');
    } catch (err) {
      setError(err.status === 404 ? 'This link doesn’t match an event. Check it with whoever sent it.' : err.message);
      setStatus('error');
    }
  }, [code, user?.id]);

  useEffect(() => { load(); }, [load]);

  if (status !== 'ready') {
    return (
      <div className="app">
        <TopBar />
        <main className="page">
          {status === 'loading' ? <p className="state" role="status">Loading event…</p> : (
            <div className="state state-empty">
              <h1>Event not found</h1>
              <p role="alert">{error}</p>
              <Link className="btn btn-quiet" to="/events">See campus events</Link>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <TopBar />
      <main className="page event" style={themeStyle(ev.Theme)}>
        <p className="visually-hidden" role="status" aria-live="polite">{notice}</p>
        {notice && <p className="flash" aria-hidden="true">{notice}</p>}

        <div className="event-layout">
          <div className="event-main">
            <Poster event={ev} />

            <dl className="event-facts">
              <div><dt>When</dt><dd>{formatWhen(ev.Start, ev.End, true)}</dd></div>
              <div><dt>Where</dt><dd>
                {ev.Location
                  ? <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.Location)}`} target="_blank" rel="noreferrer">{ev.Location}</a>
                  : 'To be announced'}
              </dd></div>
              <div><dt>Hosted by</dt><dd><Link to={`/clubs/${ev.ClubId}`}>{ev.ClubName}</Link></dd></div>
            </dl>

            {ev.Description && <p className="event-description">{ev.Description}</p>}

            <div className="event-tools">
              <ShareButton onCopied={() => setNotice('Link copied.')} />
              <a className="btn btn-quiet btn-sm" href={googleCalendarUrl(ev)} target="_blank" rel="noreferrer">Add to Google Calendar</a>
              <button type="button" className="btn btn-quiet btn-sm" onClick={() => downloadIcs(ev)}>Download .ics</button>
              {ev.CanEdit && <Link className="btn btn-quiet btn-sm" to={`/e/${code}/edit`}>Edit event</Link>}
            </div>

            <Comments code={code} cancelled={ev.Cancelled} />
          </div>

          <aside className="event-side">
            <RsvpBox ev={ev} onChange={async (msg) => { await load(); setNotice(msg); }} />
            <GuestList guests={ev.Guests} counts={ev.Counts} />
          </aside>
        </div>
      </main>
    </div>
  );
}

function ShareButton({ onCopied }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      onCopied();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link:', window.location.href);
    }
  }
  return <button type="button" className="btn btn-theme btn-sm" onClick={copy}>{copied ? 'Link copied' : 'Copy link'}</button>;
}

function RsvpBox({ ev, onChange }) {
  const { user } = useAuth();
  const [plusOnes, setPlusOnes] = useState(ev.MyRsvp?.PlusOnes || 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const current = ev.MyRsvp?.Status;

  if (ev.Cancelled) {
    return <section className="panel"><h2 className="panel-title">This event was cancelled</h2><p>The host called it off, so RSVPs are closed.</p></section>;
  }
  if (!user) {
    return (
      <section className="panel">
        <h2 className="panel-title">Are you going?</h2>
        <p>Log in to RSVP and join the conversation.</p>
        <Link className="btn btn-theme" to="/login" state={{ from: `/e/${ev.Code}` }}>Log in to RSVP</Link>
        <p className="panel-foot">New here? <Link to="/register" state={{ from: `/e/${ev.Code}` }}>Create an account</Link></p>
      </section>
    );
  }

  async function choose(status, extra = plusOnes) {
    setBusy(true);
    setError('');
    try {
      await api.rsvp(ev.Code, user.id, status, status === 'no' ? 0 : extra);
      const label = CHOICES.find((c) => c.id === status).label;
      await onChange(`RSVP saved: ${label}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel" aria-labelledby="rsvp-title">
      <h2 id="rsvp-title" className="panel-title">{current ? 'Your RSVP' : 'Are you going?'}</h2>
      <div className="rsvp-choices" role="group" aria-labelledby="rsvp-title">
        {CHOICES.map((c) => (
          <button key={c.id} type="button" className="rsvp-choice" aria-pressed={current === c.id} disabled={busy} onClick={() => choose(c.id)}>
            <span aria-hidden="true">{c.emoji}</span>{c.label}
          </button>
        ))}
      </div>
      {current && current !== 'no' && (
        <div className="plus-ones">
          <label htmlFor="plus-ones">Bringing guests</label>
          <div className="stepper">
            <button type="button" aria-label="One fewer guest" disabled={busy || plusOnes === 0}
              onClick={() => { const n = plusOnes - 1; setPlusOnes(n); choose(current, n); }}>−</button>
            <output id="plus-ones" aria-live="polite">+{plusOnes}</output>
            <button type="button" aria-label="One more guest" disabled={busy || plusOnes >= 5}
              onClick={() => { const n = plusOnes + 1; setPlusOnes(n); choose(current, n); }}>+</button>
          </div>
        </div>
      )}
      <FormMessage error={error} />
    </section>
  );
}

function GuestList({ guests = [], counts = {} }) {
  const groups = CHOICES.map((c) => ({ ...c, people: guests.filter((g) => g.Status === c.id) })).filter((g) => g.people.length);
  return (
    <section className="panel" aria-labelledby="guests-title">
      <h2 id="guests-title" className="panel-title">Guest list</h2>
      <p className="guest-counts">
        <strong>{counts.going || 0}</strong> going <strong>{counts.maybe || 0}</strong> maybe <strong>{counts.no || 0}</strong> can’t go
      </p>
      {groups.length === 0 ? <p className="muted">No replies yet.</p> : groups.map((g) => (
        <div key={g.id} className="guest-group">
          <h3>{g.label}</h3>
          <ul>
            {g.people.map((p) => (
              <li key={p.UserId}>
                <span className="avatar" aria-hidden="true">{(p.Name || '?')[0]}</span>
                {p.Name}{p.PlusOnes > 0 && <span className="muted"> +{p.PlusOnes}</span>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

function Comments({ code, cancelled }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listComments(code).then((c) => setComments(Array.isArray(c) ? c : [])).catch(() => {});
  }, [code]);

  async function post(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    setError('');
    try {
      await api.addComment(code, user.id, text.trim());
      const fresh = await api.listComments(code);
      setComments(Array.isArray(fresh) ? fresh : []);
      setText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="comments" aria-labelledby="comments-title">
      <h2 id="comments-title" className="section-title">Comments</h2>
      {comments.length === 0 && <p className="muted">No comments yet. Ask the club a question or say you’re coming.</p>}
      <ul className="comment-list">
        {comments.map((c) => (
          <li key={c._id} className="comment">
            <span className="avatar" aria-hidden="true">{(c.Name || '?')[0]}</span>
            <div>
              <p className="comment-head"><strong>{c.Name}</strong> <span className="muted">{timeAgo(c.CreatedAt)}</span></p>
              <p className="comment-text">{c.Text}</p>
            </div>
          </li>
        ))}
      </ul>
      {user && !cancelled && (
        <form className="comment-form" onSubmit={post}>
          <label htmlFor="comment" className="visually-hidden">Write a comment</label>
          <textarea id="comment" rows={2} maxLength={500} placeholder="Write a comment" value={text} onChange={(e) => setText(e.target.value)} />
          <button className="btn btn-theme btn-sm" disabled={busy || !text.trim()}>{busy ? 'Posting…' : 'Post comment'}</button>
        </form>
      )}
      <FormMessage error={error} />
    </section>
  );
}
