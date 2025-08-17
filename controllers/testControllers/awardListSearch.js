const testData = require("../../db/testData/fakeAwardData.json"); assert { type: 'json' };

let yearLookUp = '2025'

// filter by lookup Year
function filterByYear(data, year) {
    return testData.filter(entry => {
        return entry.eventDate.startsWith(yearLookUp);
    })
}

let yearObject = filterByYear(testData, yearLookUp)

/* Wtihin specified year, create array to create table for each event and associated award
Look at PCJC website for example: https://www.paccentraljc.org/2025.html
*/





