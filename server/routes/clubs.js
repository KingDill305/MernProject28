const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

const memberSchema = new mongoose.Schema(
  {
    UserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    Role: { type: String, enum: ['officer', 'member'], default: 'member' },
    JoinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const clubSchema = new mongoose.Schema(
  {
    Name: { type: String, required: true, trim: true },
    Description: { type: String, default: '' },
    Category: { type: String, default: '' },
    Emoji: { type: String, default: '' },
    Theme: { type: String, default: '' },
    CreatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    Members: { type: [memberSchema], default: [] },
  },
  { timestamps: true, collection: 'clubs' }
);

const Club = mongoose.models.Club || mongoose.model('Club', clubSchema);

const wrap = (fn) => (req, res) =>
  fn(req, res).catch((err) => {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  });

const sameId = (a, b) => String(a) === String(b);
const findMember = (club, uid) => club.Members.find((m) => sameId(m.UserId, uid));
const isOfficer = (club, uid) => {
  const m = findMember(club, uid);
  return !!m && m.Role === 'officer';
};
const officerCount = (club) => club.Members.filter((m) => m.Role === 'officer').length;
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function loadClub(id, res) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(404).json({ error: 'Club not found' });
    return null;
  }
  const club = await Club.findById(id);
  if (!club) {
    res.status(404).json({ error: 'Club not found' });
    return null;
  }
  return club;
}

// GET /api/clubs?userId&search&category&mine=member|officer
router.get(
  '/clubs',
  wrap(async (req, res) => {
    const { userId, search, category, mine } = req.query;
    const filter = {};
    if (search) filter.Name = { $regex: escapeRegex(search), $options: 'i' };
    if (category) filter.Category = category;
    if (userId && mine === 'member') filter['Members.UserId'] = userId;
    if (userId && mine === 'officer')
      filter.Members = { $elemMatch: { UserId: userId, Role: 'officer' } };

    const clubs = await Club.find(filter).lean();
    res.json(
      clubs.map((c) => {
        const me = c.Members.find((m) => sameId(m.UserId, userId));
        return {
          _id: c._id,
          Name: c.Name,
          Description: c.Description,
          Category: c.Category,
          Emoji: c.Emoji,
          Theme: c.Theme,
          MemberCount: c.Members.length,
          MyRole: me ? me.Role : null,
        };
      })
    );
  })
);

// GET /api/clubs/:id?userId
router.get(
  '/clubs/:id',
  wrap(async (req, res) => {
    const club = await loadClub(req.params.id, res);
    if (!club) return;

    const users = await mongoose.models.User.find(
      { _id: { $in: club.Members.map((m) => m.UserId) } },
      'FirstName LastName'
    ).lean();
    const names = new Map(users.map((u) => [String(u._id), `${u.FirstName} ${u.LastName}`]));

    const Event = mongoose.models.Event;
    const events = Event
      ? await Event.find({ ClubId: club._id, Cancelled: { $ne: true }, Start: { $gte: new Date() } })
          .sort({ Start: 1 })
          .lean()
      : [];

    const me = findMember(club, req.query.userId);
    res.json({
      _id: club._id,
      Name: club.Name,
      Description: club.Description,
      Category: club.Category,
      Emoji: club.Emoji,
      Theme: club.Theme,
      MyRole: me ? me.Role : null,
      Members: club.Members.map((m) => ({
        UserId: m.UserId,
        Name: names.get(String(m.UserId)) || 'Unknown',
        Role: m.Role,
      })),
      Events: events,
    });
  })
);

// POST /api/clubs  (creator becomes officer)
router.post(
  '/clubs',
  wrap(async (req, res) => {
    const { UserId, Name, Description, Category, Emoji, Theme } = req.body || {};
    if (!UserId || !Name) return res.status(400).json({ error: 'UserId and Name are required' });

    const club = await Club.create({
      Name,
      Description,
      Category,
      Emoji,
      Theme,
      CreatedBy: UserId,
      Members: [{ UserId, Role: 'officer' }],
    });
    res.status(201).json({ message: 'Club created', id: club._id });
  })
);

// PUT /api/clubs/:id  (officers only)
router.put(
  '/clubs/:id',
  wrap(async (req, res) => {
    const { UserId, ...fields } = req.body || {};
    if (!UserId) return res.status(400).json({ error: 'UserId is required' });

    const club = await loadClub(req.params.id, res);
    if (!club) return;
    if (!isOfficer(club, UserId)) return res.status(403).json({ error: 'Officers only' });

    for (const k of ['Name', 'Description', 'Category', 'Emoji', 'Theme']) {
      if (fields[k] !== undefined) club[k] = fields[k];
    }
    await club.save();
    res.json({ message: 'Club updated' });
  })
);

// DELETE /api/clubs/:id  (officers only; removes its events, RSVPs, comments)
router.delete(
  '/clubs/:id',
  wrap(async (req, res) => {
    const { UserId } = req.body || {};
    if (!UserId) return res.status(400).json({ error: 'UserId is required' });

    const club = await loadClub(req.params.id, res);
    if (!club) return;
    if (!isOfficer(club, UserId)) return res.status(403).json({ error: 'Officers only' });

    const { Event, RSVP, Comment } = mongoose.models;
    if (Event) {
      const ids = (await Event.find({ ClubId: club._id }, '_id').lean()).map((e) => e._id);
      if (RSVP) await RSVP.deleteMany({ EventId: { $in: ids } });
      if (Comment) await Comment.deleteMany({ EventId: { $in: ids } });
      await Event.deleteMany({ ClubId: club._id });
    }
    await club.deleteOne();
    res.json({ message: 'Club deleted' });
  })
);

// POST /api/clubs/:id/join
router.post(
  '/clubs/:id/join',
  wrap(async (req, res) => {
    const { UserId } = req.body || {};
    if (!UserId) return res.status(400).json({ error: 'UserId is required' });

    const club = await loadClub(req.params.id, res);
    if (!club) return;
    if (findMember(club, UserId)) return res.status(409).json({ error: 'Already a member' });

    club.Members.push({ UserId, Role: 'member' });
    await club.save();
    res.json({ message: 'Joined club' });
  })
);

// POST /api/clubs/:id/leave  (last officer can't leave)
router.post(
  '/clubs/:id/leave',
  wrap(async (req, res) => {
    const { UserId } = req.body || {};
    if (!UserId) return res.status(400).json({ error: 'UserId is required' });

    const club = await loadClub(req.params.id, res);
    if (!club) return;
    const me = findMember(club, UserId);
    if (!me) return res.status(400).json({ error: 'Not a member' });
    if (me.Role === 'officer' && officerCount(club) === 1)
      return res.status(400).json({ error: "Last officer can't leave" });

    club.Members = club.Members.filter((m) => !sameId(m.UserId, UserId));
    await club.save();
    res.json({ message: 'Left club' });
  })
);

// POST /api/clubs/:id/role  (officers only; club keeps at least one officer)
router.post(
  '/clubs/:id/role',
  wrap(async (req, res) => {
    const { UserId, MemberId, Role } = req.body || {};
    if (!UserId || !MemberId || !['officer', 'member'].includes(Role))
      return res.status(400).json({ error: 'UserId, MemberId, and Role (officer|member) are required' });

    const club = await loadClub(req.params.id, res);
    if (!club) return;
    if (!isOfficer(club, UserId)) return res.status(403).json({ error: 'Officers only' });

    const target = findMember(club, MemberId);
    if (!target) return res.status(404).json({ error: 'Member not found' });
    if (target.Role === 'officer' && Role === 'member' && officerCount(club) === 1)
      return res.status(400).json({ error: 'A club must keep at least one officer' });

    target.Role = Role;
    await club.save();
    res.json({ message: 'Role updated' });
  })
);

module.exports = router;
