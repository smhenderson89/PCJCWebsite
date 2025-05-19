const express = require('express');
const cors = require('cors'); // Cross Origin Resource Sharing
const helmet = require('helmet'); // Security
const morgan = require('morgan'); // Request Logger middleware
const compression = require('compression') // Compression middleware for fetch responses
var app = express();

// Security
const isProduction = process.env.NODE_ENV === 'production';

const self = "'self'";
const bootstrapCDN = 'https://cdn.jsdelivr.net';

const cspDirectives = {
  defaultSrc: [self],
  scriptSrc: [self, bootstrapCDN, "'unsafe-inline'", "'unsafe-eval'"],
  styleSrc: [self, bootstrapCDN, "'unsafe-inline'"],
  fontSrc: [self, bootstrapCDN],
  imgSrc: [self, 'data:', bootstrapCDN],
};

if (isProduction) {
  // Strip unsafe sources in production
  cspDirectives.scriptSrc = [self, bootstrapCDN];
  cspDirectives.styleSrc = [self, bootstrapCDN, "'unsafe-inline'"]; // still needed for Bootstrap
}

module.exports = function setupMiddleware(app) {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: cspDirectives,
      },
    })
  );
  app.use(cors());
  app.use(morgan('dev'));
  app.use(express.static('public'));
  app.use(compression()); // Enable gzip compression
};