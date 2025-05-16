const express = require("express")
const router = express.Router()

router.get('/', (req, res) => {
  res.json({message: 'Hello World'});
})

router.post('/', (req, res) => {
  res.json({message: 'Form received!'});
})

module.exports = router;