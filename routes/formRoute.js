const express = require("express");
const fs = require("fs"); // Express write
const path = require("path"); // for recognizing the path
const multer = require("multer"); // managing data as send by post
const router = express.Router();

// Handling Image -  Use memory storage (doesn't write to disk)
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get('/', (req, res) => {
  res.json({message: 'Hello World'});
})

router.post('/', upload.single('awardPhoto'), (req, res) => {
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

module.exports = router;