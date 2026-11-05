const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');

const router = express.Router();

const eventSchema = new mongoose.Schema(
  {
    Code: { type: String, required: true, unique: true },
    ClubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
    CreatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    Title: { type: String, required: true, trim: true },
    Emoji: { type: String, default: '' },
    Theme: { type: String, default: '' },
    Start: { type: Date, required: true },
    End: { type: Date },
    Location: { type: String, default: '' },
    Description: { type: String, default: '' },
    Cancelled: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'events' }
);

const rsvpSchema = new mongoose.Schema(
  {
    EventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    UserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    Status: { type: String, enum: ['going', 'maybe', 'no'], required: true },
    PlusOnes: { type: Number, min: 0, max: 5, default: 0 },
  },
  { timestamps: true, collection: 'rsvps' }
);
rsvpSchema.index({ EventId: 1, UserId: 1 }, { unique: true });

const commentSchema = new mongoose.Schema(
  {
    EventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    UserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    Text: { type: String, required: true, trim: true },
  },
  { timestamps: true, collection: 'comments' }
);

const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);
const RSVP = mongoose.models.RSVP || mongoose.model('RSVP', rsvpSchema);
const Comment = mongoose.models.Comment || mongoose.model('Comment', commentSchema);

const wrap = (fn) => (req, res) =>
  fn(req, res).catch((err) => {
    console.error(err);
    if (err.name === 'ValidationError' || err.name === 'CastError')
      return res.status(400).json({ error: err.message });
    res.status(500).json({ error: 'Server error' });
  });

const validId = (id) => mongoose.Types.ObjectId.isValid(id);
const sameId = (a, b) => String(a) === String(b);
const isOfficer = (club, uid) =>
  club.Members.some((m) => sameId(m.UserId, uid) && m.Role === 'officer');
const getClub = (id) => mongoose.models.Club.findById(id);

async function newCode() {
  for (;;) {
    const code = crypto.randomBytes(4).toString('hex');
    if (!(await Event.exists({ Code: code }))) return code;
  }
}

async function loadEvent(code, res) {
  const ev = await Event.findOne({ Code: code });
  if (!ev) {
    res.status(404).json({ error: 'Event not found' });
    return null;
  }
  return ev;
}

// GET /api/events?userId&view=all|clubs|going|past
router.get(
  '/events',
  wrap(async (req, res) => {
    const { userId, view = 'all' } = req.query;
    if (!validId(userId)) return res.status(400).json({ error: 'userId is required' });

    const now = new Date();
    const myClubs = await mongoose.models.Club.find({ 'Members.UserId': userId }, '_id').lean();
    const myRsvps = await RSVP.find({ UserId: userId }).lean();

    const filter = {};
    if (view === 'clubs') filter.ClubId = { $in: myClubs.map((c) => c._id) };
    if (view === 'going')
      filter._id = { $in: myRsvps.filter((r) => r.Status === 'going').map((r) => r.EventId) };
    if (view === 'past') filter.Start = { $lt: now };
    else filter.Start = { $gte: now };

    const events = await Event.find(filter)
      .sort({ Start: view === 'past' ? -1 : 1 })
      .lean();

    const hostClubs = await mongoose.models.Club.find(
      { _id: { $in: events.map((e) => e.ClubId) } },
      'Name Members'
    ).lean();
    const hostMap = new Map(hostClubs.map((c) => [String(c._id), c]));
    const rsvps = await RSVP.find({ EventId: { $in: events.map((e) => e._id) } }).lean();

    res.json(
      events.map((e) => {
        const club = hostMap.get(String(e.ClubId));
        const mine = rsvps.find((r) => sameId(r.EventId, e._id) && sameId(r.UserId, userId));
        return {
          _id: e._id,
          Code: e.Code,
          Title: e.Title,
          Emoji: e.Emoji,
          Theme: e.Theme,
          Start: e.Start,
          End: e.End,
          Location: e.Location,
          Cancelled: e.Cancelled,
          ClubId: e.ClubId,
          ClubName: club ? club.Name : '',
          MyStatus: mine ? mine.Status : null,
          GoingCount: rsvps.filter((r) => sameId(r.EventId, e._id) && r.Status === 'going').length,
          CanEdit: club ? isOfficer(club, userId) : false,
        };
      })
    );
  })
);

// GET /api/events/:code?userId
router.get(
  '/events/:code',
  wrap(async (req, res) => {
    const ev = await loadEvent(req.params.code, res);
    if (!ev) return;
    const club = await getClub(ev.ClubId);
    const rsvps = await RSVP.find({ EventId: ev._id }).lean();
    const users = await mongoose.models.User.find(
      { _id: { $in: rsvps.map((r) => r.UserId) } },
      'FirstName LastName'
    ).lean();
    const names = new Map(users.map((u) => [String(u._id), `${u.FirstName} ${u.LastName}`]));

    const counts = { going: 0, maybe: 0, no: 0 };
    rsvps.forEach((r) => counts[r.Status]++);
    const mine = rsvps.find((r) => sameId(r.UserId, req.query.userId));

    res.json({
      _id: ev._id,
      Code: ev.Code,
      ClubId: ev.ClubId,
      ClubName: club ? club.Name : '',
      Title: ev.Title,
      Emoji: ev.Emoji,
      Theme: ev.Theme,
      Start: ev.Start,
      End: ev.End,
      Location: ev.Location,
      Description: ev.Description,
      Cancelled: ev.Cancelled,
      MyRsvp: mine ? { Status: mine.Status, PlusOnes: mine.PlusOnes } : null,
      Counts: counts,
      Guests: rsvps
        .filter((r) => r.Status === 'going')
        .map((r) => ({ UserId: r.UserId, Name: names.get(String(r.UserId)) || 'Unknown', PlusOnes: r.PlusOnes })),
      CanEdit: club ? isOfficer(club, req.query.userId) : false,
    });
  })
);

// POST /api/events  (officers of the hosting club only)
router.post(
  '/events',
  wrap(async (req, res) => {
    const { UserId, ClubId, Title, Start, End, Emoji, Theme, Location, Description } = req.body || {};
    if (!UserId || !ClubId || !Title || !Start)
      return res.status(400).json({ error: 'UserId, ClubId, Title, and Start are required' });
    if (!validId(ClubId)) return res.status(404).json({ error: 'Club not found' });

    const club = await getClub(ClubId);
    if (!club) return res.status(404).json({ error: 'Club not found' });
    if (!isOfficer(club, UserId))
      return res.status(403).json({ error: 'Only officers of this club can create events' });

    const ev = await Event.create({
      Code: await newCode(),
      ClubId,
      CreatedBy: UserId,
      Title,
      Start,
      End,
      Emoji,
      Theme,
      Location,
      Description,
    });
    res.status(201).json({ message: 'Event created', id: ev._id, Code: ev.Code });
  })
);

// PUT /api/events/:code  (officers of hosting club)
router.put(
  '/events/:code',
  wrap(async (req, res) => {
    const { UserId, ...fields } = req.body || {};
    if (!UserId) return res.status(400).json({ error: 'UserId is required' });

    const ev = await loadEvent(req.params.code, res);
    if (!ev) return;
    const club = await getClub(ev.ClubId);
    if (!club || !isOfficer(club, UserId))
      return res.status(403).json({ error: 'Only officers of the hosting club can edit' });

    for (const k of ['Title', 'Emoji', 'Theme', 'Start', 'End', 'Location', 'Description']) {
      if (fields[k] !== undefined) ev[k] = fields[k];
    }
    await ev.save();
    res.json({ message: 'Event updated' });
  })
);

// DELETE /api/events/:code  (cancels; page stays and shows Cancelled)
router.delete(
  '/events/:code',
  wrap(async (req, res) => {
    const { UserId } = req.body || {};
    if (!UserId) return res.status(400).json({ error: 'UserId is required' });

    const ev = await loadEvent(req.params.code, res);
    if (!ev) return;
    const club = await getClub(ev.ClubId);
    if (!club || !isOfficer(club, UserId))
      return res.status(403).json({ error: 'Only officers of the hosting club can cancel' });

    ev.Cancelled = true;
    await ev.save();
    res.json({ message: 'Event cancelled' });
  })
);

// POST /api/events/:code/rsvp
router.post(
  '/events/:code/rsvp',
  wrap(async (req, res) => {
    const { UserId, Status, PlusOnes = 0 } = req.body || {};
    if (!UserId || !['going', 'maybe', 'no'].includes(Status))
      return res.status(400).json({ error: 'UserId and Status (going|maybe|no) are required' });

    const ev = await loadEvent(req.params.code, res);
    if (!ev) return;
    if (ev.Cancelled) return res.status(400).json({ error: 'Event is cancelled' });

    const plus = Status === 'going' ? Math.min(5, Math.max(0, parseInt(PlusOnes, 10) || 0)) : 0;
    await RSVP.findOneAndUpdate(
      { EventId: ev._id, UserId },
      { Status, PlusOnes: plus },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ message: 'RSVP saved', Status, PlusOnes: plus });
  })
);

// GET /api/events/:code/comments
router.get(
  '/events/:code/comments',
  wrap(async (req, res) => {
    const ev = await loadEvent(req.params.code, res);
    if (!ev) return;
    const list = await Comment.find({ EventId: ev._id }).sort({ createdAt: 1 }).lean();
    const users = await mongoose.models.User.find(
      { _id: { $in: list.map((c) => c.UserId) } },
      'FirstName LastName'
    ).lean();
    const names = new Map(users.map((u) => [String(u._id), `${u.FirstName} ${u.LastName}`]));
    res.json(
      list.map((c) => ({
        _id: c._id,
        UserId: c.UserId,
        Name: names.get(String(c.UserId)) || 'Unknown',
        Text: c.Text,
        CreatedAt: c.createdAt,
      }))
    );
  })
);

// POST /api/events/:code/comments
router.post(
  '/events/:code/comments',
  wrap(async (req, res) => {
    const { UserId, Text } = req.body || {};
    if (!UserId || !Text || !Text.trim())
      return res.status(400).json({ error: 'UserId and Text are required' });

    const ev = await loadEvent(req.params.code, res);
    if (!ev) return;
    const c = await Comment.create({ EventId: ev._id, UserId, Text: Text.trim() });
    res.status(201).json({ message: 'Comment added', id: c._id });
  })
);

module.exports = router;
