// Submit page functionality

// Load exhibitors when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadExhibitors();
    loadAwardTypes();
    loadEventNames();
    checkYear();
    loadPhotographers();
});

async function loadExhibitors() {
    try {
        const response = await fetch('/api/exhibitors');
        const responseData = await response.json();

        // console.log('API Response:', responseData);
        
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

        // console.log('API Response:', responseData);
        
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

// Load event names when page loads
async function loadEventNames() {
    try {
        const response = await fetch('/api/event-names');
        const responseData = await response.json();

        // console.log('API Response:', responseData);
        
        // Extract event names from the data property
        const eventNames = responseData.data;
        
        const eventNameSelect = document.getElementById('eventSelect');
        
        // Clear existing options except the placeholder
        eventNameSelect.innerHTML = '<option value="" disabled selected>Select Event</option>';
        
        // Add each event name as an option
        eventNames.forEach(eventName => {
            const option = document.createElement('option');
            option.value = eventName;
            option.textContent = eventName;
            eventNameSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading event names:', error);
        // Optionally show user-friendly error message
        const eventNameSelect = document.getElementById('eventSelect');
        eventNameSelect.innerHTML = '<option value="" disabled selected>Error loading event names</option>';
    }
}

// Check the year and input as default award number prefix
async function checkYear() {
    const awardNumberInput = document.getElementById('awardNumber');
    const currentYear = new Date().getFullYear();
    awardNumberInput.placeholder = `${currentYear}XXXX`;
}

// Load previous photographers when page loads
async function loadPhotographers() {
    try {
        const response = await fetch('/api/photographers');
        const responseData = await response.json();

        // Remove null or empty string entries from the photographers list
        responseData.data = responseData.data.filter(photographer => photographer && photographer.trim() !== '');
        
        console.log('API Response:', responseData);

        // Extract photographers from the data property
        const photographers = responseData.data;
        
        const photographerSelect = document.getElementById('photographerSelect');
        
        // Clear existing options except the placeholder
        photographerSelect.innerHTML = '<option value="" disabled selected>Select Photographer</option>';
        
        // Add each photographer as an option
        photographers.forEach(photographer => {
            const option = document.createElement('option');
            option.value = photographer;
            option.textContent = photographer;
            photographerSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading photographers:', error);
        // Optionally show user-friendly error message
        const photographerSelect = document.getElementById('photographerSelect');
        photographerSelect.innerHTML = '<option value="" disabled selected>Error loading photographers</option>';
    }
}

