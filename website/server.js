var express = require('express');
var cors = require('cors');
var app = express();

// set the view engine to ejs
app.set('view engine', 'ejs');

// cors
app.use(cors())

// Server information
const hostname = "127.0.0.1"
const port = 8000

// use res.render to load up an ejs view file

// index page
app.get('/', function(req, res) {
  res.render('pages/index');
});

app.get('/home', function(req, res) {
  res.render('pages/index');
});

// about page
app.get('/about', function(req, res) {
  res.render('pages/about');
});

// personnel page
app.get('/personnel', function(req, res) {
  res.render('pages/personnel')
})

// calendar page
app.get('/calendar', function(req, res) {
  res.render('pages/calendar')
})



app.listen(port, hostname, function() {
  console.log(`Server running at http://${hostname}:${port}`)

});