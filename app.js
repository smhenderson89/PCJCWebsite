
// Boilerplate Information

const hostname = "127.0.0.1"
const port = 3000;

// testData

const express = require("express");

const setupMiddleware = require("./config/middleware.js");
const setupViewEngine = require("./config/viewEngine.js");

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
const formRoute = require("./routes/formRoute.js");
app.use('/formSubmission', formRoute);

// const testData = require("./routes/testData.js");
// const {  loadTestData  } = require("./controllers/databaseCalls.js");
// app.use('/testData', testData)

const dataRoute = require("./routes/dataRoute.js")
app.use('/data', dataRoute)

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

// awards list - set dataRoute controller
app.use("/awardlist", dataRoute);

// Login Page 
app.get('/login', function(req, res) {
  res.render('pages/login');
});

// plant page example
app.get('/plantpage', function(req, res) {
  res.render('pages/plantpage');
});

// Catch all for error messages
app.use((err, req, res, next) => {
    console.error(err.stack);  // log full stack for debugging
    res.status(500).render('pages/error', { error: err.message }); // or res.json({ error: err.message })
});

app.listen(port, () => {
    console.log(`Website render at ${renderTime}`)
    console.log(`Website listening on ${hostname}:${port}`)
  })
