const fs = require("fs");
const {  faker  } = require("@faker-js/faker");

function getRandomFloat(min, max, decimals = 1) {
  const str = (Math.random() * (max - min) + min).toFixed(decimals);
  return parseFloat(str);
}


function createAwardEntry(index) {

    const awardTypes = ['HCC', 'AM', 'FCC', 'CCM', 'CCE', 'CHM', 'CBR','AD', 'AQ', 'JC']
    const orchidGenera = ['Cattleya', 'Phalaenopsis', 'Paphiopedilum', 'Dendrobium', 'Vanda'];
    const lipOrSepal = faker.helpers.arrayElement(['Lip&LateralSepal', 'Pouch&Synsepal']);

    const usesLip = lipOrSepal === 'Lip&LateralSepal';
    const usesPouch = lipOrSepal === 'Pouch&Synsepal';



    const locationsTitle = ["San Francisco Monthly", "Filoli Historic House Monthly", "San Francisco Monthly"]
    const location = faker.helpers.arrayElement(locationsTitle)

    let min = 10;
    let max = 20;

    const genus = faker.helpers.arrayElement(orchidGenera);

    const imageUrls = [
        "https://www.paccentraljc.org/250107/20255350.jpg",
        "https://www.paccentraljc.org/250107/20255352.jpg",
        "https://www.paccentraljc.org/250204/20255354.jpg",
        "https://www.paccentraljc.org/250227/20255362.jpg",
        "https://www.paccentraljc.org/250405/20255271.jpg",
        "https://www.paccentraljc.org/250405/20255274.jpg",
        "https://www.paccentraljc.org/250621/20255302.jpg",
        "https://www.paccentraljc.org/20240215/20245356.jpg",
        "https://www.paccentraljc.org/20240420/20245271.jpg",
        "https://www.paccentraljc.org/240720/20245291.jpg",
        "https://www.paccentraljc.org/241105/20245385.jpg",
        "https://www.paccentraljc.org/241105/20245392.jpg",
        "https://www.paccentraljc.org/241221/20245305.jpg",
        "https://www.paccentraljc.org/20230318/20235271.jpg",
        "https://www.paccentraljc.org/20230715/20235297.jpg"
    ]

    const plantNames = [
        'Golden Daisy', 'Sunset Tulip', 'Lavender Bliss', 'Ocean Rose',
        'Midnight Lily', 'Crimson Fern', 'Emerald Ivy', 'Blue Sage', 'Pink Poppy'
    ];

    const exhibitors = [
        "Sylvia Darr",
        "Paul and Phyllis Chim",
        "Zach and Pat Coney",
        "Dan Williamson",
        "Chaunie Langland",
        "Mary Gerritsen",
        "Japheth Ko",
        "Barbara Cameron"
    ]

    return {
        awardTypes: faker.helpers.arrayElement(awardTypes),
        awardValue: Math.floor(Math.random() * (max - min + 1) + min ),
        awardNumber: `2025-${faker.string.numeric(5)}`,
        eventTitle: location,
        eventDate: faker.date.past({years: 5}).toISOString().split('T')[0],
        genus: genus,
        "hybrid/species": faker.word.words(2),
        clonalName: faker.person.firstName(),
        crossName: `${genus} cross ${faker.word.sample()}`,
        exhibitors: `${faker.person.firstName()} ${faker.person.lastName()}`,
        photographer: faker.person.firstName(),
        awardPhoto: {
            url: imageUrls[index % imageUrls.length]
        },

        NS: getRandomFloat(6, 16),
        NSV: getRandomFloat(5, 14),
        DSL: getRandomFloat(3, 8),
        DSW: getRandomFloat(1, 4),
        PETL: getRandomFloat(4, 10),
        PETW: getRandomFloat(1, 3),
        lipOrSepal: lipOrSepal,

        // Conditional measurements
        LSW: usesLip ? getRandomFloat(1, 3) : "",
        LSL: usesLip ? getRandomFloat(2, 5) : "",
        LIPW: usesLip ? getRandomFloat(1, 4) : "",
        LIPL: usesLip ? getRandomFloat(2, 5) : "",

        PCHW: usesPouch ? getRandomFloat(1, 2) : "",
        SYNSL: usesPouch ? getRandomFloat(2, 5) : "",
        SYNSW: usesPouch ? getRandomFloat(1, 3) : "",

        numflowers: faker.number.int({ min: 1, max: 5 }),
        numBuds: faker.number.int({ min: 0, max: 2 }),
        numInflorescences: faker.number.int({ min: 1, max: 2 }),

    }
}

const totalEntries = 100; // total number of award entries you want
let generatedEntries = [];
let awardIndex = 0;

while (generatedEntries.length < totalEntries) {
  const entriesInEvent = faker.number.int({ min: 1, max: 7 });
  console.log(`batch num: ${entriesInEvent}`);

  const sharedEventTitle = faker.helpers.arrayElement([
    "San Francisco Monthly",
    "Filoli Historic House Monthly",
    "San Jose Monthly",
    "Oakland Monthly"
  ]);
  const sharedEventDate = faker.date.past({ years: 5 }).toISOString().split("T")[0];

  for (let i = 0; i < entriesInEvent && generatedEntries.length < totalEntries; i++) {
    const awardEntry = createAwardEntry(awardIndex);
    awardEntry.eventTitle = sharedEventTitle;
    awardEntry.eventDate = sharedEventDate;
    generatedEntries.push(awardEntry);
    awardIndex++;
  }
}

const testData = Array.from({ length: totalEntries }, (_, i) => createAwardEntry(i));

fs.writeFileSync('fakeAwardData.json', JSON.stringify(testData, null, 2));
console.log(`✅ ${totalEntries} award entries written to fakeAwardData.json`);