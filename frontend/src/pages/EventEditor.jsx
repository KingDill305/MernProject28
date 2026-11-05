import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import TopBar from '../components/TopBar.jsx';
import Poster from '../components/Poster.jsx';
import Field, { FormMessage } from '../components/Field.jsx';
import { ThemePicker, EmojiPicker } from '../components/Pickers.jsx';
import { EMOJIS } from '../themes.js';
import { toDateInput, toTimeInput, fromInputs } from '../dates.js';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';

const BLANK = { ClubId: '', Title: '', Emoji: '🎉', Theme: 'confetti', Date: '', StartTime: '18:00', EndTime: '', Location: '', Description: '' };

// /events/new (optionally ?club=<id>) and /e/:code/edit. Only club officers get here.
export default function EventEditor() {
  const { code } = useParams();
  const [params] = useSearchParams();
  const editing = Boolean(code);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(BLANK);
  const [clubs, setClubs] = useState([]); // clubs this user can post for
  const [clubName, setClubName] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editing) {
      api.getEvent(code, user.id).then((ev) => {
        if (!ev.CanEdit) return navigate(`/e/${code}`, { replace: true });
        setClubName(ev.ClubName);
        setForm({
          ClubId: ev.ClubId, Title: ev.Title, Emoji: ev.Emoji || '🎉', Theme: ev.Theme || 'confetti',
          Date: toDateInput(ev.Start), StartTime: toTimeInput(ev.Start), EndTime: ev.End ? toTimeInput(ev.End) : '',
          Location: ev.Location || '', Description: ev.Description || '',
        });
        setLoading(false);
      }).catch((err) => { setError(err.message); setLoading(false); });
    } else {
      api.listClubs(user.id, { mine: 'officer' }).then((cs) => {
        setClubs(cs);
        const pick = cs.find((c) => c._id === params.get('club')) || cs[0];
        if (pick) setForm((f) => ({ ...f, ClubId: pick._id, Theme: pick.Theme || f.Theme }));
        setLoading(false);
      }).catch((err) => { setError(err.message); setLoading(false); });
    }
  }, [code, editing, user.id, navigate, params]);

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const start = fromInputs(form.Date, form.StartTime);
  let end = form.EndTime ? fromInputs(form.Date, form.EndTime) : null;
  if (start && end && end <= start) end = new Date(end.getTime() + 24 * 60 * 60 * 1000); // ends after midnight

  async function submit(e) {
    e.preventDefault();
    if (!form.ClubId) return setError('Choose which club is hosting.');
    if (!form.Title.trim()) return setError('Give your event a name.');
    if (!start) return setError('Pick a date and start time.');
    if (!editing && start < new Date()) return setError('Pick a start time in the future.');
    setError('');
    setBusy(true);
    const fields = {
      ClubId: form.ClubId, Title: form.Title.trim(), Emoji: form.Emoji, Theme: form.Theme,
      Start: start.toISOString(), End: end ? end.toISOString() : null,
      Location: form.Location.trim(), Description: form.Description.trim(),
    };
    try {
      const ev = editing ? await api.updateEvent(code, user.id, fields) : await api.createEvent(user.id, fields);
      navigate(`/e/${ev.Code || code}`, { state: { flash: editing ? 'Changes saved.' : 'Event posted. Share the link so people can RSVP.' } });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  async function cancelEvent() {
    if (!window.confirm('Cancel this event? Guests will see it as cancelled.')) return;
    setBusy(true);
    try {
      await api.cancelEvent(code, user.id);
      navigate(`/e/${code}`, { state: { flash: 'Event cancelled.' } });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const hostName = editing ? clubName : clubs.find((c) => c._id === form.ClubId)?.Name;

  if (!loading && !editing && clubs.length === 0) {
    return (
      <div className="app">
        <TopBar />
        <main className="page">
          <div className="state state-empty">
            <h1>Events are posted by clubs</h1>
            <p>You need to be an officer of a club to post an event. Start a club, or ask an officer of yours to make you one.</p>
            <Link className="btn btn-primary" to="/clubs/new">Start a club</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <TopBar />
      <main className="page editor">
        <div className="editor-preview">
          <Poster event={{ ...form, Start: start, End: end }}>
            {hostName && <p className="poster-host">Hosted by {hostName}</p>}
          </Poster>
        </div>

        <form className="form editor-form" onSubmit={submit} noValidate>
          <h1 className="page-title">{editing ? 'Edit event' : 'New event'}</h1>
          {loading ? <p role="status">Loading…</p> : (
            <>
              {editing ? (
                <p className="muted">Hosted by <strong>{clubName}</strong></p>
              ) : (
                <Field label="Hosting club" as="select" name="ClubId" value={form.ClubId} onChange={update}>
                  {clubs.map((c) => <option key={c._id} value={c._id}>{c.Name}</option>)}
                </Field>
              )}
              <Field label="Event name" name="Title" value={form.Title} onChange={update} autoComplete="off" placeholder="General body meeting" />
              <EmojiPicker options={EMOJIS} value={form.Emoji} onChange={update} />
              <ThemePicker value={form.Theme} onChange={update} />
              <div className="field-row field-row-3">
                <Field label="Date" name="Date" type="date" value={form.Date} onChange={update} />
                <Field label="Starts" name="StartTime" type="time" value={form.StartTime} onChange={update} />
                <Field label="Ends (optional)" name="EndTime" type="time" value={form.EndTime} onChange={update} />
              </div>
              <Field label="Location" name="Location" value={form.Location} onChange={update} autoComplete="off" placeholder="Building and room" />
              <Field label="Details" as="textarea" name="Description" rows={5} value={form.Description} onChange={update}
                placeholder="What to expect, what to bring, food…" />

              <FormMessage error={error} />
              <div className="form-actions">
                <button className="btn btn-primary" disabled={busy}>
                  {busy ? 'Saving…' : editing ? 'Save changes' : 'Post event'}
                </button>
                <Link className="btn btn-quiet" to={editing ? `/e/${code}` : '/events'}>Cancel</Link>
                {editing && (
                  <button type="button" className="btn btn-danger push-right" disabled={busy} onClick={cancelEvent}>
                    Cancel event
                  </button>
                )}
              </div>
            </>
          )}
        </form>
      </main>
    </div>
  );
}
