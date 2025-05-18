const express = require("express")
const multer = require('multer');
const router = express.Router()


// Setup storage on disk for image files eventually
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // folder where files will be saved
  },
  filename: function (req, file, cb) {
    // Save with original filename + timestamp
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

router.get('/', (req, res) => {
  res.json({message: 'Hello World'});
})

router.post('/', upload.none(), (req, res) => {
  console.log('Form Body', req.body);
  res.json({message: 'Form received!'});
})

module.exports = router;