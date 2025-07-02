
// Boilerplate Information

const hostname = "127.0.0.1"
const port = 3000;

// testData

import express from 'express'

import setupMiddleware from './config/middleware.js';
import setupViewEngine from './config/viewEngine.js';

var app = express();

// Middleware Routes
setupMiddleware(app);

// View Engine Route
setupViewEngine(app);

// DEBUG - show current time
var d = new Date();
var renderTime = d.toLocaleTimeString();

// Enable body parsing globally
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routing folders - splitting up routes into seperate folders
import formRoute from './routes/formRoute.js';
app.use('/formSubmission', formRoute);

import testData from './routes/testData.js';
app.use('/testData', testData)

// Static serving for uploads if you want to access uploaded files later
app.use('/uploads', express.static('uploads'));

// server static files
app.use(express.static('public'))

// index page
app.get('/', function(req, res) {
  res.render('pages/index');
});

app.get('/hello', function(req, res) {
  res.send('helloWorld');
})

// form submission
app.get('/form', function(req, res) {
  res.render('pages/form');
});

// personnel page
app.get('/personnel', function(req, res) {
  res.render('pages/personnel');
});

// awards list
app.get('/awardlist', function(req, res) {
  /* Render information based on data from sample data */

  res.render('pages/awardlist',);
});

// award by year 
app.get('/awardyear', function(req, res) {
  res.render('pages/awardyear');
});

// Login Page 
app.get('/login', function(req, res) {
  res.render('pages/login');
});

// plant page example
app.get('/plantpage', function(req, res) {
  res.render('pages/plantpage');
});

app.listen(port, () => {
    console.log(`Website render at ${renderTime}`)
    console.log(`Website listening on ${hostname}:${port}`)
  })
