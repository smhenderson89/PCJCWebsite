const express = require('express');
const cors = require('cors'); // Cross Origin Resource Sharing
const helmet = require('helmet'); // Security
const morgan = require('morgan'); // Request Logger middleware
const compression = require('compression') // Compression middleware for fetch responses

// Common allowed sources (adjust to your needs)
const bootstrapCDN = 'https://cdn.jsdelivr.net';
const self = "'self'";

const cspDirectivesDev = {
  defaultSrc: [self],
  scriptSrc: [
    self,
    bootstrapCDN,
    "'unsafe-inline'",    // allow inline scripts for easy dev
    "'unsafe-eval'",     // allow eval() for debugging tools (e.g. React devtools)
  ],
  styleSrc: [
    self,
    bootstrapCDN,
    "'unsafe-inline'",   // allow inline styles (Bootstrap needs this)
  ],
  imgSrc: [
    self,
    'data:',            // allow embedded images, favicons
    bootstrapCDN,
  ],
  fontSrc: [
    self,
    bootstrapCDN,
  ],
};

const cspDirectivesProd = {
  defaultSrc: [self],
  scriptSrc: [
    self,
    bootstrapCDN,
    // No unsafe-inline or unsafe-eval here for security
  ],
  styleSrc: [
    self,
    bootstrapCDN,
    "'unsafe-inline'",  // Bootstrap CSS still requires this inline style allowance
  ],
  imgSrc: [
    self,
    'data:',
    bootstrapCDN,
  ],
  fontSrc: [
    self,
    bootstrapCDN,
  ],
};

app.use(
  helmet.contentSecurityPolicy({
    directives: isProduction ? cspDirectivesProd : cspDirectivesDev,
  })
);

// Security for Helmet
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:"], // ✅ Add "data:" here to allow embedded SVGs
    },
  })
);



module.exports = function setupMiddleware(app) {
  app.use(helmet());
  app.use(cors());
  app.use(morgan('dev'));
  app.use(express.static('public'));
  app.use(compression()); // Enable gzip compression
};