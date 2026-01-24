var express = require('express');
const path = require('path');
var app = express();

// set the view engine to ejs
app.set('view engine', 'ejs');

// Static files FIRST (simplified and optimized)
app.use(express.static(__dirname, { 
  maxAge: '1h',  // Cache static files for 1 hour
  etag: false    // Disable etag generation for better performance
}));

// Security middleware (AFTER static files)
const { setupSecurity } = require('./src/middleware/security');

// Add timing middleware to debug
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 100) { // Log slow requests
      console.log(`Slow request: ${req.method} ${req.url} took ${duration}ms`);
    }
  });
  next();
});

// Re-enable security now that performance is good
setupSecurity(app);

// Server information
const hostname = "127.0.0.1"
const port = 8000

// Temporarily disable livereload for performance testing
// const livereload = require("livereload")
// const connectLiveReload = require("connect-livereload")

// Create a server with livereload and fire it up
// const liveReloadServer = livereload.createServer()

// Refresh the browser after each saved change on the server with a delay of 100 ms
// liveReloadServer.server.once("connection", () => {
//     setTimeout(() => {
//         liveReloadServer.refresh("/")
//     }, 100)
// })

// Add livereload script to the response
// app.use(connectLiveReload())

// Import routes
const routes = require('./src/routes/index');

// Use routes
app.use('/', routes.awards.api);     // Awards API routes
app.use('/', routes.awards.pages);   // Awards page routes  
app.use('/', routes.general.pages);  // General/static page routes

// Basic homepage route (temporary)
app.get('/', (req, res) => {
  res.render('pages/index');
});

// Start server
const startTime = Date.now();
app.listen(port, hostname, function() {
  const serverStartupTime = Date.now() - startTime;
  console.log(`Server running at http://${hostname}:${port}`)
  console.log(`Server startup time: ${serverStartupTime}ms`);
});