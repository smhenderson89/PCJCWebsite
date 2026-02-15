// function submitForm() {
//     let form = document.getElementById("submissionForm");
    
//     let awardType = document.getElementById("awardType").value
//     let awardNotFound = document.getElementById("awardTypeNotFound").value
//     let awardValue = document.getElementById("awardValue").value;

//     console.log(`${awardType}, ${awardNotFound}, ${awardValue}`)
// }

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
    formValidateExhibtor();
    formValidateAwardType();
    formValidateAwardValueAndNumber();

    // If any fields are invalid, show alert and return false to prevent form submission
    if (document.querySelectorAll('.is-invalid').length > 0) {
        // alert('Please correct the highlighted fields before submitting the form.');
        return false;
    }

    // TODO: Add additional form validation functions as needed and call them here
    // Check awardNumber doesn't conflict with existing award numbers in the database (fetch existing award numbers from server and compare)

    return true; // Form is valid
}

function formValidateExhibtor() {
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
    if (newExhibitorCheck.checked && newExhibitorInput.value.trim()) {
        newExhibitorCheck.classList.add('is-valid'); // Mark checkbox as valid
        newExhibitorInput.classList.add('is-valid'); // Mark input as valid
    } else if (newExhibitorCheck.checked && !newExhibitorInput.value.trim()) { // If checkbox is checked but input is empty
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
    
        
        // Check if award number doesn't conflict with existing award numbers in the database 
        // (TODO: implement this logic by fetching existing award numbers from the server and comparing)

        // Check if award number has atleast 8 digits
        let valueString = awardNumber.value.toString();
        
        // TOOD: Work on number validation, this doesn't seem to be working properly, 
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