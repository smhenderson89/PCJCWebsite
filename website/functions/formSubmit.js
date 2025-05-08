// import { response } from "express";

function submitForm() {

    console.log('button clicked')
    // event.preventDefault() // Prevent default form submission

    let form = document.getElementById("submissionForm");
    
    let awardType = document.getElementById("awardType").value
    let awardNotFound = document.getElementById("awardTypeNotFound").value
    let awardValue = document.getElementById("awardValue").value;

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
