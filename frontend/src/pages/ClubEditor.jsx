import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import TopBar from '../components/TopBar.jsx';
import ClubBadge from '../components/ClubBadge.jsx';
import Field, { FormMessage } from '../components/Field.jsx';
import { ThemePicker, EmojiPicker } from '../components/Pickers.jsx';
import { CATEGORIES, CLUB_EMOJIS } from '../catalog.js';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';

const BLANK = { Name: '', Category: 'Academic', Emoji: '⭐', Theme: 'confetti', Description: '' };

// /clubs/new and /clubs/:id/edit
export default function ClubEditor() {
  const { id } = useParams();
  const editing = Boolean(id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(BLANK);
  const [loading, setLoading] = useState(editing);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!editing) return;
    api.getClub(id, user.id).then((c) => {
      if (c.MyRole !== 'officer') return navigate(`/clubs/${id}`, { replace: true });
      setForm({ Name: c.Name, Category: c.Category, Emoji: c.Emoji, Theme: c.Theme, Description: c.Description || '' });
      setLoading(false);
    }).catch((err) => { setError(err.message); setLoading(false); });
  }, [id, editing, user.id, navigate]);

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (!form.Name.trim()) return setError('Give the club a name.');
    setError('');
    setBusy(true);
    try {
      const fields = { ...form, Name: form.Name.trim(), Description: form.Description.trim() };
      const club = editing ? await api.updateClub(id, user.id, fields) : await api.createClub(user.id, fields);
      navigate(`/clubs/${club._id || club.id || id}`, { state: { flash: editing ? 'Club updated.' : 'Club created. You’re its first officer.' } });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm('Delete this club and all of its events? This can’t be undone.')) return;
    setBusy(true);
    try { await api.deleteClub(id, user.id); navigate('/clubs'); }
    catch (err) { setError(err.message); setBusy(false); }
  }

  return (
    <div className="app">
      <TopBar />
      <main className="page narrow">
        <form className="form" onSubmit={submit} noValidate>
          <div className="editor-head">
            <ClubBadge club={form} size="lg" />
            <h1 className="page-title">{editing ? 'Edit club' : 'Start a club'}</h1>
          </div>
          {loading ? <p role="status">Loading…</p> : (
            <>
              <Field label="Club name" name="Name" value={form.Name} onChange={update} autoComplete="off" placeholder="Robotics Club" />
              <Field label="Category" as="select" name="Category" value={form.Category} onChange={update}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </Field>
              <EmojiPicker options={CLUB_EMOJIS} value={form.Emoji} onChange={update} />
              <ThemePicker value={form.Theme} onChange={update} />
              <Field label="About the club" as="textarea" name="Description" rows={5} value={form.Description} onChange={update}
                placeholder="What you do, when you meet, who can join" />
              <FormMessage error={error} />
              <div className="form-actions">
                <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Create club'}</button>
                <Link className="btn btn-quiet" to={editing ? `/clubs/${id}` : '/clubs'}>Cancel</Link>
                {editing && <button type="button" className="btn btn-danger push-right" disabled={busy} onClick={remove}>Delete club</button>}
              </div>
            </>
          )}
        </form>
      </main>
    </div>
  );
}
