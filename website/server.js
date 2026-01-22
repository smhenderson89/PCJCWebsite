var express = require('express');
var cors = require('cors');
var app = express();

// set the view engine to ejs
app.set('view engine', 'ejs');

// cors
app.use(cors())

// Static files
app.use(express.static('public'));
app.use('/css', express.static('css'));
app.use('/images', express.static('images'));

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

// Import routes
const routes = require('./src/routes/index');

// Use routes
app.use('/', routes.awards);  // Awards API routes
app.use('/', routes.pages);   // Static page routes

// Basic homepage route (temporary)
app.get('/', (req, res) => {
  res.render('pages/index');
});

// Start server
app.listen(port, hostname, function() {
  console.log(`Server running at http://${hostname}:${port}`)
});