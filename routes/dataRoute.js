const express = require("express");
const router = express.Router();
const databaseController = require('../controllers/databaseCalls'); // Define controllers

router.get('/', (req, res) => {
  res.json({message: 'Data Route'});
})

// Call getYearsDate controller
router.get('/years', databaseController.getYearsData);

module.exports = router;


