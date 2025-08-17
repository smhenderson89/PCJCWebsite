// Using CommonJS for modules for the website
const testData = require('../../db/realData/June05data.json')

// Return an object of object of orchids belonging to one year

let yearLookUp = '2025';

function filterByYear(testData, yearLookUp) {
    return testData.filter(entry => {
        return entry.eventDate.startsWith(yearLookUp);
    })
}

function filterNewVersion() {
    // Get plant year from year award
    let yearsCounts = {};
    testData.forEach(entry => {
        stringDate = new Date(entry['datevalue']);
        entryYear = stringDate.getFullYear();

        console.log(entryYear);

        if (!yearsCounts[entryYear]) {
            yearsCounts[entryYear] = 0
        }
        yearsCounts[entryYear]++;
    })
    console.log(yearsCounts);

}

// let resultObject = filterByYear(testData, yearLookUp)
// console.log(resultObject);

filterNewVersion()

