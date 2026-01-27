// Submit page functionality

// Load exhibitors when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadExhibitors();
    loadAwardTypes();
});

async function loadExhibitors() {
    try {
        const response = await fetch('/api/exhibitors');
        const responseData = await response.json();

        console.log('API Response:', responseData);
        
        // Extract exhibitors from the data property
        const exhibitors = responseData.data;
        
        const exhibitorSelect = document.getElementById('exhibitorSelect');
        
        // Clear existing options except the placeholder
        exhibitorSelect.innerHTML = '<option value="" disabled selected>Select Exhibitor</option>';
        
        // Add each exhibitor as an option
        exhibitors.forEach(exhibitor => {
            const option = document.createElement('option');
            option.value = exhibitor;
            option.textContent = exhibitor;
            exhibitorSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading exhibitors:', error);
        // Optionally show user-friendly error message
        const exhibitorSelect = document.getElementById('exhibitorSelect');
        exhibitorSelect.innerHTML = '<option value="" disabled selected>Error loading exhibitors</option>';
    }
}

// Load award types when page loads
async function loadAwardTypes() {
    try {
        const response = await fetch('/api/award-types');
        const responseData = await response.json();

        console.log('API Response:', responseData);
        
        // Extract award types from the data property
        const awardTypes = responseData.data;
        
        const awardTypeSelect = document.getElementById('awardSelect');
        
        // Clear existing options except the placeholder
        awardTypeSelect.innerHTML = '<option value="" disabled selected>Select Award</option>';
        
        // Add each award type as an option
        awardTypes.forEach(awardType => {
            const option = document.createElement('option');
            option.value = awardType;
            option.textContent = awardType;
            awardTypeSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading award types:', error);
        // Optionally show user-friendly error message
        const awardTypeSelect = document.getElementById('awardSelect');
        awardTypeSelect.innerHTML = '<option value="" disabled selected>Error loading award types</option>';
    }
}