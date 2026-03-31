import express from 'express';
import { Router } from 'express';


// import test JSON file
import testData from '../../db/testData/fakeAwardData.json' assert { type: 'json' };

const testDataRoute = express.Router();

testDataRoute.get('/', (req, res) => {
  res.json({message: 'Test Data'});
})

testDataRoute.get('/years', (req, res) => {
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


export default testDataRoute;


