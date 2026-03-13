// This file contains helper functions for testing the submit form

// Helper function to randomly select an option from a dropdown
function randomSelectFromDropdown(selectId) {
    const selectElement = document.getElementById(selectId);
    if (!selectElement || selectElement.options.length <= 1) return null;
    
    // Skip the first option (usually "Select..." placeholder)
    const validOptions = Array.from(selectElement.options).slice(1);
    if (validOptions.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * validOptions.length);
    const selectedOption = validOptions[randomIndex];
    
    selectElement.value = selectedOption.value;
    return selectedOption.value;
}

// Helper function to fill a text input with random test data
function fillTestInput(inputId, testValue) {
    const input = document.getElementById(inputId);
    if (input) {
        input.value = testValue;
    }
}

function testSubmit() {
    console.log('🧪 Running test submission - filling form with random data...');
    
    // Randomly decide whether to use "new" options (30% chance each)
    const useNewExhibitor = Math.random() < 0.3;
    const useNewAwardType = Math.random() < 0.3;
    const useNewEvent = Math.random() < 0.3;
    const useNewPhotographer = Math.random() < 0.3;
    
    // Handle exhibitor selection
    if (useNewExhibitor) {
        document.getElementById('newExhibitorCheck').checked = true;
        document.getElementById('newExhibitorNameInput').disabled = false;
        fillTestInput('newExhibitorNameInput', 'Test Exhibitor ' + Math.floor(Math.random() * 1000));
    } else {
        document.getElementById('newExhibitorCheck').checked = false;
        randomSelectFromDropdown('exhibitorSelect');
    }
    
    // Handle award type selection
    if (useNewAwardType) {
        document.getElementById('newAwardTypeCheck').checked = true;
        document.getElementById('newAwardTypeInput').disabled = false;
        fillTestInput('newAwardTypeInput', 'TEST');
    } else {
        document.getElementById('newAwardTypeCheck').checked = false;
        randomSelectFromDropdown('awardSelect');
    }
    
    // Handle event selection
    if (useNewEvent) {
        document.getElementById('newEventCheck').checked = true;
        document.getElementById('newEventInput').disabled = false;
        fillTestInput('newEventInput', 'Test Event ' + new Date().getFullYear());
    } else {
        document.getElementById('newEventCheck').checked = false;
        randomSelectFromDropdown('eventSelect');
    }
    
    // Handle photographer selection
    if (useNewPhotographer) {
        document.getElementById('newPhotographerCheck').checked = true;
        document.getElementById('newPhotographerInput').disabled = false;
        fillTestInput('newPhotographerInput', 'Test Photographer');
    } else {
        document.getElementById('newPhotographerCheck').checked = false;
        randomSelectFromDropdown('photographerSelect');
    }
    
    // Fill in other test data
    fillTestInput('awardValue', String(Math.floor(Math.random() * 40) + 80)); // 80-119
    fillTestInput('awardNumber', '2026' + String(Math.floor(Math.random() * 9000) + 1000)); // 2026XXXX
    
    // Set a test date (today)
    const today = new Date().toISOString().split('T')[0];
    fillTestInput('eventDate', today);
    
    // Fill plant info with test data
    const newGenus = Math.random() < 0.3;
    if (newGenus) {
        document.getElementById('newGenusCheck').checked = true;
        document.getElementById('newGenusInput').disabled = false;

        // Randomly select a test genus from a list of common orchid genera
        const testGenera = ['Cattleyai', 'Phalaenopsisi', 'Dendrobiumi', 'Oncidiumi', 'Paphiopedilumi'];
        const selectedGenus = testGenera[Math.floor(Math.random() * testGenera.length)];
        fillTestInput('newGenusInput', selectedGenus);
    } else {
        document.getElementById('newGenusCheck').checked = false;
        genusSelect.value = randomSelectFromDropdown('genusSelect');
    }
    
    fillTestInput('speciesInput', 'Test species');
        // Select option from dropdown table

    
    fillTestInput('HybridSpeciesInput', 'Test hybrid name');
    fillTestInput('clonalName', 'Test Clone');

    const newCross = Math.random()
 
    if (newCross <= 0.3) {
        document.getElementById('radioNewSpecies').checked = true;
        document.getElementById('NewcrossName').disabled = false;
        fillTestInput('NewcrossName', 'Test Parent 1 x Test Parent 2');
    } else if (newCross >= 0.3 && newCross < 0.6) {
        document.getElementById('radioSpecies').checked = true;
    } else {
        document.getElementById('radioNA').checked = true;
    }
    
    // Fill measurements with random test values
    fillTestInput('NSinput', String(Math.floor(Math.random() * 20) + 5));
    fillTestInput('NSVinput', String(Math.floor(Math.random() * 15) + 5));
    fillTestInput('DSWinput', String(Math.floor(Math.random() * 8) + 2));
    fillTestInput('DSLinput', String(Math.floor(Math.random() * 10) + 3));
    fillTestInput('PETWinput', String(Math.floor(Math.random() * 8) + 2));
    fillTestInput('PETLinput', String(Math.floor(Math.random() * 10) + 3));

    // Randomly select measurement type from dropdown and trigger visibility updates
    const measurementOptions = [
        { value: 'lipLateral', name: 'Lip and Lateral Sepal' },
        { value: 'pouchSynsepal', name: 'Pouch and Synsepal' },
        { value: 'other', name: 'Other (Displays)' }
    ];
    const selectedOption = measurementOptions[Math.floor(Math.random() * measurementOptions.length)];
    console.log(`🎲 Randomly selected measurement type: ${selectedOption.name}`);

    const measurementSelect = document.getElementById('measurementsSelect');
    if (measurementSelect) {
        measurementSelect.value = selectedOption.value;
        measurementSelect.dispatchEvent(new Event('change', { bubbles: true }));
        console.log(`✅ Dropdown selected: ${selectedOption.value}`);
    } else {
        console.error('❌ Could not find #measurementsSelect dropdown');
    }
    
    // Fill measurement fields based on selection  
    let valueRange = {
        'numflowers': [0, 100000],
        'numBuds': [0, 5000],
        'numInfloresecnes': [0, 5000],
        'NSinput': [0, 50],
        'NSVinput': [0, 100],
        'DSWinput': [0, 50],
        'DSLinput': [0, 100],
        'PETWinput': [0, 25],
        'PETLinput': [0, 100],
        'lsw': [0, 25],
        'lsl': [0, 25],
        'lipw': [0, 25],
        'lipl': [0, 25],
        'synsw': [0, 25],
        'synsl': [0, 25],
        'pouchw': [0, 25],
        'pouchl': [0, 25]
    }

    if (selectedOption.value === 'lipLateral') {
        // Lip and Lateral Sepal measurements
        fillTestInput('lsw', String(Math.floor(Math.random() * (valueRange['lsw'][1] - valueRange['lsw'][0] + 1)) + valueRange['lsw'][0]));
        fillTestInput('lsl', String(Math.floor(Math.random() * (valueRange['lsl'][1] - valueRange['lsl'][0] + 1)) + valueRange['lsl'][0]));
        fillTestInput('lipw', String(Math.floor(Math.random() * (valueRange['lipw'][1] - valueRange['lipw'][0] + 1)) + valueRange['lipw'][0]));
        fillTestInput('lipl', String(Math.floor(Math.random() * (valueRange['lipl'][1] - valueRange['lipl'][0] + 1)) + valueRange['lipl'][0]));
    } else if (selectedOption.value === 'pouchSynsepal') {
        // Pouch and Synsepal measurements  
        fillTestInput('synsw', String(Math.floor(Math.random() * (valueRange['synsw'][1] - valueRange['synsw'][0] + 1)) + valueRange['synsw'][0]));
        fillTestInput('synsl', String(Math.floor(Math.random() * (valueRange['synsl'][1] - valueRange['synsl'][0] + 1)) + valueRange['synsl'][0]));
        fillTestInput('pouchw', String(Math.floor(Math.random() * (valueRange['pouchw'][1] - valueRange['pouchw'][0] + 1)) + valueRange['pouchw'][0]));
        fillTestInput('pouchl', String(Math.floor(Math.random() * (valueRange['pouchl'][1] - valueRange['pouchl'][0] + 1)) + valueRange['pouchl'][0]));
    } else if (selectedOption.value === 'other') {
        // Fill both sets for "Other" option
        fillTestInput('lsw', String(Math.floor(Math.random() * (valueRange['lsw'][1] - valueRange['lsw'][0] + 1)) + valueRange['lsw'][0]));
        fillTestInput('lsl', String(Math.floor(Math.random() * (valueRange['lsl'][1] - valueRange['lsl'][0] + 1)) + valueRange['lsl'][0]));
        fillTestInput('lipw', String(Math.floor(Math.random() * (valueRange['lipw'][1] - valueRange['lipw'][0] + 1)) + valueRange['lipw'][0]));
        fillTestInput('lipl', String(Math.floor(Math.random() * (valueRange['lipl'][1] - valueRange['lipl'][0] + 1)) + valueRange['lipl'][0]));
        fillTestInput('synsw', String(Math.floor(Math.random() * (valueRange['synsw'][1] - valueRange['synsw'][0] + 1)) + valueRange['synsw'][0]));
        fillTestInput('synsl', String(Math.floor(Math.random() * (valueRange['synsl'][1] - valueRange['synsl'][0] + 1)) + valueRange['synsl'][0]));
        fillTestInput('pouchw', String(Math.floor(Math.random() * (valueRange['pouchw'][1] - valueRange['pouchw'][0] + 1)) + valueRange['pouchw'][0]));
        fillTestInput('pouchl', String(Math.floor(Math.random() * (valueRange['pouchl'][1] - valueRange['pouchl'][0] + 1)) + valueRange['pouchl'][0]));
    }

    fillTestInput('numflowers', String(Math.floor(Math.random() * 5) + 1));
    fillTestInput('numBuds', String(Math.floor(Math.random() * 3)));
    fillTestInput('numInfloresecnes', String(Math.floor(Math.random() * 2) + 1));
    fillTestInput('infloLength', String(Math.floor(Math.random() * 30) + 10));
    
    fillTestInput('description', 'Test plant description for automated testing.');
    
    console.log('✅ Test data filled! Ready to submit.');
    
    // Automatically submit after filling (optional)
    // setTimeout(() => submitForm(), 1000);
}