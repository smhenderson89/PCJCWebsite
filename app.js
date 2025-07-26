
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
import { loadTestData } from './controllers/databaseCalls.js';
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
app.get('/awardlist', async function(req, res) {
  try {
    const data = await loadTestData();
    let yearsCounts = {};
    data.forEach(entry => {
      const [year] = entry.eventDate.split("-");
      const entryYear = year;

      if (!yearsCounts[entryYear]) {
          yearsCounts[entryYear] = 0
      }
      yearsCounts[entryYear]++;
    }
  );
  // Organize the data latest to earliest
  const sortedCountsArray = Object.entries(yearsCounts)
  .sort((a, b) => parseInt(b[0]) - parseInt(a[0]));


  res.render('pages/awardlist', {years : sortedCountsArray}); 
  } catch (error) {
      console.log('Error loading data', error)
      res.status(500).send('Internal Service Error')
    }
  });

// award by requested year 
app.get('/awardyear/:year', async function(req, res) {
  try {
    // Load Data
    let yearLookUp = req.params.year;
    const data = await loadTestData();
    let returnObject = data.filter(entry => {
      return entry.eventDate.startsWith(yearLookUp)      
    })

    console.log(yearLookUp);

    res.render('pages/awardyear', {
      year: yearLookUp,
      awards: returnObject
    });
  } catch (error) {
      console.log('Error loading data', error)
      res.status(500).send('Internal Service Error')
    }
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
