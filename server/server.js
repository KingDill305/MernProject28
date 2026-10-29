require('dns').setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());

// Third argument forces the collection names to match your Compass screenshot
const User = mongoose.model('User', new mongoose.Schema({
  FirstName: String,
  LastName: String,
  Login: { type: String, unique: true },
  Password: String
}), 'users');

const Card = mongoose.model('Card', new mongoose.Schema({
  PlayerName: String,
  TeamName: String,
  CardValue: Number,
  Publisher: String,
  UserId: String   // references users._id
}), 'cards');

app.post('/api/register', async (req, res) => {
  try {
    const { FirstName, LastName, Login, Password } = req.body || {};
    if (!FirstName || !LastName || !Login || !Password)
      return res.status(400).json({ error: 'FirstName, LastName, Login, and Password are required' });

    if (await User.findOne({ Login }))
      return res.status(409).json({ error: 'Login already exists' });

    const hash = await bcrypt.hash(Password, 10);
    const user = await User.create({ FirstName, LastName, Login, Password: hash });
    res.status(201).json({ message: 'User registered successfully', id: user._id });
  } catch (err) {
    // Unique index on Login catches a duplicate that slips past the check above
    if (err.code === 11000)
      return res.status(409).json({ error: 'Login already exists' });
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
