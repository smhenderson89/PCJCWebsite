import express from 'express';
import fs from 'fs'; // Express write
import path from 'path'; // for recognizing the path
import multer from 'multer'; // managing data as send by post
import { Router } from 'express';

const formRoute = express.Router();

// Handling Image -  Use memory storage (doesn't write to disk)
const storage = multer.memoryStorage();
const upload = multer({ storage });

formRoute.get('/', (req, res) => {
  res.json({message: 'Hello World'});
})

formRoute.post('/', upload.single('awardPhoto'), (req, res) => {
    console.log('Form Body', req.body);
    console.log('Uploaded file', req.file)

    res.json({
    message: 'Form data received successfully!',
    filename: req.file.originalname,
    size: req.file.size,
    type: req.file.mimetype,
    fields: req.body
  });
})

export default formRoute