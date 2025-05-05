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


// Require livereload and connectLiveReload
const livereload = require("livereload")
const connectLiveReload = require("connect-livereload")

// Create a server with livereload and fire it up
const liveReloadServer = livereload.createServer()

// Refresh the browser after each saved change on the server with a delay of 100 ms
liveReloadServer.server.once("connection", () => {
    setTimeout(() => {
        liveReloadServer.refresh("/")
    }, 100)
})

// Add livereload script to the response
app.use(connectLiveReload())


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

// awards list
app.get('/awardslist', function(req, res) {
  res.render('pages/awardslist')
})

// plantpage
app.get('/plantpage', function(req, res) {
  res.render('pages/plantpage')
})


app.listen(port, hostname, function() {
  console.log(`Server running at http://${hostname}:${port}`)

});