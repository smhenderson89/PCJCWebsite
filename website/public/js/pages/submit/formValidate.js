// TODO: Grab values from form and submit to database, updating the server via an API endpoint.

/* Event listener for form submission */

// Wait for DOM to load before adding event listeners
document.addEventListener('DOMContentLoaded', function() {
    const submitBtn = document.getElementById('submitBtn');
    const testBtn = document.getElementById('testBtn');
    
    if (submitBtn) {
        submitBtn.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent default button behavior
            submitForm();
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

function submitForm() {
    const form = document.querySelector('form'); // Get the form element
    
    if (!form) {
        console.error('Form not found');
        return;
    }

    // Check form validity before submission
    if(!checkFormValidity()) {
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


}

// Function to reset validation state of a field
function resetValidation(fieldID) {
    const field = document.getElementById(fieldID);
    field.classList.remove('is-valid', 'is-invalid');
}

/* Function to verify validiation, trigger bootstarp CSS valid/invalid for sumbit.ejs
Returns false if form is invalid, true if form is valid */

function checkFormValidity() {

    let invalidCounts = 0; // Number of invalid fields, used to determine overall form validity

    // Check each formValidate function and increment invalidCounts if any field is invalid
    formValidateExhibitor();
    formValidateAwardType();
    formValidateAwardValueAndNumber();
    formValidateEvent();
    formValidateEventCalendarDate();
    formValidateGenus();
    formValidateHybridSpecies();
    formValidateClonalName();
    formValidateCrossType();
    
    formValidatePhotographer();
    formValidateDescription();

    // If any fields are invalid, show alert and return false to prevent form submission
    if (document.querySelectorAll('.is-invalid').length > 0) {
        // alert('Please correct the highlighted fields before submitting the form.');
        return false;
    }

    /* TODO: Double check submissions against existing database entries to prevent duplicates 
    (e.g. if new exhibitor name already exists in database, 
    show error message and prevent submission) 
    
    Items to check for user input if selected "new" option:
    - Exhibitor
    - Award Type
    - Award Number
    - Event Name
    - Genus
    - Photographer

    If duplicate entry is found, show error message and prevent form submission. (duplicate-feedback divs in submit.ejs can be used to show specific error messages for each field if duplicate is found, similar to how invalid-feedback divs are used to show error messages for invalid fields)

    */

    
    return true; // Form is valid
}

function formValidateExhibitor() {
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
    } else if (!exhibitorSelect.value && !newExhibitorCheck.checked) { // If dropdown is not selected
        exhibitorSelect.classList.add('is-invalid');
        return false; // Form is invalid if neither dropdown nor new exhibitor is provided
    }

    // Check if new exhibitor input is checked and has a value 
    if (newExhibitorCheck.checked && newExhibitorInput.value.trim().length >= 3) {
        newExhibitorCheck.classList.add('is-valid'); // Mark checkbox as valid
        newExhibitorInput.classList.add('is-valid'); // Mark input as valid
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
    } else if (!awardSelect.value && !newAwardTypeCheck.checked) { // If dropdown is not selected
        awardSelect.classList.add('is-invalid');
        return false; // Form is invalid if neither dropdown nor new award type is provided
    }

    // Check if new award type input is checked and has a value 
    if (newAwardTypeCheck.checked && newAwardTypeInput.value.trim()) {
        newAwardTypeCheck.classList.add('is-valid'); // Mark checkbox as valid
        newAwardTypeInput.classList.add('is-valid'); // Mark input as valid
    } else if (newAwardTypeCheck.checked && !newAwardTypeInput.value.trim()) { // If checkbox is checked but input is empty
        newAwardTypeCheck.classList.add('is-valid'); // Mark checkbox as invalid
        newAwardTypeInput.classList.add('is-invalid'); // Mark input as invalid
        return false;
    }
}

function formValidateAwardValueAndNumber() {
    const awardValue = document.getElementById('awardValue');
    const awardNumber = document.getElementById('awardNumber');
    const nullAwardValueCheck = document.getElementById('nullAwardValueCheck');

    // Clear validation states for award value and number fields before checking
    resetValidation('awardValue');
    resetValidation('awardNumber');
    resetValidation('nullAwardValueCheck');

    // Console log for debugging
    console.log('Award Value:', awardValue.value, 'Null Award Value Check:', nullAwardValueCheck.checked);

    // Check if award value is provided and is a valid number
    if (awardValue.value && !isNaN(awardValue.value) && !nullAwardValueCheck.checked) {
        // Check award value is between 0 and 100 (inclusive)
        if (awardValue.value >= 60 && awardValue.value <= 100) {
            awardValue.classList.add('is-valid'); 
        } else {
            awardValue.classList.add('is-invalid');
            return false;
        }
    } else if (nullAwardValueCheck.checked) {
        nullAwardValueCheck.classList.add('is-valid'); // Mark checkbox  as valid
    } else if (isNaN(awardValue.value) || awardValue.value === "") { // If award value is empty or not a number, mark as invalid (unless N/A checkbox is checked)
        awardValue.classList.add('is-invalid');
        return false;
    }

    // Check if award number is provided and is a valid number
    if (awardNumber.value && !isNaN(awardNumber.value)) {

        // Check if award number has atleast 8 digits
        let valueString = awardNumber.value.toString();
        
        // maybe because the value is being treated as a number instead of a string? Need to investigate further and add more robust validation logic (e.g. regex pattern matching for specific award number formats)
        if (valueString.length >= 8) {
        awardNumber.classList.add('is-valid'); 
        } else {
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
    } else if (!eventSelect.value && !newEventCheck.checked) { // If dropdown is not selected
        eventSelect.classList.add('is-invalid');
        return false; // Form is invalid if neither dropdown nor new event name is provided
    }

    // Check if new event name input is checked and has a value 
    if (newEventCheck.checked && newEventInput.value.trim()) {
        newEventCheck.classList.add('is-valid'); // Mark checkbox as valid
        newEventInput.classList.add('is-valid'); // Mark input as valid
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
    } else if (!genusSelect.value && !genusCheck.checked) { // If dropdown is not selected and checkbox is not checked
        genusSelect.classList.add('is-invalid');
        return false;
    } else if (genusCheck.checked && genusInput.value.trim()) { // If checkbox is checked and input has value
        genusInput.classList.add('is-valid'); 
    } else if (genusCheck.checked && !genusInput.value.trim()) { // If checkbox is checked but input is empty
        genusInput.classList.add('is-invalid'); // Mark input as invalid
        return false;
    } else {
        console.log('Genus validation logic needs to be reviewed and updated as needed'); // This else block should never be reached, if it is reached then there is likely a logic error in the validation function that needs to be addressed
    }
}
    
function formValidateHybridSpecies() {
    const speciesInput = document.getElementById('HybridSpeciesInput');

    resetValidation('HybridSpeciesInput');

    // Check if hybrid/species is provided
    if (speciesInput.value && speciesInput.value.trim().length >= 3) { // Check if input is atleast 3 characters
        speciesInput.classList.add('is-valid'); 
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
        clonalNameInput.classList.add('is-valid'); 
    } else if (clonalNACheck.checked) { // If N/A checkbox is checked, mark checkbox as valid
        clonalNACheck.classList.add('is-valid'); 
    } else if (!clonalNameInput.value || clonalNameInput.value.trim().length < 2) { // If clonal name input is empty or less than 2 characters, mark as invalid (unless N/A checkbox is checked)
        clonalNameInput.classList.add('is-invalid'); 
        return false;
    } else {
        console.log('Clonal name validation logic needs to be reviewed and updated as needed');
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
    } else if (selectedCrossType.id == "radioNewSpecies" && crossTypeInput.value.trim().length >= 3) { // If "New Cross" is selected, check if input has value and is atleast 3 characters long
        selectedCrossType.classList.add('is-valid'); // Mark "New Cross" radio button as valid
        crossTypeInput.classList.add('is-valid'); // Mark input as valid
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
    } else if (!photographerSelect.value && !newPhotographerCheck.checked) { // If dropdown is not selected
        photographerSelect.classList.add('is-invalid');
        return false; // Form is invalid if neither dropdown nor new photographer name is provided
    }

    // Check if new photographer name input is checked and has a value 
    if (newPhotographerCheck.checked && newPhotographerInput.value.trim()) {
        newPhotographerCheck.classList.add('is-valid'); // Mark checkbox as valid
        newPhotographerInput.classList.add('is-valid'); // Mark input as valid
    } else if (newPhotographerCheck.checked && !newPhotographerInput.value.trim()) { // If checkbox is checked but input is empty
        newPhotographerCheck.classList.add('is-invalid'); // Mark checkbox as invalid
        newPhotographerInput.classList.add('is-invalid'); // Mark input as invalid
        return false;
    }
}

function formValdiatePlantMeasurements() {
    const heightInput = document.getElementById('heightInput');
    const spreadInput = document.getElementById('spreadInput');

    // Reset validation state for plant measurement fields before checking
    resetValidation('heightInput');
    resetValidation('spreadInput');

}
function formValidateDescription() {
    const descriptionInput = document.getElementById('descriptionBox');

    // Reset validation state for description field before checking
    resetValidation('descriptionBox');

    // Check if description is provided and is at least 10 characters long
    if (descriptionInput.value && descriptionInput.value.trim().length >= 10) {
        descriptionInput.classList.add('is-valid'); // Mark description as valid
    } else {
        descriptionInput.classList.add('is-invalid'); // Mark description as invalid
        return false;
    }
}