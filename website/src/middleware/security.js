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
  // Determine if we're in development mode - be more explicit
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isDevelopment = nodeEnv !== 'production';
  
  console.log(`🔍 Security middleware loaded:`);
  console.log(`   NODE_ENV: "${process.env.NODE_ENV}" (raw)`);
  console.log(`   Detected nodeEnv: "${nodeEnv}"`);
  console.log(`   isDevelopment: ${isDevelopment}`);
  console.log(`   CSP will be: ${isDevelopment ? 'DISABLED' : 'ENABLED'}`);
  console.log(`   Note: API routes have additional CSP removal middleware`);
  
  // Don't use any helmet CSP at all in development
  if (isDevelopment) {
    app.use(helmet({
      contentSecurityPolicy: false,  // FORCE OFF
      noSniff: false
    }));
    console.log('🔧 Development mode: CSP is DISABLED');
  } else {
    // Production CSP configuration
    const productionCspConfig = {
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

    app.use(helmet({
      contentSecurityPolicy: productionCspConfig,
      noSniff: false
    }));
    console.log('🔒 Production mode: CSP is ENABLED for security');
  }
  
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