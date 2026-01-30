/**
 * Static Asset Redirects Middleware
 * Handles common requests for PWA icons and assets at root level
 */

const express = require('express');

/**
 * Middleware to handle static asset redirects
 * Redirects commonly requested assets from root to their actual locations
 */
function staticAssetRedirects() {
  const router = express.Router();

  // PWA icon redirects - redirect from root to favicon folder
  router.get('/android-chrome-192x192.png', (req, res) => {
    res.redirect(301, '/favicon/android-chrome-192x192.png');
  });

  router.get('/android-chrome-512x512.png', (req, res) => {
    res.redirect(301, '/favicon/android-chrome-512x512.png');
  });

  router.get('/apple-touch-icon.png', (req, res) => {
    res.redirect(301, '/favicon/apple-touch-icon.png');
  });

  router.get('/favicon.ico', (req, res) => {
    res.redirect(301, '/favicon/favicon.ico');
  });

  // Handle Chrome DevTools well-known requests
  router.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
    res.status(404).json({ error: 'DevTools configuration not available' });
  });

  return router;
}

module.exports = staticAssetRedirects;