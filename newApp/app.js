
// Boilerplate Information

const hostname = "127.0.0.1"
const port = 3000;
const helmet = require("helmet")

const express = require('express');

var app = express();

// Middleware Routes
require('./config/middleware')(app);

// View Engine Route
require('./config/viewEngine')(app);

// DEBUG - show current time
var d = new Date();
var renderTime = d.toLocaleTimeString();

// Enable body parsing globally
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routing folders - splitting up routes into seperate folders
const formRoute = require('./routes/formRoute')
app.use('/formSubmission', formRoute);

// Static serving for uploads if you want to access uploaded files later
app.use('/uploads', express.static('uploads'));

// server static files
app.use(express.static('public'))

// index page
app.get('/', function(req, res) {
  res.render('pages/index');
});

// form submission
app.get('/form', function(req, res) {
  res.render('pages/form');
});

// personnel page
app.get('/personnel', function(req, res) {
  res.render('pages/personnel');
});

// awards list
app.get('/awardlist', function(req, res) {
  res.render('pages/awardlist');
});

// award by year 
app.get('/awardyear', function(req, res) {
  res.render('pages/awardyear');
});

// plant page example
app.get('/plantpage', function(req, res) {
  res.render('pages/plantpage');
});

app.listen(port, () => {
    console.log(`Website render at ${renderTime}`)
    console.log(`Website listening on ${hostname}:${port}`)
  })
