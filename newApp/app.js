
// Boilerplate Information

const hostname = "127.0.0.1"
const port = 3000;
const helmet = require("helmet")

const express = require('express');

var app = express();

// DEBUG - show current time
var d = new Date();
var renderTime = d.toLocaleTimeString();

// set the view engine to ejs
// use res.render to load up an ejs view file
app.set('view engine', 'ejs');

// Enable body parsing globally
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security
const isProduction = process.env.NODE_ENV === 'production';

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

app.get('/personnel', function(req, res) {
  res.render('pages/personnel');
});

app.listen(port, () => {
    console.log(`Website render at ${renderTime}`)
    console.log(`Website listening on ${hostname}:${port}`)
  })
