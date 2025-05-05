// Load env variable
require('dotenv').config()

const express = require("express");
const port = 3000;


const app = express();

app.get("/", (req, res) => {
  res.send('Hello World!')

});

app.post('/formSubmission', (req, res) => {
  res.send('Got a POST request')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })