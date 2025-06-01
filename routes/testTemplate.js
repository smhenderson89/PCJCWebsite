const express = require("express")
const path = require('path'); // for recognizing the path
const router = express.Router()

// import test JSON file
const testData = require('../public/sampleData.json');

router.get('/', (req, res) => {
  res.json({message: 'Test Data'});
})

router.get('/years', (req, res) => {
    /* Look at JSON, eventdate, put those into buckets for various years */

    let yearsCounts = {};
    
    // Get plant year from year award
    testData.forEach(entry => {
        const [year, month, day] = entry.eventDate.split("-");
        const entryYear = year;

        if (!yearsCounts[entryYear]) {
            yearsCounts[entryYear] = 0
        }
        yearsCounts[entryYear]++;
    })
    
    res.send(yearsCounts);
})


module.exports = router;


