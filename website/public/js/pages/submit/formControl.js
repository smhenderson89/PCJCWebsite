/* Event Listeners for Form Control */

// Global values
let measurementValues = {}; // For saving information for measurement before erased with N/A option

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

/* Plant Measurement Type event listeners */
// Natural spread N/A checkbox event listener

document.getElementById('nsNACheck').addEventListener('change', function() {
    if (document.getElementById('nsNACheck').checked) {
        // If checked, disable all natural spread input fields and clear their values
        document.getElementById('NSinput').disabled = true;
        document.getElementById('NSinput').value = '';
    } else {
        // If unchecked, enable all natural spread input fields
        document.getElementById('NSinput').disabled = false;
    }
});

document.getElementById('nsvNACheck').addEventListener('change', function() {
    if (document.getElementById('nsvNACheck').checked) {
        // If checked, disable all natural spread input fields and clear their values
        document.getElementById('NSVinput').disabled = true;
        document.getElementById('NSVinput').value = '';
    } else {
        // If unchecked, enable all natural spread input fields
        document.getElementById('NSVinput').disabled = false;
    }
});

document.getElementById('dswNACheck').addEventListener('change', function() {
    if (document.getElementById('dswNACheck').checked) {
        // If checked, disable all natural spread input fields and clear their values
        document.getElementById('DSWinput').disabled = true;
        document.getElementById('DSWinput').value = '';
    } else {
        // If unchecked, enable all natural spread input fields
        document.getElementById('DSWinput').disabled = false;
    }
});

document.getElementById('dslNACheck').addEventListener('change', function() {
    if (document.getElementById('dslNACheck').checked) {
        // If checked, disable all natural spread input fields and clear their values
        document.getElementById('DSLinput').disabled = true;
        document.getElementById('DSLinput').value = '';
    } else {
        // If unchecked, enable all natural spread input fields
        document.getElementById('DSLinput').disabled = false;
    }
});

document.getElementById('petwNACheck').addEventListener('change', function() {
    if (document.getElementById('petwNACheck').checked) {
        // If checked, disable all natural spread input fields and clear their values
        document.getElementById('PETWinput').disabled = true;
        document.getElementById('PETWinput').value = '';
    } else {
        // If unchecked, enable all natural spread input fields
        document.getElementById('PETWinput').disabled = false;
    }
});

document.getElementById('petlNACheck').addEventListener('change', function() {
    if (document.getElementById('petlNACheck').checked) {
        // If checked, disable all natural spread input fields and clear their values
        document.getElementById('PETLinput').disabled = true;
        document.getElementById('PETLinput').value = '';
    } else {
        // If unchecked, enable all natural spread input fields
        document.getElementById('PETLinput').disabled = false;
    }
});


// Measurement type dropdown listener
const measurementSelect = document.getElementById('measurementsSelect');
const lipLateralGroup = document.getElementById('lipLateralGroup');
const pouchSynsepalGroup = document.getElementById('pouchSynsepalGroup');
const otherMeasurementsCheckGroup = document.getElementById('otherMeasurementsCheckGroup'); // Only show the "Display Other N/A?" checkbox for the "Other" measurement type

function updateMeasurementGroups(selectedValue) {
    if (selectedValue === 'lipLateral') {
        lipLateralGroup.style.display = 'block';
        pouchSynsepalGroup.style.display = 'none';
        otherMeasurementsCheckGroup.style.display = 'none';

    } else if (selectedValue === 'pouchSynsepal') {
        lipLateralGroup.style.display = 'none';
        pouchSynsepalGroup.style.display = 'block';
        otherMeasurementsCheckGroup.style.display = 'none';

    } else if (selectedValue === 'other') {
        lipLateralGroup.style.display = 'block';
        pouchSynsepalGroup.style.display = 'block';
        otherMeasurementsCheckGroup.style.display = 'block';
    } else {
        lipLateralGroup.style.display = 'none';
        pouchSynsepalGroup.style.display = 'none';
        otherMeasurementsCheckGroup.style.display = 'none';
    }
}

measurementSelect.addEventListener('change', function() {
    updateMeasurementGroups(this.value);
});

// Display Other N/A? checkbox listener
// If the "Display Other N/A?" checkbox is checked, show the N/A checkboxes for all measurement types; 

function checkDisplayOtherNA() {
    const displayOtherNA = document.getElementById('displayOtherMeasurementsCheck').checked;

    // List of all measurements to disable if "Display Other N/A?" is checked
    let measurementsToToggle = ["NSinput","NSVinput","DSWinput","DSLinput","PETWinput","PETLinput",
                                "lsw",'lsl','lipw','lipl',
                                'synsw','synsl','pouchw','pouchl',
                                'numflowers','numBuds','numInfloresecnes'];

    // For each text box, disable it and clear its value if "Display Other N/A?" is checked; otherwise, enable it
    measurementsToToggle.forEach(measurement => {
        const inputElement = document.getElementById(`${measurement}`);
        if (inputElement) {
            if (displayOtherNA) {
                // Save the current value before setting to N/A
                measurementValues[measurement] = inputElement.value;
                inputElement.value = 'N/A';
            } else {
                // Restore the saved value when unchecked
                inputElement.value = measurementValues[measurement] || '';
            }
            inputElement.disabled = displayOtherNA;

        }
    });
}

document.getElementById('displayOtherMeasurementsCheck').addEventListener('change', checkDisplayOtherNA);

// Initial call to set the correct visibility of N/A checkboxes on page load
checkDisplayOtherNA();

// Ensure correct section visibility on initial page load
updateMeasurementGroups(measurementSelect.value);


