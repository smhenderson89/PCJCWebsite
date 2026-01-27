// Listners for form control elements of /submit form

// TODO:

// Submit form control Javascript

// Add event listener for new exhibitor checkbox
document.getElementById('newExhibitorCheck').addEventListener('change', function() {

    // If checked, enable the new exhibitor input field; otherwise, disable it
    const newExhibitorInput = document.getElementById('newExhibitorNameInput');
    newExhibitorInput.disabled = !this.checked;
    if (!this.checked) {
        newExhibitorInput.value = '';
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