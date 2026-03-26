// TODO: Grab values from form and submit to database, updating the server via an API endpoint.

/* Event listener for form submission */

// Wait for DOM to load before adding event listeners
document.addEventListener('DOMContentLoaded', function() {
    const submitBtn = document.getElementById('submitBtn');
    const testBtn = document.getElementById('testBtn');
    
    if (submitBtn) {
        submitBtn.addEventListener('click', async function(event) {
            event.preventDefault(); // Prevent default button behavior
            await checkFormValidity();
        });
    }
    
    if (testBtn) {
        testBtn.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent default button behavior
            testSubmit();
        });
    }
});

// Helper function to get value from either dropdown or "new" input field
function getFieldValue(dropdownId, checkboxId, inputId) {
    const checkbox = document.getElementById(checkboxId);
    const dropdown = document.getElementById(dropdownId);
    const input = document.getElementById(inputId);
    
    // If "new" checkbox is checked and input has value, use input
    if (checkbox && checkbox.checked && input && input.value.trim()) {
        return input.value.trim();
    }
    
    // Otherwise, use dropdown selection
    if (dropdown && dropdown.value) {
        return dropdown.value;
    }
    
    return null;
}

async function submitForm() {
    const form = document.querySelector('form'); // Get the form element
    
    if (!form) {
        console.error('Form not found');
        return;
    }

    const formData = new FormData(form);
    
    // Convert FormData to a plain object
    const data = {};
    formData.forEach((value, key) => {
        data[key] = value;
    });
    
    // Handle dropdown vs "new" input logic
    data.exhibitor = getFieldValue('exhibitorSelect', 'newExhibitorCheck', 'newExhibitorNameInput');
    data.awardType = getFieldValue('awardSelect', 'newAwardTypeCheck', 'newAwardTypeInput');
    data.eventName = getFieldValue('eventSelect', 'newEventCheck', 'newEventInput');
    data.photographer = getFieldValue('photographerSelect', 'newPhotographerCheck', 'newPhotographerInput');
    
    console.log('Form Data:', data);
    
    // TODO: Send data to your API endpoint
    try {
        const response = await fetch('/api/submit-award', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const result = await response.json();
        console.log('Submission result:', result);
    } catch (error) {
        console.error('Error submitting form:', error);
    }
    return true;
}

// Function to reset validation state of a field
function resetValidation(fieldID) {
    const field = document.getElementById(fieldID);
    field.classList.remove('is-valid', 'is-invalid');
}

/* Function to verify validiation, trigger bootstarp CSS valid/invalid for sumbit.ejs
Returns false if form is invalid, true if form is valid */

async function checkFormValidity() {

    let numErrors = 0; // Number of invalid fields, used to determine overall form validity
    let failingTest = []; // Array to track which validation tests are failing for debugging purposes

    // Check each formValidate function and increment numErrors if any field is invalid

    const validators = [
        formValidateExhibitor,
        formValidateAwardType,
        formValidateAwardValue,
        formValidateAwardNumber,
        formValidateEvent,
        formValidateEventCalendarDate,
        formValidateGenus,
        formValidateHybridSpecies,
        formValidateClonalName,
        formValidateCrossType,
        formValidateImage,
        formValidatePhotographer,
        formValidatePlantMeasurements,
        formValidateDescription
    ];

    for (const validate of validators) {
        const result = await validate();
        if (!result) {
            numErrors++;
            failingTest.push(validate.name); // Add name of failing test to array for debugging
        }
    }

    if (numErrors === 0) {
        await submitForm(); // If no errors, submit the form
        return true;
    } else {
        console.log('Form validation failed. Failing tests:', failingTest);
        return false;
    }
}

function formValidateExhibitor() {
    console.log('Validating exhibitor...'); // Log for debugging
    // Check Exibitor Logic: either dropdown must be selected or new exhibitor must be filled
    const exhibitorSelect = document.getElementById('exhibitorSelect');
    const newExhibitorCheck = document.getElementById('newExhibitorCheck');
    const newExhibitorInput = document.getElementById('newExhibitorNameInput');

    // Clear validation states for all exhibitor fields before checking
    resetValidation('newExhibitorNameInput');
    resetValidation('newExhibitorCheck');
    resetValidation('exhibitorSelect');

    // Check if select dropdown menu
    if (exhibitorSelect.value && !newExhibitorCheck.checked) {
        exhibitorSelect.classList.add('is-valid'); // Mark dropdown as valid
        return true;
    } else if (!exhibitorSelect.value && !newExhibitorCheck.checked) { // If dropdown is not selected
        exhibitorSelect.classList.add('is-invalid');
        return false; // Form is invalid if neither dropdown nor new exhibitor is provided
    }

    // Check if new exhibitor input is checked and has a value 
    if (newExhibitorCheck.checked && newExhibitorInput.value.trim().length >= 3) {
        newExhibitorCheck.classList.add('is-valid'); // Mark checkbox as valid
        newExhibitorInput.classList.add('is-valid'); // Mark input as valid
        return true;
    } else if (newExhibitorCheck.checked && newExhibitorInput.value.trim().length < 3) { // If checkbox is checked but input is empty or too short
        newExhibitorCheck.classList.add('is-valid'); // Mark checkbox as invalid
        newExhibitorInput.classList.add('is-invalid'); // Mark input as invalid
        return false;
    }
}

function formValidateAwardType() {
    // Similar logic to exhibitor validation, but for award type
    const awardSelect = document.getElementById('awardSelect');
    const newAwardTypeCheck = document.getElementById('newAwardTypeCheck');
    const newAwardTypeInput = document.getElementById('newAwardTypeInput');

    // Clear validation states for all award type fields before checking
    resetValidation('awardSelect');
    resetValidation('newAwardTypeCheck');
    resetValidation('newAwardTypeInput');

    // Check if select dropdown menu
    if (awardSelect.value && !newAwardTypeCheck.checked) {
        awardSelect.classList.add('is-valid'); // Mark dropdown as valid
        return true;
    } else if (!awardSelect.value && !newAwardTypeCheck.checked) { // If dropdown is not selected
        awardSelect.classList.add('is-invalid');
        return false; // Form is invalid if neither dropdown nor new award type is provided
    }

    // Check if new award type input is checked and has a value 
    if (newAwardTypeCheck.checked && newAwardTypeInput.value.trim()) {
        newAwardTypeCheck.classList.add('is-valid'); // Mark checkbox as valid
        newAwardTypeInput.classList.add('is-valid'); // Mark input as valid
        return true;
    } else if (newAwardTypeCheck.checked && !newAwardTypeInput.value.trim()) { // If checkbox is checked but input is empty
        newAwardTypeCheck.classList.add('is-valid'); // Mark checkbox as invalid
        newAwardTypeInput.classList.add('is-invalid'); // Mark input as invalid
        return false;
    }
}

function formValidateAwardValue() {

    const awardValue = document.getElementById('awardValue');
    const nullAwardValueCheck = document.getElementById('nullAwardValueCheck');

    // Clear validation states for award value and number fields before checking
    resetValidation('awardValue');
 
    resetValidation('nullAwardValueCheck');

    // Check if award value is provided and is a valid number
    if (awardValue.value && !isNaN(awardValue.value) && !nullAwardValueCheck.checked) {
        // Check award value is between 75 and 100 (inclusive)
        if (awardValue.value >= 75 && awardValue.value <= 100) {
            awardValue.classList.add('is-valid'); 
            return true;
        } else {
            awardValue.classList.add('is-invalid');
            return false;
        }
    } else if (nullAwardValueCheck.checked) {
        nullAwardValueCheck.classList.add('is-valid'); // Mark checkbox  as valid
        return true;
    } else if (isNaN(awardValue.value) || awardValue.value === "") { // If award value is empty or not a number, mark as invalid (unless N/A checkbox is checked)
        awardValue.classList.add('is-invalid');
       return false;
    } else {
        console.log('Error in logic for formValidateAwardValue()')
        return false;
    }
}

async function formValidateAwardNumber() {

    const awardNumber = document.getElementById('awardNumber');

    // Clear validation states for award number field before checking
    resetValidation('awardNumber');
    // Check if award number is provided and is a valid number
    if (awardNumber.value && !isNaN(awardNumber.value)) {

        // Check if award number has atleast 8 digits
        let valueString = awardNumber.value.toString();
        if (valueString.length != 8) {
            awardNumber.classList.add('is-invalid');
            return false
        }

        // awardYear is first 4 digits of the awardInput
        let awardYear = valueString.substring(0, 4);

        // Check if award number already exists in the database via an API call to the server
        try {
            const response = await fetch(`/api/award-numbers/${awardYear}`);
            const data = await response.json();
            if (data.success) {
                    const existingAwardNumbers = data.data;
                    if (existingAwardNumbers.includes(awardNumber.value)) {
                        awardNumber.classList.add('is-invalid');
                        console.log('Award number already exists:', awardNumber.value); // Log for debugging
                        return false;
                    } else {
                        awardNumber.classList.add('is-valid');
                        console.log(`Award number ${awardNumber.value} unique ✅`); // Log for debugging
                        return true;
                    }
            } else {
                console.error('Error fetching award numbers:', data.error);
                awardNumber.classList.add('is-invalid');
                return false;
            }
        } catch(error) {
            console.error('Error fetching award numbers:', error);
            awardNumber.classList.add('is-invalid');
            return false;
        }
    } else {
        awardNumber.classList.add('is-invalid');
        return false; 
    }
}

function formValidateEvent() {
    // Similar logic to exhibitor validation, but for event name
    const eventSelect = document.getElementById('eventSelect');
    const newEventCheck = document.getElementById('newEventCheck');
    const newEventInput = document.getElementById('newEventInput');

    // Clear validation states for all event name fields before checking
    resetValidation('eventSelect');
    resetValidation('newEventCheck');
    resetValidation('newEventInput');

    // Check if select dropdown menu
    if (eventSelect.value && !newEventCheck.checked) {
        eventSelect.classList.add('is-valid'); // Mark dropdown as valid
        return true;
    } else if (!eventSelect.value && !newEventCheck.checked) { // If dropdown is not selected
        eventSelect.classList.add('is-invalid');
        return false; // Form is invalid if neither dropdown nor new event name is provided
    }

    // Check if new event name input is checked and has a value 
    if (newEventCheck.checked && newEventInput.value.trim()) {
        newEventCheck.classList.add('is-valid'); // Mark checkbox as valid
        newEventInput.classList.add('is-valid'); // Mark input as valid
        return true;
    } else if (newEventCheck.checked && !newEventInput.value.trim()) { // If checkbox is checked but input is empty
        newEventCheck.classList.add('is-invalid'); // Mark checkbox as invalid
        newEventInput.classList.add('is-invalid'); // Mark input as invalid
        return false;
    }    
}

function formValidateEventCalendarDate() {
    const eventDate = document.getElementById('eventDate');

    // Reset validation state for event date field before checking
    resetValidation('eventDate');

    // Check if event date is provided
    if (eventDate.value) {
        eventDate.classList.add('is-valid'); // Mark event date as valid
        return true;
    } else {
        eventDate.classList.add('is-invalid'); // Mark event date as invalid
        return false;
    }
}

function formValidateGenus() {
    const genusSelect = document.getElementById('genusSelect');
    const genusCheck = document.getElementById('newGenusCheck');
    const genusInput = document.getElementById('newGenusInput');

    // Reset validation state for genus field before checking
    resetValidation('genusSelect');
    resetValidation('newGenusCheck');
    resetValidation('newGenusInput');

    // Check if previous genus
    if (genusSelect.value != "" && !genusCheck.checked) { // If dropdown selected
        genusSelect.classList.add('is-valid'); 
        return true;
    } else if (!genusSelect.value && !genusCheck.checked) { // If dropdown is not selected and checkbox is not checked
        genusSelect.classList.add('is-invalid');
        return false;
    } else if (genusCheck.checked && genusInput.value.trim()) { // If checkbox is checked and input has value
        genusInput.classList.add('is-valid'); 
        return true;
    } else if (genusCheck.checked && !genusInput.value.trim()) { // If checkbox is checked but input is empty
        genusInput.classList.add('is-invalid'); // Mark input as invalid
        return false;
    } else {
        console.log('Genus validation logic needs to be reviewed and updated as needed'); // This else block should never be reached, if it is reached then there is likely a logic error in the validation function that needs to be addressed
        return false;
    }
}
    
function formValidateHybridSpecies() {
    const speciesInput = document.getElementById('HybridSpeciesInput');

    resetValidation('HybridSpeciesInput');

    // Check if hybrid/species is provided
    if (speciesInput.value && speciesInput.value.trim().length >= 3) { // Check if input is atleast 3 characters
        speciesInput.classList.add('is-valid'); 
        return true;
    } else if (!speciesInput.value || speciesInput.value.trim().length < 3) { // If input is empty or less than 3 characters, mark as invalid
        speciesInput.classList.add('is-invalid'); 
        return false;
    } else {
        console.log('Hybrid/species validation logic needs to be reviewed and updated as needed');
    }
}

function formValidateClonalName() {
    const clonalNameInput = document.getElementById('clonalName');
    const clonalNACheck = document.getElementById('clonalNACheck');

    // Reset validation state for clonal name field before checking
    resetValidation('clonalName');
    resetValidation('clonalNACheck');

    // Check if clonal name is provided or N/A checkbox is checked
    if (clonalNameInput.value && clonalNameInput.value.trim().length >= 2) { // If clonal name is provided and is atleast 2 characters long, mark as valid
        // console.log('Clonal name provided:', clonalNameInput.value); // Log for debugging
        clonalNameInput.classList.add('is-valid'); 
        return true;
    } else if (clonalNACheck.checked) { // If N/A checkbox is checked, mark checkbox as valid
        clonalNACheck.classList.add('is-valid'); 
        return true;
    } else if (!clonalNameInput.value || clonalNameInput.value.trim().length < 2) { // If clonal name input is empty or less than 2 characters, mark as invalid (unless N/A checkbox is checked)
        clonalNameInput.classList.add('is-invalid'); 
        return false;
    } else {
        console.log('Clonal name validation logic needs to be reviewed and updated as needed');
        return false;
    }
}

function formValidateCrossType() {
    const crossTypeRadios = document.getElementsByName('radioCross');
    const crossTypeInput = document.getElementById('NewcrossName');

    // Reset validation state for cross type radio buttons before checking
    crossTypeRadios.forEach(radio => resetValidation(radio.id));
    resetValidation('NewcrossName');

    // Check if any cross type radio button is selected
    const selectedCrossType = Array.from(crossTypeRadios).find(radio => radio.checked);
    
    if (selectedCrossType.id == "radioSpecies" || selectedCrossType.id == "radioNA") {
        selectedCrossType.classList.add('is-valid'); // Mark selected radio button as valid
        return true;
    } else if (selectedCrossType.id == "radioNewSpecies" && crossTypeInput.value.trim().length >= 3) { // If "New Cross" is selected, check if input has value and is atleast 3 characters long
        selectedCrossType.classList.add('is-valid'); // Mark "New Cross" radio button as valid
        crossTypeInput.classList.add('is-valid'); // Mark input as valid
        return true;
    } else if (selectedCrossType.id == "radioNewSpecies" && (!crossTypeInput.value || crossTypeInput.value.trim().length < 3)) { // If "New Cross" is selected but input is empty or less than 3 characters, mark as invalid
        selectedCrossType.classList.add('is-invalid'); // Mark "New Cross" radio button as invalid
        crossTypeInput.classList.add('is-invalid'); // Mark input as invalid
        return false;
    } else if (!selectedCrossType) { // If no radio button is selected, mark all radio buttons as invalid
        crossTypeRadios.forEach(radio => radio.classList.add('is-invalid')); // Mark all radio buttons as invalid if none are selected
        return false;
    }
}

function formValidatePhotographer() {
    // Similar logic to exhibitor validation, but for photographer name
    const photographerSelect = document.getElementById('photographerSelect');
    const newPhotographerCheck = document.getElementById('newPhotographerCheck');
    const newPhotographerInput = document.getElementById('newPhotographerInput');

    // Clear validation states for all photographer name fields before checking
    resetValidation('photographerSelect');
    resetValidation('newPhotographerCheck');
    resetValidation('newPhotographerInput');

    // Check if select dropdown menu
    if (photographerSelect.value && !newPhotographerCheck.checked) {
        photographerSelect.classList.add('is-valid'); // Mark dropdown as valid
        return true;
    } else if (!photographerSelect.value && !newPhotographerCheck.checked) { // If dropdown is not selected
        photographerSelect.classList.add('is-invalid');
        return false; // Form is invalid if neither dropdown nor new photographer name is provided
    }

    // Check if new photographer name input is checked and has a value 
    if (newPhotographerCheck.checked && newPhotographerInput.value.trim()) {
        newPhotographerCheck.classList.add('is-valid'); // Mark checkbox as valid
        newPhotographerInput.classList.add('is-valid'); // Mark input as valid
        return true;
    } else if (newPhotographerCheck.checked && !newPhotographerInput.value.trim()) { // If checkbox is checked but input is empty
        newPhotographerCheck.classList.add('is-invalid'); // Mark checkbox as invalid
        newPhotographerInput.classList.add('is-invalid'); // Mark input as invalid
        return false;
    }
}

// Function to validate impage upload field, checking if either a valid image is uploaded or "No Photo" checkbox is checked
function formValidateImage() {
    const imageInput = document.getElementById('awardPhoto');
    const noPhotoCheck = document.getElementById('noPhotoCheck');

     // Reset validation state for image input field before checking
     resetValidation('awardPhoto');
     resetValidation('noPhotoCheck');

    // Check if "No Photo" checkbox is checked
    if (noPhotoCheck.checked) {
        noPhotoCheck.classList.add('is-valid'); // Mark checkbox as valid
        return true; // If "No Photo" is checked, we can consider the image field valid without requiring a file upload
    } else {
        // Check if an image is uploaded
        if (checkImageUpload()) {
            imageInput.classList.add('is-valid'); // Mark image input as valid if a valid image is uploaded
            return true;
        } else {
            imageInput.classList.add('is-invalid'); // Mark image input as invalid if no valid image is uploaded
            return false;
        }
    }
}

// Helper function to check if a valid image file is uploaded
function checkImageUpload() {
    const imageInput = document.getElementById('awardPhoto');

    if (imageInput.files && imageInput.files.length > 0) {
        const file = imageInput.files[0];
        const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
        
        if (validImageTypes.includes(file.type)) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }   
}

function formValidatePlantMeasurements() {
    let errors = 0;

    // Reset Validation state for all plant measurement fields before checking
    const measurementFields = ["NSinput","NSVinput","DSWinput","DSLinput","PETWinput","PETLinput",
                                "lsw",'lsl','lipw','lipl',
                                'synsw','synsl','pouchw','pouchl',
                                'numflowers','numBuds','numInfloresecnes'];
    measurementFields.forEach(fieldID => resetValidation(fieldID));

    // Define consants
    const topfields = ['NSinput','NSVinput','DSWinput','DSLinput','PETWinput','PETLinput'];
    const lipLateralFields = ['lsw','lsl','lipw','lipl'];
    const pouchSynsepalFields = ['synsw','synsl','pouchw','pouchl'];
    const numFields = ['numflowers','numBuds','numInfloresecnes'];

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

    // Check which measurement type is selected (if any) and validate corresponding fields
    let measurementTypeSelected = document.getElementById('measurementsSelect').value;

    if (measurementTypeSelected === 'lipLateral') {
        for (let fieldID of [...topfields, ...lipLateralFields, ...numFields]) {
            const field = document.getElementById(fieldID);
            if (field.value && !isNaN(field.value)) {
                // Validate value is within the defined range for each measurement field
                let [min, max] = valueRange[fieldID];
                if (field.value >= min && field.value <= max) {
                    field.classList.add('is-valid'); 
                } else {
                    field.classList.add('is-invalid');
                    errors++;
                }
            } else {
                field.classList.add('is-invalid');
                errors++;
            }
        }
    } else if (measurementTypeSelected === 'pouchSynsepal') {
        for (let fieldID of [...topfields, ...pouchSynsepalFields, ...numFields]) {
            const field = document.getElementById(fieldID);
            if (field.value && !isNaN(field.value)) {
                // Validate value is within the defined range for each measurement field
                let [min, max] = valueRange[fieldID];
                if (field.value >= min && field.value <= max) {
                    field.classList.add('is-valid'); 
                } else {
                    field.classList.add('is-invalid');
                    errors++;
                }
            } else {
                field.classList.add('is-invalid');
                errors++;
            }
        }
    } else if (measurementTypeSelected === 'other') {
        for(let fieldID of measurementFields) {
            const field = document.getElementById(fieldID);
            if (field.value == 'N/A') {
                field.classList.add('is-valid');
            } else {
                field.classList.add('is-invalid');
                errors++;
            }
        }

    } 

    // Check for errors
    if (errors > 0) {
        return false;
    } else {
        return true;
    }

}
function formValidateDescription() {
    const descriptionInput = document.getElementById('descriptionBox');

    // Reset validation state for description field before checking
    resetValidation('descriptionBox');

    // Check if description is provided and is at least 10 characters long
    if (descriptionInput.value && descriptionInput.value.trim().length >= 10) {
        descriptionInput.classList.add('is-valid'); // Mark description as valid
        return true;
    } else {
        descriptionInput.classList.add('is-invalid'); // Mark description as invalid
        return false;
    }
}