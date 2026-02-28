/**
 * Award Detailed Page Logic
 * Handles sessionStorage checking and data fetching for award details
 * URL pattern: /award/:year/:awardNum
 */

const DEBUG_AWARD_LINKS =
  new URLSearchParams(window.location.search).get('debugAwardLinks') === '1' ||
  sessionStorage.getItem('debugAwardLinks') === '1';

function logAwardLinkDecision(payload) {
  if (!DEBUG_AWARD_LINKS) return;
  console.log('[award-link-check]', payload);
}

function parseYearAwardsFromCache(year) {
  const cachedData = sessionStorage.getItem(`orchid_awards_${year}`);
  if (!cachedData) return [];

  try {
    const parsedData = JSON.parse(cachedData);
    if (parsedData?.data?.data && Array.isArray(parsedData.data.data)) {
      return parsedData.data.data;
    }
    if (parsedData?.data && Array.isArray(parsedData.data)) {
      return parsedData.data;
    }
  } catch (error) {
    console.error(`Error parsing year cache for ${year}:`, error);
  }

  return [];
}

async function ensureYearCache(year) {
  const existing = parseYearAwardsFromCache(year);
  if (existing.length > 0) {
    return existing;
  }

  if (typeof awardsCacheService?.getAwardsByYear === 'function') {
    try {
      await awardsCacheService.getAwardsByYear(year);
    } catch (error) {
      console.error(`Error creating year cache for ${year}:`, error);
    }
  }

  return parseYearAwardsFromCache(year);
}

function isAwardInYearCache(year, awardNum) {
  const yearAwards = parseYearAwardsFromCache(year);
  return yearAwards.some(award => String(award.awardNum) === String(awardNum));
}

function isAwardInAllNumbersCache(year, awardNum, allAwardNumbers) {
  if (!allAwardNumbers || typeof allAwardNumbers !== 'object') {
    return false;
  }

  const yearKey = String(year);
  const yearAwards = allAwardNumbers[yearKey];
  if (!Array.isArray(yearAwards)) {
    return false;
  }

  return yearAwards.some(cachedAwardNum => String(cachedAwardNum) === String(awardNum));
}

/**
 * Process award description to create links for referenced award numbers
 * @param {string} description - The award description text
 * @param {number|string} currentYear - The current award's year
 * @returns {Promise<string>} Processed description with award number links
 */
async function processAwardDescription(description, currentYear) {
  if (!description) return '';

  const awardRegex = /(#)?(\d{8,})(\.)?/g;
  const referencedYears = new Set();

  description.replace(awardRegex, (match, hashPrefix, awardNum, trailingPeriod, offset, fullText) => {
    const prevChar = offset > 0 ? fullText[offset - 1] : '';
    const nextChar = fullText[offset + match.length] || '';

    if (/\d/.test(prevChar) || /\d/.test(nextChar)) {
      return match;
    }

    const awardYear = parseInt(String(awardNum).slice(0, 4), 10);
    if (!isNaN(awardYear)) {
      referencedYears.add(awardYear);
    }

    return match;
  });

  if (currentYear) {
    const currentYearNum = parseInt(currentYear, 10);
    if (!isNaN(currentYearNum)) {
      referencedYears.add(currentYearNum);
    }
  }

  await Promise.all([...referencedYears].map(year => ensureYearCache(year)));

  let allAwardNumbers = null;
  if (typeof getAllCachedAwardNumbers === 'function') {
    try {
      allAwardNumbers = await getAllCachedAwardNumbers();
    } catch (error) {
      console.error('Error creating all-award-numbers cache:', error);
    }
  }

  return description.replace(awardRegex, (match, hashPrefix, awardNum, trailingPeriod, offset, fullText) => {
    const prevChar = offset > 0 ? fullText[offset - 1] : '';
    const nextChar = fullText[offset + match.length] || '';

    if (/\d/.test(prevChar) || /\d/.test(nextChar)) {
      return match;
    }

    const awardYear = parseInt(String(awardNum).slice(0, 4), 10);
    if (isNaN(awardYear)) {
      logAwardLinkDecision({
        match,
        awardNum,
        status: 'not-linked',
        reason: 'invalid-year'
      });
      return match;
    }

    const isValidInYearCache = isAwardInYearCache(awardYear, awardNum);
    const isValidInAllNumbers = isAwardInAllNumbersCache(awardYear, awardNum, allAwardNumbers);

    if (isValidInYearCache || isValidInAllNumbers) {
      logAwardLinkDecision({
        match,
        awardNum,
        awardYear,
        status: 'linked',
        source: isValidInYearCache ? 'year-cache' : 'all-numbers-cache'
      });
      return `${hashPrefix || ''}<a href="/award/${awardYear}/${awardNum}" class="award-reference-link" data-award="${awardNum}" data-year="${awardYear}">${awardNum}</a>${trailingPeriod || ''}`;
    }

    logAwardLinkDecision({
      match,
      awardNum,
      awardYear,
      status: 'not-linked',
      reason: 'not-found-in-cache'
    });

    return match;
  });
}

/**
 * Show or hide element using CSS classes instead of inline styles
 * @param {string} elementId - ID of element to toggle
 * @param {boolean} show - Whether to show (true) or hide (false) the element
 */
function toggleElementVisibility(elementId, show) {
  const element = document.getElementById(elementId);
  if (element) {
    if (show) {
      element.classList.remove('hidden');
      element.classList.add('visible');
    } else {
      element.classList.remove('visible');
      element.classList.add('hidden');
    }
  } else {
    console.warn(`Element with id '${elementId}' not found`);
  }
}

async function processExistingDescription() {
  const descriptionElement = document.getElementById('award-description');
  if (!descriptionElement || !descriptionElement.innerHTML.trim()) {
    return;
  }

  const currentYear = document.body?.dataset?.currentYear;
  if (!currentYear) {
    return;
  }

  const processedDescription = await processAwardDescription(descriptionElement.innerHTML, currentYear);
  descriptionElement.innerHTML = processedDescription;
}

// Initialize page on DOM load
document.addEventListener('DOMContentLoaded', async function() {
  const hasServerAward = document.body?.dataset?.hasAward === 'true';
  if (hasServerAward) {
    await processExistingDescription();
    return;
  }

  // Parse URL parameters from the current path
  const urlParams = parseUrlParams();
  
  if (!urlParams.year || !urlParams.awardNum) {
    console.error('❌ Invalid URL - missing year or award number');
    return;
  }

  // Step 1: Check sessionStorage for existing data
  const cacheKey = `orchid_awards_${urlParams.year}`;
  let cachedData = sessionStorage.getItem(cacheKey);
  let foundAward = null;

  if (cachedData) {
    // SessionStorage exists - extract the award
    try {
      const parsedData = JSON.parse(cachedData);
      if (parsedData.data && parsedData.data.data && Array.isArray(parsedData.data.data)) {
        foundAward = parsedData.data.data.find(award => {
          return award.awardNum === urlParams.awardNum || award.awardNum === urlParams.awardNum.toString();
        });
      }
    } catch (error) {
      console.error('Error parsing sessionStorage:', error);
    }
  }

  if (!foundAward) {
    // No sessionStorage or award not found - fetch from API
    try {
      const response = await fetch(`/api/awards/${urlParams.year}`);
      if (response.ok) {
        const apiData = await response.json();
        
        // Store in sessionStorage for future use (matching awards-cache-service format)
        const cacheData = {
          data: apiData,
          timestamp: Date.now(),
          year: urlParams.year
        };
        sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
        
        // Find the specific award in API response
        if (apiData.success && Array.isArray(apiData.data)) {
          foundAward = apiData.data.find(award => {
            return award.awardNum === urlParams.awardNum || award.awardNum === urlParams.awardNum.toString();
          });
        }
      }
    } catch (error) {
      console.error('Error fetching from API:', error);
    }
  }

  if (foundAward) {
    console.log('✅ Found award data:', foundAward);
    await populateAwardData(foundAward, urlParams.year);
  } else {
    console.error('❌ Award not found');
    showErrorState('Award not found', urlParams.year);
  }
});

/**
 * Populate the page with award data
 * @param {Object} award - The award data object
 * @param {number} year - The year for navigation links
 */
async function populateAwardData(award, year) {
  // Hide loading state
  const loadingAlert = document.getElementById('loading-alert');
  if (loadingAlert) loadingAlert.classList.add('hidden');
  
  // Show award content
  const awardContent = document.getElementById('award-content');
  const awardCard = document.getElementById('award-card');
  if (awardContent) awardContent.classList.add('show-block');
  if (awardCard) awardCard.classList.add('show-block');
  
  // Wait a moment for elements to be visible in DOM
  await new Promise(resolve => setTimeout(resolve, 10));
  
  // Helper function to safely set text content
  const safeSetText = (id, text) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = text;
    } else {
      console.warn(`Element with id '${id}' not found`);
    }
  };
  
  // Helper function to safely set element display
  const safeSetDisplay = (id, show) => {
    const element = document.getElementById(id);
    if (element) {
      if (show) {
        element.classList.remove('hidden');
        element.classList.add('show-block');
      } else {
        element.classList.remove('show-block');
        element.classList.add('hidden');
      }
    } else {
      console.warn(`Element with id '${id}' not found`);
    }
  };
  
  // Populate basic award info
  safeSetText('award-number', award.awardNum || 'Unknown');
  safeSetText('breadcrumb-award-num', award.awardNum || 'Unknown');
  
  // Line 1: Build genus species 'clone' display
  let hasGenusSpeciesClone = false;
  if (award.genus) {
    safeSetText('award-genus', award.genus);
    hasGenusSpeciesClone = true;
  }
  if (award.species && award.species !== 'N/A') {
    safeSetText('award-species', ' ' + award.species);
  } else if (award.species === 'N/A') {
    safeSetText('award-species', '');
  }

  if (award.clone && award.clone !== 'N/A') {
    safeSetText('award-clone', ` '${award.clone}'`);
  } else if (award.clone === 'N/A') {
    safeSetText('award-clone', '');
  }
  
  if (hasGenusSpeciesClone) {
    toggleElementVisibility('genus-species-display', true);
  }
  
  // Line 2: Use cross information directly from award.cross
  if (award.cros && award.cros !== 'N/A') {
    toggleElementVisibility('cross-info-display', true);
    const crossInfoDisplay = document.getElementById('cross-info-display');
    if (crossInfoDisplay) {
      const crossInfoEm = crossInfoDisplay.querySelector('em');
      if (crossInfoEm) crossInfoEm.textContent = award.cros;
    }
  } else if (award.cross && award.cross !== 'N/A') {
    // Don't display the cross information if it's just "N/A"
    toggleElementVisibility('cross-info-display', true);
    const crossInfoDisplay = document.getElementById('cross-info-display');
    if (crossInfoDisplay) {
      const crossInfoEm = crossInfoDisplay.querySelector('em');
      if (crossInfoEm) crossInfoEm.textContent = award.cross;
    }
  }
  
  // Line 3: Build award name and points display
  let hasAwardNamePoints = false;
  if (award.award) {
    safeSetText('award-name', award.award);
    hasAwardNamePoints = true;
  }
  if (award.awardpoints && award.awardpoints !== 'N/A') { //     // If awardpoints value is equal to N/A, then don't display it
    safeSetText('award-points', ' ' + award.awardpoints);
    hasAwardNamePoints = true;
  } else {
    safeSetDisplay('award-points', false); // Hide the award points element if we don't have valid points to show
  }
  
  if (hasAwardNamePoints) {
    toggleElementVisibility('award-name-display', true);
  }
  
  // Award details
  safeSetText('award-date', formatDate(award.date || award.date_iso) || 'Unknown');
  safeSetText('award-location', award.location || 'Unknown');
  
  // Handle exhibitor with link
  const exhibitorElement = document.getElementById('award-exhibitor');
  if (exhibitorElement && award.exhibitor && award.exhibitor !== 'Not specified') {
    exhibitorElement.innerHTML = `<a href="/awards/exhibitor/${encodeURIComponent(award.exhibitor)}">${award.exhibitor}</a>`;
  } else if (exhibitorElement) {
    exhibitorElement.textContent = 'Not specified';
  }
  
  safeSetText('award-photographer', award.photographer || 'Not specified');
  
  // Description with award number linking
  if (award.description) {
    const descriptionElement = document.getElementById('award-description');
    if (descriptionElement) {
      const processedDescription = await processAwardDescription(award.description, award.year);
      descriptionElement.innerHTML = processedDescription;
    }
    toggleElementVisibility('description-section', true);
  }
  
  // Photo handling with loading states
  const photoElement = document.getElementById('award-photo');
  const captionElement = document.getElementById('photo-caption');
  const placeholderElement = document.getElementById('image-placeholder');
  
  if (photoElement && placeholderElement) {
    if (award.photo) {
      // Use actual photo - ensure absolute path
      let imagePath = award.photo;
      if (imagePath.startsWith('database/images/')) {
        imagePath = imagePath.replace('database/images/', '/images/');
      } else if (imagePath.startsWith('images/')) {
        imagePath = '/' + imagePath;
      } else if (!imagePath.startsWith('/')) {
        imagePath = '/images/' + imagePath;
      }
      
      // Set up image loading
      photoElement.src = imagePath;
      photoElement.alt = `Award ${award.awardNum}`;
      
      // Handle image load/error events
      photoElement.onload = function() {
        // Image loaded successfully
        placeholderElement.classList.add('hidden');
        photoElement.classList.remove('d-none');
        if (captionElement) captionElement.classList.add('hidden');
      };
      
      photoElement.onerror = function() {
        // Image failed to load, use default
        photoElement.src = '/images/No-Image-Placeholder-med.png';
        photoElement.alt = 'No image available';
        photoElement.classList.add('no-image-placeholder');
        placeholderElement.classList.add('hidden');
        photoElement.classList.remove('d-none');
        if (captionElement) {
          captionElement.classList.add('hidden');
        }
      };
      
    } else {
      // No photo available, use default immediately
      photoElement.src = '/images/No-Image-Placeholder-med.png';
      photoElement.alt = 'No image available';
      photoElement.classList.add('no-image-placeholder');
      placeholderElement.classList.add('hidden');
      photoElement.classList.remove('d-none');
      if (captionElement) {
        captionElement.classList.add('hidden');
      }
    }
  }
  
  // Populate measurements
  populateMeasurements(award);
  populateAdditionalInfo(award);
  
  // Update navigation links safely
  const yearLink = document.getElementById('year-link');
  if (yearLink) {
    yearLink.href = `/awards/${year}`;
    yearLink.textContent = year;
  }
  
  const yearAwardsLink = document.getElementById('year-awards-link');
  if (yearAwardsLink) {
    yearAwardsLink.href = `/awards/${year}`;
    yearAwardsLink.textContent = `View ${year} Awards`;
  }
}

/**
 * Populate measurement data with the new table structure
 * @param {Object} award - The award data object
 */
function populateMeasurements(award) {
  // Define the measurement fields in display order with their labels
  const measurementFields = [
    { field: 'NS', label: 'Natural Spread' },
    { field: 'NSV', label: 'Natural Spread Vertical' },
    { field: 'DSW', label: 'Dorsal Sepal Width' },
    { field: 'DSL', label: 'Dorsal Sepal Length' },
    { field: 'PETW', label: 'Petal Width' },
    { field: 'PETL', label: 'Petal Length' },
    { field: 'LSW', label: 'Lateral Sepal Width' },
    { field: 'LSL', label: 'Lateral Sepal Length' },
    { field: 'LIPW', label: 'Lip Width' },
    { field: 'LIPL', label: 'Lip Length' },
    { field: 'SYNSW', label: 'Synsepal Width' },
    { field: 'SYNSL', label: 'Synsepal Length' },
    { field: 'PCHW', label: 'Pouch Width' },
    { field: 'PCHL', label: 'Pouch Length' }
  ];
  
  let hasMeasurements = false;
  const measurementsToShow = [];
  
  // Check which measurements exist and collect them
  measurementFields.forEach(({ field, label }) => {
    if (award[field] && (award[field] !== "" && award[field] !== null && award[field] !== undefined)) {
      hasMeasurements = true;
      measurementsToShow.push({ field, label, value: award[field] });
    }
  });
  
  // Show measurements section if we have any measurements
  if (hasMeasurements) {
    const measurementsSection = document.getElementById('measurements-section');
    if (measurementsSection) {
      measurementsSection.classList.add('show-block');
      measurementsSection.classList.remove('hidden');
    }
    
    // Find the table body and populate it
    const tableBody = document.querySelector('#measurements-table tbody');
    if (tableBody) {
      // Clear existing content
      tableBody.innerHTML = '';
      
      // Check for different measurement types
      const hasLateralLip = award.LSW || award.LSL || award.LIPW || award.LIPL;
      const hasSynsepalPouch = award.SYNSW || award.SYNSL || award.PCHW || award.PCHL;
      
      // Filter measurements to show based on type logic
      const filteredMeasurements = measurementsToShow.filter(({ field }) => {
        // Only show lateral/lip OR synsepal/pouch, not both
        if ((field.startsWith('SYN') || field.startsWith('PCH')) && hasLateralLip) {
          return false; // Skip synsepal/pouch if we have lateral/lip
        }
        return true;
      });
      
      // Create 4-column rows (2 measurements per row)
      for (let i = 0; i < filteredMeasurements.length; i += 2) {
        const row = document.createElement('tr');
        
        const measurement1 = filteredMeasurements[i];
        const measurement2 = filteredMeasurements[i + 1];
        
        if (measurement2) {
          // Two measurements in this row
          row.innerHTML = `
            <td><strong>${measurement1.label}:</strong></td>
            <td><span id="measurement-${measurement1.field.toLowerCase()}">${measurement1.value}</span></td>
            <td><strong>${measurement2.label}:</strong></td>
            <td><span id="measurement-${measurement2.field.toLowerCase()}">${measurement2.value}</span></td>
          `;
        } else {
          // Only one measurement in this row - span across remaining columns
          row.innerHTML = `
            <td><strong>${measurement1.label}:</strong></td>
            <td><span id="measurement-${measurement1.field.toLowerCase()}">${measurement1.value}</span></td>
            <td></td>
            <td></td>
          `;
        }
        
        tableBody.appendChild(row);
      }
    }
  }
}

/* Populate 1x3 column at bottom of measurement table with additional information 
Use information for numFlowers, NumBuds, and NumInflo
*/

function populateAdditionalInfo(award) {
  console.log(`award.numBuds: ${award.numBuds}, award.numFlowers: ${award.numFlowers}, award.numInflorescences: ${award.numInflorescences}`);
  
  const numBudsElement = document.getElementById('num-buds');
  const numFlowersElement = document.getElementById('num-flowers');
  const numInfloElement = document.getElementById('num-inflorescences');

  const formatCountDisplay = (value) => {
    if (value == null || value === 'null') return '0';
    if (value === 'N/A') return 'N/A';
    return String(value);
  };

  if (numBudsElement) {
    numBudsElement.textContent = formatCountDisplay(award.numBuds);
  }

  if (numInfloElement) {
    numInfloElement.textContent = formatCountDisplay(award.numInflorescences);
  }

  if (numFlowersElement) {
    numFlowersElement.textContent = formatCountDisplay(award.numFlowers);
  }
}

/**
 * Format date for display
 * @param {string} dateString - The date string to format
 * @returns {string} Formatted date or null
 */
function formatDate(dateString) {
  if (!dateString) return null;
  
  try {
    // If it's already a formatted date string, return it
    if (typeof dateString === 'string' && !dateString.includes('T')) {
      return dateString;
    }
    
    // If it's an ISO date, format it
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString();
    }
    
    return dateString;
  } catch (error) {
    return dateString;
  }
}

/**
 * Show error state
 * @param {string} message - Error message
 * @param {number} year - Year for navigation
 */
function showErrorState(message, year) {
  const loadingAlert = document.getElementById('loading-alert');
  const errorAlert = document.getElementById('error-alert');
  const errorMessage = document.getElementById('error-message');
  const yearAwardsLink = document.getElementById('year-awards-link');
  
  if (loadingAlert) loadingAlert.classList.add('hidden');
  if (errorMessage) errorMessage.textContent = message;
  
  if (yearAwardsLink) {
    yearAwardsLink.href = `/awards/${year || ''}`;
    yearAwardsLink.textContent = `View ${year || 'All'} Awards`;
  }
  
  if (errorAlert) errorAlert.classList.add('show-block');
};


/**
 * Parse URL parameters from current location
 * Expects URL pattern: /award/:year/:awardNum
 * @returns {Object} Object with year and awardNum
 */
function parseUrlParams() {
  const path = window.location.pathname;
  const parts = path.split('/').filter(part => part.length > 0);
  
  // Expected: ['award', 'year', 'awardNum']
  if (parts.length >= 3 && parts[0] === 'award') {
    return {
      year: parseInt(parts[1], 10),
      awardNum: parts[2]
    };
  }
  
  return { year: null, awardNum: null };
}