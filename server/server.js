require('dns').setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Mongo connected'))
  .catch(err => console.error(err));

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
  const { FirstName, LastName, Login, Password } = req.body;
  const hash = await bcrypt.hash(Password, 10);
  const user = await User.create({ FirstName, LastName, Login, Password: hash });
  res.json({ id: user._id });
});

app.post('/api/login', async (req, res) => {
  const { Login, Password } = req.body;
  const user = await User.findOne({ Login });
  if (!user || !(await bcrypt.compare(Password, user.Password)))
    return res.status(401).json({ error: 'Invalid login' });
  res.json({ id: user._id, FirstName: user.FirstName, LastName: user.LastName });
});

app.post('/api/cards', async (req, res) => {
  const card = await Card.create(req.body);   // body must include UserId
  res.json(card);
});

app.get('/api/cards/:userId', async (req, res) => {
  res.json(await Card.find({ UserId: req.params.userId }));
});

app.listen(process.env.PORT, () => console.log('API on ' + process.env.PORT));