var express = require('express');
var cors = require('cors');
var app = express();

// set the view engine to ejs
app.set('view engine', 'ejs');

// cors
app.use(cors())

// use res.render to load up an ejs view file

// index page
app.get('/', function(req, res) {
  res.render('pages/index');
});

// about page
app.get('/about', function(req, res) {
  res.render('pages/about');
});

// 



app.listen(8080);
console.log('Server is listening on port 8080');