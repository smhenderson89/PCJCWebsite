const hostname = "127.0.0.1"
const port = 3000;

var express = require('express');
var app = express();

// DEBUG - show current time
var d = new Date();
var renderTime = d.toLocaleTimeString();

// set the view engine to ejs
app.set('view engine', 'ejs');

// use res.render to load up an ejs view file

// server static files
app.use(express.static('public'))

// index page
app.get('/', function(req, res) {
  res.render('pages/index');
});

// about page
app.get('/about', function(req, res) {
  res.render('pages/about');
});

app.listen(port, () => {
    console.log(`Website render at ${renderTime}`)
    console.log(`Website listening on ${hostname}:${port}`)
  })
