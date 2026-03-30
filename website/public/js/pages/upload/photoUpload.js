/* Grab photo from user upload */

// Confirm user wants to upload the photo before submitting the form
document.getElementById('submitBtn').addEventListener('click', function(event) {
    event.preventDefault(); // Prevent the default form submission

    const confirmUpload = confirm('Are you sure you want to upload this photo?');
    if (confirmUpload) {
        document.getElementById('photoUploadForm').submit(); // Submit the form if user confirms
    }
});

function processUplodedPhoto() {
    /* 

        - Processing Photo
    1. Check file size and display warning if above limit (e.g. 5MB)
    2. Display preview of photo on page
    3. Confirm with user before uploading
    4. Submit form and upload photo to server
    5. Server renames photo to a standardized format (e.g. awardID.jpg) and saves it in the correct location
    6. Server creates thumbnails for new photos
    7. Server runs check on new thumbnails to make sure they are correct and not corrupted
    8. Server update database to associate the new photo with the correct award based on the award ID selected by the user in the dropdown menu
    9. Server returns success message to user and updates the page to show the new photo
    
    */
}