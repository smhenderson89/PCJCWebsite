// import { response } from "express";

function submitForm(event) {

    // event.preventDefault() // Prevent default form submission

    let form = document.getElementById("submissionForm");
    // TODO: Validate all forms before allowing submission
    if (!form.checkValidity()) {
        console.log('Form is invalid');
        form.reportValidity(); // Show native browser messages
    } else {
        const formData = new FormData(form)

        const formObject = Object.fromEntries(formData.entries())
        console.log(formObject);
    
        fetch('http://localhost:3000/submit', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.log('Error: ', error))
    }
}

function radioButtonSwitch() {
    const radioButtons = document.querySelectorAll('input[type="radio"]');
    const pouchGroup = document.getElementById("pouchSynsepalGroup");
    const lipGroup = document.getElementById("lipLateralGroup");
    const hiddenForm = document.getElementById("lipOrSepal");

    radioButtons.forEach(radio => {
        radio.addEventListener('change', () => {
          const id = radio.id
          
          if (id == "Pouch&Synsepal" ) {
            // Modify form element groups
            lipGroup.style.display = "none";
            pouchGroup.style.display = "flex";

            // Change option for hidden menu
            hiddenForm.value = "Pouch&Synsepal";
          } else if (id == "Lip&LateralSepal") {
            // Modify form element groups
            lipGroup.style.display = "flex";
            pouchGroup.style.display = "none"

            // Change option for hidden menu
            hiddenForm.value = "Lip&LateralSepal";
          } else {
            console.log('radio button error')
          }
        });
      });
}

document.addEventListener("DOMContentLoaded", radioButtonSwitch);

function validateSubmission () {
    
}

function emptyNA() {
    // TODO: Put 
}