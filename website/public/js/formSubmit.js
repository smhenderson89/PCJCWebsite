function submitForm() {
    let form = document.getElementById("submissionForm");
    
    let awardType = document.getElementById("awardType").value
    let awardNotFound = document.getElementById("awardTypeNotFound").value
    let awardValue = document.getElementById("awardValue").value;

    console.log(`${awardType}, ${awardNotFound}, ${awardValue}`)


}
