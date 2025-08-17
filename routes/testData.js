const express = require("express");
const router = express.Router();

// import test JSON file
const testData = require("../db/realData/June05data.json");

// Define controllers used

router.get('/', (req, res) => {
  res.json({message: 'Test Data'});
})

router.get('/years', (req, res) => {
    try {
        /* Look at JSON, eventdate, put those into buckets for various years */

        let yearsCounts = {};
        testData = loadTestData();
        
        // Get plant year from year award
        testData.forEach(entry => {
            let fullDate = new Date(entry['datevalue']);
            let entryYear = fullDate.getFullYear();

            if (!yearsCounts[entryYear]) {
                yearsCounts[entryYear] = 0
            }
            yearsCounts[entryYear]++;
        })
        console.log(yearsCounts);

        const sortedCountsArray = Object.entries(yearsCounts)
        .sort((a, b) => parseInt(b[0]) - parseInt(a[0]));

        res.send(sortedCountsArray);

    } catch (error) {
        console.error("Error in getYearsData:", error);
        next(error); // pass error to Express error handler
    }

})

module.exports = router;


