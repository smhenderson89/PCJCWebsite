const fs = require("fs/promises");
const path = require("path");

/* Controller - where actual DB logic is used */

const testData = require("../db/realData/June05data.json");

async function getYearsData(req, res, next) {
  try {
    /* Look at JSON, eventdate, put those into buckets for various years */
    let yearsCounts = {};
    
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

    // Sort yeards descedning

    const sortedCountsArray = Object.entries(yearsCounts)
    .sort((a, b) => parseInt(b[0]) - parseInt(a[0]));

    res.render('pages/awardlist', {years : sortedCountsArray}); 
    } catch (error) {
      console.error("Error in getYearsData:", error);
      next(error); // pass error to Express error handler
    }
}

module.exports = { getYearsData };
