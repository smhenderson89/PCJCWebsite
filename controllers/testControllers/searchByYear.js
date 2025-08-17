import testData from '../../db/testData/fakeAwardData.json' assert { type: 'json' };

// Return an object of object of orchids belonging to one year

let yearLookUp = '2025';

function filterByYear(testData, yearLookUp) {
    return testData.filter(entry => {
        return entry.eventDate.startsWith(yearLookUp);
    })
}

let resultObject = filterByYear(testData, yearLookUp)
console.log(resultObject);