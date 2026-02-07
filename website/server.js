var express = require('express');
const path = require('path');
var app = express();

// set the view engine to ejs
app.set('view engine', 'ejs');

// Disable view caching in development
if (process.env.NODE_ENV !== 'production') {
  app.set('view cache', false);
}

// Static files FIRST (simplified and optimized)
app.use(express.static(path.join(__dirname, 'public'), { 
  maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0,  // No cache in development
  etag: false    // Disable etag generation for better performance
}));

// Serve database images from /db/images as /images
app.use('/images', express.static(path.join(__dirname, '..', 'db', 'images'), {
  maxAge: '1h',
  etag: false
}));

// Serve thumbnails from /db/thumbnails as /thumbnails
app.use('/thumbnails', express.static(path.join(__dirname, '..', 'db', 'thumbnails'), {
  maxAge: '24h', // Cache thumbnails longer since they don't change
  etag: false
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
const hostname = "0.0.0.0"; // Use 0.0.0.0 for both development and production
const port = process.env.PORT || 8000; // Use PORT env variable for production, fallback to 8000 for development

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

// Import middleware
const staticAssetRedirects = require('./src/middleware/staticAssetRedirects');

// Apply middleware BEFORE routes
app.use(staticAssetRedirects()); // Handle PWA icon redirects and well-known requests

// Use routes
app.use('/', routes.awards.api);     // Awards API routes
app.use('/', routes.admin.api);      // Admin API routes
app.use('/', routes.awards.pages);   // Awards page routes  
app.use('/', routes.admin.pages);    // Admin page routes
app.use('/', routes.general.pages);  // General/static page routes

// Health check endpoint for deployment verification
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

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