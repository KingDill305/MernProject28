require('dns').setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', require('./routes/clubs'));
app.use('/api', require('./routes/events'));

const APP_URL = process.env.APP_URL || 'https://kp-mern-api.duckdns.org';
const HOUR = 60 * 60 * 1000;

async function sendMail(to, subject, html) {
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Club Tracker <onboarding@resend.dev>',
        to: [to],
        subject,
        html,
      }),
    });
    if (!r.ok) console.error('Email failed:', r.status, await r.text());
  } catch (err) {
    console.error('Email failed:', err.message);
  }
}

const User = mongoose.model('User', new mongoose.Schema({
  FirstName: String,
  LastName: String,
  Login: { type: String, unique: true },
  Password: String,
  Email: String,
  Verified: Boolean,
  VerifyToken: String,
  VerifyExpires: Date,
  ResetToken: String,
  ResetExpires: Date,
}), 'users');

const Card = mongoose.model('Card', new mongoose.Schema({
  PlayerName: String,
  TeamName: String,
  CardValue: Number,
  Publisher: String,
  UserId: String   // references users._id
}), 'cards');

const newToken = () => crypto.randomBytes(32).toString('hex');

app.post('/api/register', async (req, res) => {
  try {
    const { FirstName, LastName, Login, Password, Email } = req.body || {};
    if (!FirstName || !LastName || !Login || !Password)
      return res.status(400).json({ error: 'FirstName, LastName, Login, and Password are required' });

    if (await User.findOne({ Login }))
      return res.status(409).json({ error: 'Login already exists' });

    const cleanEmail = Email ? String(Email).trim().toLowerCase() : null;
    if (cleanEmail && await User.findOne({ Email: cleanEmail }))
      return res.status(409).json({ error: 'Email already in use' });

    const doc = { FirstName, LastName, Login, Password: await bcrypt.hash(Password, 10) };
    let token = null;
    if (cleanEmail) {
      token = newToken();
      Object.assign(doc, {
        Email: cleanEmail,
        Verified: false,
        VerifyToken: token,
        VerifyExpires: new Date(Date.now() + 24 * HOUR),
      });
    } else {
      doc.Verified = true; // no email given, so nothing to verify
    }

    const user = await User.create(doc);
    if (token) {
      await sendMail(
        cleanEmail,
        'Verify your account',
        `<p>Hi ${FirstName}, confirm your email:</p>
         <p><a href="${APP_URL}/api/verify-email?token=${token}">Verify email</a></p>
         <p>This link expires in 24 hours.</p>`
      );
    }
    res.status(201).json({ message: 'User registered successfully', id: user._id });
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ error: 'Login already exists' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/verify-email', async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) return res.status(400).send('Missing token.');
    const user = await User.findOne({ VerifyToken: token, VerifyExpires: { $gt: new Date() } });
    if (!user) return res.status(400).send('This verification link is invalid or has expired.');
    user.Verified = true;
    user.VerifyToken = undefined;
    user.VerifyExpires = undefined;
    await user.save();
    res.send('Your email is verified. You can log in now.');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error.');
  }
});

app.post('/api/resend-verification', async (req, res) => {
  try {
    const email = String(req.body?.Email || '').trim().toLowerCase();
    const user = email ? await User.findOne({ Email: email, Verified: false }) : null;
    if (user) {
      const token = newToken();
      user.VerifyToken = token;
      user.VerifyExpires = new Date(Date.now() + 24 * HOUR);
      await user.save();
      await sendMail(
        user.Email,
        'Verify your account',
        `<p><a href="${APP_URL}/api/verify-email?token=${token}">Verify email</a></p>`
      );
    }
    // Same reply either way so people can't check which emails have accounts
    res.json({ message: 'If that account exists and is unverified, a new link was sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/forgot-password', async (req, res) => {
  try {
    const email = String(req.body?.Email || '').trim().toLowerCase();
    const user = email ? await User.findOne({ Email: email }) : null;
    if (user) {
      const token = newToken();
      user.ResetToken = token;
      user.ResetExpires = new Date(Date.now() + HOUR);
      await user.save();
      await sendMail(
        user.Email,
        'Reset your password',
        `<p>Click to choose a new password (expires in 1 hour):</p>
         <p><a href="${APP_URL}/reset-password?token=${token}">Reset password</a></p>`
      );
    }
    res.json({ message: 'If that email has an account, a reset link was sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/reset-password', async (req, res) => {
  try {
    const { token, Password } = req.body || {};
    if (!token || !Password)
      return res.status(400).json({ error: 'token and Password are required' });
    const user = await User.findOne({ ResetToken: token, ResetExpires: { $gt: new Date() } });
    if (!user)
      return res.status(400).json({ error: 'Reset link is invalid or has expired' });
    user.Password = await bcrypt.hash(Password, 10);
    user.ResetToken = undefined;
    user.ResetExpires = undefined;
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { Login, Password } = req.body || {};
    if (!Login || !Password)
      return res.status(401).json({ error: 'Invalid login' });

    const user = await User.findOne({ Login });
    if (!user || !(await bcrypt.compare(Password, user.Password)))
      return res.status(401).json({ error: 'Invalid login' });
    if (user.Verified === false)
      return res.status(403).json({ error: 'Please verify your email before logging in' });

    res.status(200).json({ id: user._id, FirstName: user.FirstName, LastName: user.LastName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/cards', async (req, res) => {
  const card = await Card.create(req.body);   // body must include UserId
  res.json(card);
});

app.get('/api/cards/:userId', async (req, res) => {
  res.json(await Card.find({ UserId: req.params.userId }));
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Mongo connected');
    app.listen(PORT, () => console.log('API on ' + PORT));
  })
  .catch(err => console.error(err));
