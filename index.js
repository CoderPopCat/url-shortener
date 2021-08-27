const express = require('express')
const mongoose = require('mongoose')
const ShortUrl = require('./models/shortUrl')
const app = express()
const rateLimit = require("express-rate-limit")
const createAccountLimiter = rateLimit({
  windowMs: 10000, 
  max: 2, 
  message:
    "You can only create 2 urls in 10 seconds!"
});

mongoose.connect('MONGODB_URI', {
  useNewUrlParser: true, useUnifiedTopology: true
});

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));

app.get('/', async (req, res) => {
  const shortUrls = await ShortUrl.find()

  res.render('index', { shortUrls: shortUrls })
});


app.get("/del", async (req, res) => {
  const e = await ShortUrl.findOne({ short: req.query.q })
  res.send(`Deleted ${e.full} endpoint`)
  if (e) e.delete()
});


app.get("/style.css", (req, res) => {
  res.sendFile(__dirname + "/style.css")
});

app.post('/shortUrls', createAccountLimiter, async (req, res) => {
  const existing = await ShortUrl.findOne({ short: req.body.shortUrl })
  if (existing) return res.sendFile(__dirname + '/error.html')
  const banned = ["https://pornhub.com", "https://xhamster.com"]
  for (let i in banned) {
    if (req.body.fullUrl.toLowerCase().includes(banned[i].toLowerCase())) return res.send(`no`)
  }
  await ShortUrl.create({ full: req.body.fullUrl, short: req.body.shortUrl })

  res.redirect('/')
});


app.get('/:shortUrl', async (req, res) => {
  const shortUrl = await ShortUrl.findOne({ short: req.params.shortUrl })
  if (shortUrl == null) return res.sendStatus(404)

  shortUrl.clicks++
  shortUrl.save()

  res.redirect(shortUrl.full)
});

app.listen(5000);
