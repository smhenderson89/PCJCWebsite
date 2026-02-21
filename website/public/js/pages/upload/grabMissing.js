// Load dropdown options for awards missing images when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadMissingImageAwards();
});

async function loadMissingImageAwards() {
    try {
        // First check if the element exists
        const missingImageSelect = document.getElementById('missingAwards');
        
        if (!missingImageSelect) {
            console.error('Element with id "missingAwards" not found');
            return;
        }
        
        const response = await fetch('/api/missing-image');
        const responseData = await response.json();

        // Save information to Session data to prevent needing to make another API call when user selects an award from the dropdown
        sessionStorage.setItem('awardsMissingImage', JSON.stringify(responseData.data));

        // console.log('API Response:', responseData);
        
        // Extract awards missing images from the data property
        const awardsMissingImage = responseData.data;
        
        // Clear existing options except the placeholder
        missingImageSelect.innerHTML = '<option value="" disabled selected>Select Award Missing Image</option>';
        
        // Check if we have data
        if (!awardsMissingImage || awardsMissingImage.length === 0) {
            console.log('No awards missing images found');
            missingImageSelect.innerHTML = '<option value="" disabled selected>No awards missing images</option>';
            return;
        }
        
        // Add each award missing image as an option
        awardsMissingImage.forEach(award => {
            const option = document.createElement('option');
            option.value = award.id; // Assuming each award has a unique ID
            option.textContent = `${award.awardNum} - ${award.exhibitor} (${award.year})`; // Customize display as needed
            missingImageSelect.appendChild(option);
        });
        
        // Enable the select and other controls once loaded
        missingImageSelect.disabled = false;
        const photoInput = document.getElementById('photoInput');
        const submitBtn = document.getElementById('submitBtn');
        
        if (photoInput) photoInput.disabled = false;
        if (submitBtn) submitBtn.disabled = false;
        
    } catch (error) {
        console.error('Error loading awards missing images:', error);
        
        // Check if element exists before trying to set innerHTML
        const missingImageSelect = document.getElementById('missingAwards');
        if (missingImageSelect) {
            missingImageSelect.innerHTML = '<option value="" disabled selected>Error loading awards missing images</option>';
        }
    }
}

// Load details of selected award missing image when selection changes
document.getElementById('missingAwards').addEventListener('change', async function() {
    const awardId = this.value;
    if (!awardId) return;

    try {
        // Retrieve the award details from session storage to avoid another API call
        const awardsMissingImage = JSON.parse(sessionStorage.getItem('awardsMissingImage'));
        const selectedAward = awardsMissingImage.find(award => award.id === parseInt(awardId));
        
        if (!selectedAward) {
            console.error('Selected award not found in session data');
            return;
        }

        // Display details of the award, creating a new div element for each detail of the award and appending it to the awardDetails div
        const awardDetailsElement = document.getElementById('awardDetails');

        // Exclude certain keys from being displayed that are not relevant to the user or would be redundant (like id, photo, etc.)
        const excludedKeys = ['id', 'sourceUrl', 'scrapedDate', 'htmlReference', 'measurementType', 'createdAt', 'updatedAt', 'date_iso', 'thumbnail_jpeg_small', 'thumbnail_jpeg_medium', 'thumbnail_webp_small', 'thumbnail_webp_medium'];

        if (awardDetailsElement) {
            awardDetailsElement.innerHTML = ''; // Clear previous details
            for (const [key, value] of Object.entries(selectedAward)) {
                if (excludedKeys.includes(key)) continue;
                const detailDiv = document.createElement('div');
                detailDiv.textContent = `${key}: ${value}`;
                awardDetailsElement.appendChild(detailDiv);
            }
        }
        
    } catch (error) {
        console.error('Error loading award details from session data:', error);
        
        // Fallback to API call if session data fails
        const response = await fetch(`/api/award/${awardId}`);
        const awardDetails = await response.json();

        const awardDetailsElement = document.getElementById('awardDetails');
        if (awardDetailsElement) {
            awardDetailsElement.innerHTML = ''; // Clear previous details
            for (const [key, value] of Object.entries(awardDetails)) {
                if (excludedKeys.includes(key)) continue;
                const detailDiv = document.createElement('div');
                detailDiv.textContent = `${key}: ${value}`;
                awardDetailsElement.appendChild(detailDiv);
            }
        }
    }
});
