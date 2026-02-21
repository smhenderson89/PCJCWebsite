/* Grab photo from user upload */

// Confirm user wants to upload the photo before submitting the form
document.getElementById('submitBtn').addEventListener('click', function(event) {
    event.preventDefault(); // Prevent the default form submission

    const confirmUpload = confirm('Are you sure you want to upload this photo?');
    if (confirmUpload) {
        document.getElementById('photoUploadForm').submit(); // Submit the form if user confirms
    }
});