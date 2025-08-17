// const {  response  } = require("express");

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
    
        fetch('http://localhost:3000/formSubmission', {
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

document.addEventListener('DOMContentLoaded', () => {
  console.log('listener added')
  const btn = document.getElementById('submitBtn');

  if (btn) {
    btn.addEventListener('click', (event) => {
      submitForm(event);
    });
  }

  const testBtn = document.getElementById("testBtn")
  if (testBtn) {
    testBtn.addEventListener('click', (event) => {
      placeholderData(event)
    })
  }
});

function validateSubmission () {
    
}

function emptyNA() {
    // TODO: Put 
}

function placeholderData() {
  /* Set dummy data to test form submissions */
  document.getElementById("eventTitle").value = "testEvent"
  document.getElementById("eventDate").value = "2025-05-08"
  document.getElementById("genus").value = "testGenus"
  document.getElementById("Hybrid/species").value = "PlantA/PlantB"
  document.getElementById("clonalName").value = "Clonal Name"
  document.getElementById("crossName").value = "Cross Name"
  document.getElementById("exhibitor").value = "Test Exhibitor"
  document.getElementById("photographer").value = "Test Photographer"
  // TODO: Add test photo to send over
  document.getElementById("NS").value = 1.0
  document.getElementById("NSV").value = 2.0
  document.getElementById("DSW").value = 3.0
  document.getElementById("DSL").value = 4.0
  document.getElementById("PETW").value = 5.0
  document.getElementById("PETL").value = 6.0
  // Set to Pounch and Synsepal radio button
  let radioBtn = document.getElementById("Pouch&Synsepal")
  radioBtn.checked = true;

  document.getElementById("lsl").value = 1.0
  document.getElementById("lsw").value = 1.0
  document.getElementById("pchw").value = 1.0
  document.getElementById("synsl").value = 1.0

  // Continue rest of form
  document.getElementById("numflowers").value = 1
  document.getElementById("numBuds").value = 1
  document.getElementById("numInfloresecnes").value = 1
  document.getElementById("infloLength").value = 1
  document.getElementById("height").value = 1
  document.getElementById("width").value = 1
  document.getElementById("description").value = "This is a test description"

  alert("Test fields added");
}