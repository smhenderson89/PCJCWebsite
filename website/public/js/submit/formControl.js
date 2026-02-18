/* Event Listeners for Form Control */

// Exhibitor event listern 
document.getElementById('newExhibitorCheck').addEventListener('change', function() {

    // If checked, enable the new exhibitor input field; otherwise, disable it
    const newExhibitorInput = document.getElementById('newExhibitorNameInput');
    newExhibitorInput.disabled = !this.checked;
    if (!this.checked) {
        newExhibitorInput.value = '';
        document.getElementById('exhibitorSelect').disabled = false;
    } else {
        // Disable the dropdown menu when new exhibitor is checked
        document.getElementById('exhibitorSelect').disabled = true;

        // Reset the dropdown to the placeholder option when new exhibitor is checked
        const exhibitorSelect = document.getElementById('exhibitorSelect');
        exhibitorSelect.value = '';
    }
        // console.log('New exhibitor checkbox unchecked - input field disabled and cleared');
});

// Award type event listener
document.getElementById('newAwardTypeCheck').addEventListener('change', function() {

    // If checked, enable the new award type input field; otherwise, disable it
    const newAwardTypeInput = document.getElementById('newAwardTypeInput');
    newAwardTypeInput.disabled = !this.checked;
    if (!this.checked) {
        newAwardTypeInput.value = '';
        document.getElementById('awardSelect').disabled = false;
    } else {
        // Disable the dropdown menu when new award type is checked
        document.getElementById('awardSelect').disabled = true;

        // Reset the dropdown to the placeholder option when new award type is checked
        const awardTypeSelect = document.getElementById('awardSelect');
        awardTypeSelect.value = '';
    }
});

// Award value N/A checkbox event listener
document.getElementById('nullAwardValueCheck').addEventListener('change', function() {

    // If checked, disable the award value input field and clear its value; otherwise, enable it
    const awardValueInput = document.getElementById('awardValue');
    awardValueInput.disabled = this.checked;
    if (this.checked) {
        awardValueInput.value = '';
    }
});

// New event name checkbox event listener
document.getElementById('newEventCheck').addEventListener('change', function() {

    // If checked, enable the new event input field; otherwise, disable it
    const newEventInput = document.getElementById('newEventInput');
    newEventInput.disabled = !this.checked;
    if (!this.checked) {
        newEventInput.value = '';
        document.getElementById('eventSelect').disabled = false;
    } else {
        // Disable the dropdown menu when new event is checked
        document.getElementById('eventSelect').disabled = true;

        // Reset the dropdown to the placeholder option when new event is checked
        const eventSelect = document.getElementById('eventSelect');
        eventSelect.value = '';
    }
});

// New Genus checkbox event listener
document.getElementById('newGenusCheck').addEventListener('change', function() {

    // If checked, enable the new genus input field; otherwise, disable it
    const newGenusInput = document.getElementById('newGenusInput');
    newGenusInput.disabled = !this.checked;
    if (!this.checked) {
        newGenusInput.value = '';
        document.getElementById('genusSelect').disabled = false;
    } else {
        // Disable the dropdown menu when new genus is checked
        document.getElementById('genusSelect').disabled = true;

        // Reset the dropdown to the placeholder option when new genus is checked
        const genusSelect = document.getElementById('genusSelect');
        genusSelect.value = '';
    }
});

// New Clonal name checkbox event listener
document.getElementById('clonalNACheck').addEventListener('change', function() {

    // If checked, disable the clonal name input field and clear its value; otherwise, enable it
    const clonalNameInput = document.getElementById('clonalName');
    clonalNameInput.disabled = this.checked;
    if (this.checked) {
        clonalNameInput.value = '';
    }
});

// Cross radio button event listeners
// Handle all three radio buttons in the radioCross group
const radioCrossButtons = document.getElementsByName('radioCross');
const newCrossInput = document.getElementById('NewcrossName');

// Set default state - disable the new cross input field
newCrossInput.disabled = true;

radioCrossButtons.forEach(radio => {
    radio.addEventListener('change', function() {
        if (this.checked) {
            
            if (this.id === 'radioNewSpecies') {
                // Enable the new cross input field when "New Cross" is selected
                newCrossInput.disabled = false;
            } else {
                // Disable and clear the new cross input field for other options
                newCrossInput.disabled = true;
                newCrossInput.value = '';
            }
        }
    });
});

// Photographer event listener
document.getElementById('newPhotographerCheck').addEventListener('change', function() {

    // If checked, enable the new photographer input field; otherwise, disable it
    const newPhotographerInput = document.getElementById('newPhotographerInput');
    newPhotographerInput.disabled = !this.checked;
    if (!this.checked) {
        newPhotographerInput.value = '';
        document.getElementById('photographerSelect').disabled = false;
    } else {
        // Disable the dropdown menu when new photographer is checked
        document.getElementById('photographerSelect').disabled = true;

        // Reset the dropdown to the placeholder option when new photographer is checked
        const photographerSelect = document.getElementById('photographerSelect');
        photographerSelect.value = '';
    }
});

// Award Photo event listener
// If No Photo checkbox is checked, disable the photo upload input and clear any selected file; otherwise, enable it
document.getElementById('noPhotoCheck').addEventListener('change', function() {
    const photoUploadInput = document.getElementById('awardPhoto');
    photoUploadInput.disabled = this.checked;
    if (this.checked) {
        photoUploadInput.value = '';
    }
});

// Measurement type event listeners
const measurementRadios = document.getElementsByName('measurements');
measurementRadios.forEach(radio => {
    radio.addEventListener('change', function() {
        // Logic to toggle between measurement options

        if (this.id === 'Lip&LateralSepalOption') {
            document.getElementById('lipLateralGroup').style.display = 'block';
            document.getElementById('pouchSynsepalGroup').style.display = 'none';
        } else if (this.id === 'Pouch&SynsepalOption') {
            document.getElementById('lipLateralGroup').style.display = 'none';
            document.getElementById('pouchSynsepalGroup').style.display = 'block';
        } else if (this.id === 'OtherOption') {
            document.getElementById('lipLateralGroup').style.display = 'block';
            document.getElementById('pouchSynsepalGroup').style.display = 'block';
        }
    });
});


