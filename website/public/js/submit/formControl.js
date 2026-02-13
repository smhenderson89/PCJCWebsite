// Listners for form control elements of /submit form

// TODO: Form control for verifying form input before submission 

// Submit form control Javascript

// Add event listener for new exhibitor checkbox
document.getElementById('newExhibitorCheck').addEventListener('change', function() {

    // If checked, enable the new exhibitor input field; otherwise, disable it
    const newExhibitorInput = document.getElementById('newExhibitorNameInput');
    newExhibitorInput.disabled = !this.checked;
    if (!this.checked) {
        newExhibitorInput.value = '';
        console.log('New exhibitor checkbox unchecked - input field disabled and cleared');
    }
});

// Add event listener for new award type checkbox
document.getElementById('newAwardTypeCheck').addEventListener('change', function() {

    // If checked, enable the new award type input field; otherwise, disable it
    const newAwardTypeInput = document.getElementById('newAwardTypeInput');
    newAwardTypeInput.disabled = !this.checked;
    if (!this.checked) {
        newAwardTypeInput.value = '';
    }
});

// Add event listener for new event checkbox
document.getElementById('newEventCheck').addEventListener('change', function() {

    // If checked, enable the new event input field; otherwise, disable it
    const newEventInput = document.getElementById('newEventInput');
    newEventInput.disabled = !this.checked;
    if (!this.checked) {
        newEventInput.value = '';
    }
});

// Add event listener for new photographer checkbox
document.getElementById('newPhotographerCheck').addEventListener('change', function() {

    // If checked, enable the new photographer input field; otherwise, disable it
    const newPhotographerInput = document.getElementById('newPhotographerInput');
    newPhotographerInput.disabled = !this.checked;
    if (!this.checked) {
        newPhotographerInput.value = '';
    }
});