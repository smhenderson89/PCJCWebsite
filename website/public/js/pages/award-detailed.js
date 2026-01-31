/**
 * Award Detailed Page Logic - Clean Version
 * Handles sessionStorage checking and data fetching for award details
 * URL pattern: /award/:year/:awardNum
 */

// Initialize page on DOM load
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🔍 Award Detailed Page - Starting initialization...');
  
  // Clear any corrupted sessionStorage data before starting
  clearCorruptedSessionStorage();
  
  // Parse URL parameters from the current path
  const urlParams = parseUrlParams();
  
  console.log('📍 Parsed URL params:', urlParams);
  console.log('📍 Current URL:', window.location.pathname);
  
  if (!urlParams.year || !urlParams.awardNum) {
    console.error('❌ Invalid URL - missing year or award number');
    console.log('Expected URL format: /award/:year/:awardNum');
    showError('Invalid award URL');
    return;
  }
  
  console.log(`🎯 Loading detailed award page for: Year ${urlParams.year}, Award ${urlParams.awardNum}`);
  
  try {
    // Step 1: Check if sessionStorage already has data for this year
    console.log('🔍 Step 1: Checking sessionStorage for year data...');
    let yearAwardsData = checkSessionStorageForYear(urlParams.year);
    let dataSource = 'cache';
    
    if (yearAwardsData) {
      console.log('✅ Found sessionStorage data for year', urlParams.year);
      console.log('📦 SessionStorage data contains', yearAwardsData.length, 'awards');
    } else {
      // Step 2: No sessionStorage data exists, make API call to get all awards for the year
      console.log('❌ No sessionStorage data found for year', urlParams.year);
      console.log('🔄 Step 2: Making API call to fetch all awards for year...');
      
      yearAwardsData = await fetchAwardsForYear(urlParams.year);
      dataSource = 'api';
      
      if (!yearAwardsData) {
        console.error('❌ Failed to fetch awards data from API');
        showError('Failed to load awards data');
        return;
      }
      
      console.log('✅ Fetched', yearAwardsData.length, 'awards from API');
    }
    
    // Step 3: Find the specific award in the year's data
    console.log('🔍 Step 3: Looking for award', urlParams.awardNum, 'in year data...');
    const specificAward = findAwardInYearData(yearAwardsData, urlParams.awardNum);
    
    if (specificAward) {
      console.log('🎉 SUCCESS! Found award data');
    //   console.log('==========================================');
    //   console.log('📊 AWARD INFORMATION:');
    //   console.log('==========================================');
    //   console.log('🔹 Award Number:', specificAward.awardNum);
    //   console.log('🔹 Award Type:', specificAward.award);
    //   console.log('🔹 Points:', specificAward.awardpoints || 'N/A');
    //   console.log('🔹 Genus:', specificAward.genus || 'N/A');
    //   console.log('🔹 Species:', specificAward.species || 'N/A');
    //   console.log('🔹 Date:', specificAward.date || 'N/A');
    //   console.log('🔹 Location:', specificAward.location || 'N/A');
    //   console.log('🔹 Exhibitor:', specificAward.exhibitor || 'N/A');
    //   console.log('🔹 Photo Path:', specificAward.photo || 'N/A');
    //   console.log('🔹 Data Source:', dataSource);
    //   console.log('==========================================');
    //   console.log('📋 Full Award Object:', specificAward);
    //   console.log('==========================================');
      
      // Populate the EJS template with the award data
      populateAwardTemplate(specificAward, dataSource);
    } else {
      console.error('❌ Award', urlParams.awardNum, 'not found in year', urlParams.year, 'data');
      console.log('📝 Available awards in year data:', yearAwardsData.map(a => a.awardNum));
      showError(`Award ${urlParams.awardNum} not found for year ${urlParams.year}`);
    }
    
  } catch (error) {
    console.error('💥 Error loading award:', error);
    console.log('📝 Error stack:', error.stack);
    showError('Failed to load award details');
  }
});

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

/**
 * Clear any corrupted sessionStorage data for awards
 */
function clearCorruptedSessionStorage() {
  console.log('🧹 Checking for corrupted sessionStorage data...');
  
  const keysToCheck = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && key.startsWith('awards_')) {
      keysToCheck.push(key);
    }
  }
  
  keysToCheck.forEach(key => {
    try {
      const data = sessionStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        
        // Check if it's corrupted (missing data or timestamp)
        if (!parsed.timestamp || !parsed.data || !Array.isArray(parsed.data)) {
          console.log(`🗑️ Removing corrupted sessionStorage key: ${key}`);
          sessionStorage.removeItem(key);
        } else {
          console.log(`✅ SessionStorage key ${key} is valid (${parsed.data.length} awards)`);
        }
      }
    } catch (error) {
      console.log(`🗑️ Removing malformed sessionStorage key: ${key}`);
      sessionStorage.removeItem(key);
    }
  });
}

/**
 * Step 1: Check sessionStorage for existing year data
 * @param {number} year - The year to check for
 * @returns {Array|null} Awards data from sessionStorage or null if not found
 */
function checkSessionStorageForYear(year) {
  console.log('🔍 Checking sessionStorage for year:', year);
  
  const cacheKey = `awards_${year}`;
  const cachedData = sessionStorage.getItem(cacheKey);
  
  if (!cachedData) {
    console.log('❌ No sessionStorage data found for key:', cacheKey);
    return null;
  }
  
  try {
    const parsedData = JSON.parse(cachedData);
    console.log('✅ Found sessionStorage data structure:', Object.keys(parsedData));
    console.log('📊 Raw sessionStorage data:', parsedData);
    
    // Check if data has the correct structure
    if (!parsedData.timestamp) {
      console.log('⚠️ SessionStorage data missing timestamp, removing corrupted data');
      sessionStorage.removeItem(cacheKey);
      return null;
    }
    
    if (!parsedData.data) {
      console.log('⚠️ SessionStorage data missing data array, removing corrupted data');
      sessionStorage.removeItem(cacheKey);
      return null;
    }
    
    if (!Array.isArray(parsedData.data)) {
      console.log('⚠️ SessionStorage data.data is not an array, removing corrupted data');
      sessionStorage.removeItem(cacheKey);
      return null;
    }
    
    // Check if data is still valid (not expired)
    const now = Date.now();
    const cacheAge = now - parsedData.timestamp;
    const maxAge = 60 * 60 * 1000; // 1 hour in milliseconds
    
    if (cacheAge < maxAge) {
      console.log('✅ SessionStorage data is still valid (age:', Math.round(cacheAge / 60000), 'minutes)');
      console.log('📦 Returning', parsedData.data.length, 'awards from sessionStorage');
      return parsedData.data;
    } else {
      console.log('⚠️ SessionStorage data is expired (age:', Math.round(cacheAge / 60000), 'minutes)');
      sessionStorage.removeItem(cacheKey);
      return null;
    }
  } catch (error) {
    console.error('❌ Error parsing sessionStorage data:', error);
    console.log('🗑️ Removing corrupted sessionStorage data');
    sessionStorage.removeItem(cacheKey);
    return null;
  }
}

/**
 * Step 2: Fetch awards data from API for the specified year
 * @param {number} year - The year to fetch awards for
 * @returns {Array|null} Awards data from API or null if failed
 */
async function fetchAwardsForYear(year) {
  console.log('🔄 Fetching awards from API for year:', year);
  
  try {
    const apiUrl = `/api/awards/${year}`;
    console.log('📡 Making API request to:', apiUrl);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      console.error('❌ API response not OK:', response.status, response.statusText);
      const responseText = await response.text();
      console.error('📄 Response body:', responseText.substring(0, 200));
      return null;
    }
    
    const awardsData = await response.json();
    
    // Validate the API response
    if (!Array.isArray(awardsData)) {
      console.error('❌ API response is not an array:', typeof awardsData);
      return null;
    }
    
    console.log('✅ API response received:', awardsData.length, 'awards');
    
    // Log a sample award for debugging
    if (awardsData.length > 0) {
      console.log('📋 Sample award structure:', {
        awardNum: awardsData[0].awardNum,
        award: awardsData[0].award,
        genus: awardsData[0].genus,
        hasPhoto: !!awardsData[0].photo
      });
    }
    
    // Store in sessionStorage for future use
    const cacheKey = `awards_${year}`;
    const cacheData = {
      timestamp: Date.now(),
      data: awardsData
    };
    
    console.log('💾 Preparing to save to sessionStorage with key:', cacheKey);
    console.log('📊 Cache data structure:', {
      timestamp: cacheData.timestamp,
      dataLength: cacheData.data.length,
      dataType: typeof cacheData.data
    });
    
    // Clear any existing corrupted data first
    sessionStorage.removeItem(cacheKey);
    
    // Save the new data
    sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
    console.log('✅ Successfully saved awards data to sessionStorage');
    
    // Verify the save worked correctly
    const verification = sessionStorage.getItem(cacheKey);
    if (verification) {
      const verified = JSON.parse(verification);
      console.log('✓ Verification: sessionStorage contains', verified.data?.length || 0, 'awards');
    }
    
    return awardsData;
  } catch (error) {
    console.error('❌ Error fetching awards from API:', error);
    console.error('📝 Error details:', error.message);
    return null;
  }
}

/**
 * Step 3: Find specific award in the year's awards data
 * @param {Array} awardsData - Array of awards for the year
 * @param {string} awardNum - The award number to find
 * @returns {Object|null} The specific award object or null if not found
 */
function findAwardInYearData(awardsData, awardNum) {
  console.log('🔍 Looking for award', awardNum, 'in', awardsData.length, 'awards');
  
  // Find the award by awardNum (could be string or number comparison)
  const award = awardsData.find(award => {
    return award.awardNum === awardNum || award.awardNum === parseInt(awardNum, 10);
  });
  
  if (award) {
    console.log('✅ Found award:', award.awardNum);
    return award;
  } else {
    console.log('❌ Award not found. Available awardNums:', awardsData.map(a => a.awardNum).slice(0, 10));
    return null;
  }
}

/**
 * Populate the EJS template with award data from client-side fetching
 * @param {Object} award - The award data object
 * @param {string} source - Data source ('cache' or 'api')
 */
function populateAwardTemplate(award, source) {
  console.log(`🎨 Populating EJS template with award data from: ${source}`);
  console.log('🎨 Award object for template population:', award);
  
  // Hide any existing loading states
  const loadingElement = document.querySelector('.loading-indicator');
  if (loadingElement) {
    loadingElement.style.display = 'none';
  }
  
  // Send award data to server to populate the template
  // We'll reload the page with the award data as URL parameters
  const currentUrl = new URL(window.location);
  currentUrl.searchParams.set('data', btoa(JSON.stringify(award)));
  currentUrl.searchParams.set('source', source);
  
  console.log('🔄 Reloading page with award data...');
  window.location.href = currentUrl.toString();
}

/**
 * Show error message by redirecting to error state
 * @param {string} message - Error message to display
 */
function showError(message) {
  console.error('📢 Showing error:', message);
  
  // Redirect to show error in EJS template
  const currentUrl = new URL(window.location);
  currentUrl.searchParams.set('error', message);
  window.location.href = currentUrl.toString();
}

/**
 * Debug function to check URL parsing
 * Can be called from browser console: window.debugUrlParams()
 */
function debugUrlParams() {
  const params = parseUrlParams();
  console.log('Parsed URL params:', params);
  return params;
}

// Make debug function globally available
window.debugUrlParams = debugUrlParams;