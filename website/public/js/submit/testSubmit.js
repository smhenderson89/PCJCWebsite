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
    const testGenera = ['Cattleya', 'Phalaenopsis', 'Dendrobium', 'Oncidium', 'Paphiopedilum'];
    fillTestInput('genus', testGenera[Math.floor(Math.random() * testGenera.length)]);
    
    fillTestInput('Hybrid/species', 'Test hybrid name');
    fillTestInput('clonalName', 'Test Clone');
    fillTestInput('crossName', '(Test Parent 1 x Test Parent 2)');
    
    // Fill measurements with random test values
    fillTestInput('NS', String(Math.floor(Math.random() * 20) + 5));
    fillTestInput('NSV', String(Math.floor(Math.random() * 15) + 5));
    fillTestInput('DSW', String(Math.floor(Math.random() * 8) + 2));
    fillTestInput('DSL', String(Math.floor(Math.random() * 10) + 3));
    fillTestInput('PETW', String(Math.floor(Math.random() * 8) + 2));
    fillTestInput('PETL', String(Math.floor(Math.random() * 10) + 3));

    // Randomly select measurement type and fill corresponding fields
    const measurementOptions = [
        { id: 'Lip&LateralSepalOption', name: 'Lip and Lateral Sepal' },
        { id: 'Pouch&SynsepalOption', name: 'Pouch and Synsepal' },
        { id: 'OtherOption', name: 'Other (Displays)' }
    ];
    const selectedOption = measurementOptions[Math.floor(Math.random() * measurementOptions.length)];
    
    console.log(`🎲 Randomly selected measurement type: ${selectedOption.name}`);
    
    // Use querySelector to handle special characters in ID
    const radioButton = document.querySelector(`input[name="measurements"][id="${selectedOption.id}"]`);
    if (radioButton) {
        // First uncheck all radio buttons in this group
        document.querySelectorAll('input[name="measurements"]').forEach(radio => {
            radio.checked = false;
        });
        
        // Then check the selected one
        radioButton.checked = true;
        console.log(`✅ Radio button selected: ${selectedOption.id}`);
        
        // Trigger change event to update visibility
        const changeEvent = new Event('change', { bubbles: true });
        radioButton.dispatchEvent(changeEvent);
        console.log(`🔄 Change event dispatched`);
    } else {
        console.error(`❌ Could not find radio button with ID: ${selectedOption.id}`);
    }
    
    // Fill measurement fields based on selection  
    if (selectedOption.id === 'Lip&LateralSepalOption') {
        // Lip and Lateral Sepal measurements
        fillTestInput('lsw', String(Math.floor(Math.random() * 8) + 2));
        fillTestInput('lsl', String(Math.floor(Math.random() * 10) + 3));
        fillTestInput('lipw', String(Math.floor(Math.random() * 6) + 2));
        fillTestInput('lipl', String(Math.floor(Math.random() * 8) + 3));
    } else if (selectedOption.id === 'Pouch&SynsepalOption') {
        // Pouch and Synsepal measurements  
        fillTestInput('synsw', String(Math.floor(Math.random() * 12) + 4));
        fillTestInput('synsl', String(Math.floor(Math.random() * 15) + 5));
        fillTestInput('pouchw', String(Math.floor(Math.random() * 8) + 3));
        fillTestInput('pouchl', String(Math.floor(Math.random() * 10) + 4));
    } else if (selectedOption.id === 'OtherOption') {
        // Fill both sets for "Other" option
        fillTestInput('lsw', String(Math.floor(Math.random() * 8) + 2));
        fillTestInput('lsl', String(Math.floor(Math.random() * 10) + 3));
        fillTestInput('lipw', String(Math.floor(Math.random() * 6) + 2));
        fillTestInput('lipl', String(Math.floor(Math.random() * 8) + 3));
        fillTestInput('synsw', String(Math.floor(Math.random() * 12) + 4));
        fillTestInput('synsl', String(Math.floor(Math.random() * 15) + 5));
        fillTestInput('pouchw', String(Math.floor(Math.random() * 8) + 3));
        fillTestInput('pouchl', String(Math.floor(Math.random() * 10) + 4));
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