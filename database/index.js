// Load env variable
import dotenv from "dotenv"
import express from "express";

const hostname = "127.0.0.1"
const port = 3000;

import cors from 'cors' // Use CORS

const app = express();

// Enable CORS for all routes
app.use(cors());

// Optional: Only allow certain origins
// app.use(cors({ origin: 'http://localhost:5173' }));


app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.get("/", (req, res) => {
  res.send('Hello World!')

});

app.post('/submit', (req, res) => {
  res.json({message: 'Form received!'});
})

app.listen(port, () => {
    console.log(`Backend listening on ${hostname}:${port}`)
  })