// src/middleware/security.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const cors = require('cors');
const escapeHtml = require('escape-html');
const express = require('express');

// Simple XSS protection middleware
function sanitizeInput(req, res, next) {
  // Escape HTML in query params and body
  if (req.query) {
    for (let key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = escapeHtml(req.query[key].trim());
      }
    }
  }
  
  if (req.body) {
    for (let key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = escapeHtml(req.body[key].trim());
      }
    }
  }
  
  next();
}

function setupSecurity(app) {
  // Determine if we're in development mode
  const isDevelopment = process.env.NODE_ENV !== 'production';
  // Check if we're running on localhost (even in production mode, for local testing)
  const isLocalhost = !process.env.RENDER && !process.env.VERCEL && !process.env.HEROKU;
  
  // More permissive CSP for development
  const cspConfig = isDevelopment ? {
    directives: {
      defaultSrc: ["'self'", "http://localhost:*", "http://127.0.0.1:*"],
      styleSrc: ["'self'", "'unsafe-inline'", "*"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "*"],
      fontSrc: ["'self'", "data:", "*"],
      imgSrc: ["'self'", "data:", "http:", "https:", "*"],
      connectSrc: ["'self'", "http:", "https:", "ws:", "wss:", "*"],
      frameSrc: ["'self'", "*"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "*"],
      upgradeInsecureRequests: null  // Disable in development
    },
    reportOnly: true  // Allow navigation and DevTools in development
  } : {
    // Production CSP - more restrictive
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com",
        "https://stackpath.bootstrapcdn.com",
        "https://maxcdn.bootstrapcdn.com",
        "https://fonts.googleapis.com"
      ],
      scriptSrc: [
        "'self'",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com",
        "https://stackpath.bootstrapcdn.com",
        "https://maxcdn.bootstrapcdn.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.googleapis.com",
        "https://fonts.gstatic.com",
        "data:"
      ],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: [
        "'self'",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com",
        "https://stackpath.bootstrapcdn.com",
        "https://maxcdn.bootstrapcdn.com"
      ]
    }
  };

  // Security headers (includes XSS protection)
  const helmetConfig = {
    // Completely disable CSP in development for easier development
    contentSecurityPolicy: isDevelopment ? false : cspConfig,
    // Disable strict MIME checking to be more forgiving with CSS files
    noSniff: false
  };

  // Only apply HTTPS-required headers when not on localhost
  if (!isLocalhost) {
    helmetConfig.crossOriginOpenerPolicy = { policy: "same-origin" };
    helmetConfig.crossOriginResourcePolicy = { policy: "cross-origin" };
    helmetConfig.originAgentCluster = true;
    helmetConfig.hsts = {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    };
  }

  app.use(helmet(helmetConfig));
  
  // CORS (enhanced version)
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.ALLOWED_ORIGINS?.split(',') 
      : true
  }));
  
  // Body parsing with size limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Input sanitization
  app.use(sanitizeInput);
  
  // Rate limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests, please try again later.'
  });
  app.use('/api/', apiLimiter);
  
  // Request logging
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

module.exports = { setupSecurity };