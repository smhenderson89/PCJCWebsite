/**
 * Award Detailed Page Logic
 * Handles loading and displaying detailed information for a specific award
 * URL pattern: /awards/:year/:awardNum
 */

// Initialize page on DOM load
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🔍 Award Detailed Page - Starting initialization...');
  
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
    console.log('🔄 Calling awardsCacheService.getDetailedAwardInfo...');
    
    // Use the cache service to get detailed award info
    const result = await awardsCacheService.getDetailedAwardInfo(urlParams.year, urlParams.awardNum);
    
    console.log('✅ Received response from cache service:', result);
    
    if (result.success) {
      console.log('🎉 SUCCESS! Award data loaded successfully');
      console.log('==========================================');
      console.log('📊 AWARD INFORMATION:');
      console.log('==========================================');
      console.log('🔹 Award Number:', result.data.awardNum);
      console.log('🔹 Award Type:', result.data.award);
      console.log('🔹 Points:', result.data.awardpoints || 'N/A');
      console.log('🔹 Genus:', result.data.genus || 'N/A');
      console.log('🔹 Species:', result.data.species || 'N/A');
      console.log('🔹 Date:', result.data.date || 'N/A');
      console.log('🔹 Location:', result.data.location || 'N/A');
      console.log('🔹 Exhibitor:', result.data.exhibitor || 'N/A');
      console.log('🔹 Photo Path:', result.data.photo || 'N/A');
      console.log('🔹 Data Source:', result.source);
      console.log('==========================================');
      console.log('📋 Full Award Object:', result.data);
      console.log('==========================================');
      
      // Display the award
      displayAward(result.data, result.source);
    } else {
      console.error('❌ Award not found:', result.error);
      console.log('📝 Error details:', result);
      showError(result.error || 'Award not found');
    }
    
  } catch (error) {
    console.error('💥 Error loading award:', error);
    console.log('📝 Error stack:', error.stack);
    showError('Failed to load award details');
  }
});

/**
 * Parse URL parameters from current location
 * Expects URL pattern: /awards/:year/:awardNum
 * @returns {Object} Object with year and awardNum
 */
function parseUrlParams() {
  const path = window.location.pathname;
  const parts = path.split('/').filter(part => part.length > 0);
  
  // Expected: ['awards', 'year', 'awardNum']
  if (parts.length >= 3 && parts[0] === 'awards') {
    return {
      year: parseInt(parts[1], 10),
      awardNum: parts[2]
    };
  }
  
  return { year: null, awardNum: null };
}

/**
 * Display the award information
 * @param {Object} award - The award data object
 * @param {string} source - Data source ('cache' or 'api')
 */
function displayAward(award, source) {
  console.log(`🎨 Displaying award from: ${source}`);
  console.log('🎨 Award object for display:', award);
  
  // Get container for award display
  let container = document.getElementById('award-container');
  
  // If container doesn't exist, create it in the body
  if (!container) {
    console.log('📦 Award container not found, creating one...');
    container = document.createElement('div');
    container.id = 'award-container';
    container.className = 'container mt-4';
    
    // Find a good place to insert it (after any existing content)
    const body = document.body;
    const main = document.querySelector('main') || body;
    main.appendChild(container);
    console.log('📦 Created award container');
  }
  
  console.log('📦 Award container found/created:', container);
  
  // Create comprehensive award display HTML
  const html = `
    <div class="alert alert-success mb-4">
      <h4 class="alert-heading">✅ Award Loaded Successfully!</h4>
      <p class="mb-0">Data loaded from: <strong>${source}</strong> | Award ID: <strong>${award.awardNum}</strong></p>
    </div>
    
    <div class="card shadow">
      <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
        <h2 class="mb-0">🏆 Award #${award.awardNum}</h2>
        <span class="badge bg-light text-dark">Source: ${source}</span>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-8">
            <h3 class="text-primary">${award.award || 'Unknown Award'} ${award.awardpoints ? `(${award.awardpoints} points)` : ''}</h3>
            <h4 class="text-secondary mb-3">${award.genus || 'Unknown'} ${award.species || ''}</h4>
            
            <div class="row mb-3">
              <div class="col-sm-6">
                <p><strong>📅 Date:</strong> ${award.date || award.date_iso || 'Unknown'}</p>
                <p><strong>📍 Location:</strong> ${award.location || 'Unknown'}</p>
              </div>
              <div class="col-sm-6">
                <p><strong>👤 Exhibitor:</strong> ${award.exhibitor || 'Not specified'}</p>
                <p><strong>🆔 Award Number:</strong> ${award.awardNum}</p>
              </div>
            </div>
            
            ${award.description ? `
              <div class="mt-4">
                <h5><strong>📝 Description:</strong></h5>
                <div class="border rounded p-3 bg-light">${award.description}</div>
              </div>
            ` : ''}
            
            <!-- Debug information -->
            <details class="mt-4">
              <summary class="btn btn-outline-secondary btn-sm">🔍 Debug: Show Full Award Object</summary>
              <pre class="mt-2 p-3 bg-dark text-light small rounded" style="max-height: 400px; overflow-y: auto;">${JSON.stringify(award, null, 2)}</pre>
            </details>
          </div>
          
          <div class="col-md-4">
            <div class="text-center">
              ${award.photo ? `
                <img src="${award.photo.replace('database/images/', '/images/')}" 
                     class="img-fluid rounded shadow" 
                     alt="Award ${award.awardNum}"
                     style="max-height: 400px; object-fit: cover;">
                <p class="text-muted mt-2 small">Original Image</p>
              ` : `
                <div class="bg-light rounded p-4 text-muted">
                  <i class="fas fa-image fa-3x mb-3"></i>
                  <p>No image available</p>
                </div>
              `}
              
              <!-- Show thumbnail info if available -->
              ${award.thumbnail_webp_small ? `
                <div class="mt-3">
                  <img src="/thumbnails/webp/small/${award.awardNum}.webp" 
                       class="img-thumbnail" 
                       alt="WebP Thumbnail"
                       style="max-width: 100px;">
                  <p class="text-muted small">WebP Thumbnail Available</p>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  console.log('🎨 Setting container HTML...');
  container.innerHTML = html;
  container.classList.remove('d-none');
  
  console.log('🎨 Award display completed');
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
  console.error('📢 Showing error:', message);
  
  // Create error container if it doesn't exist
  let container = document.getElementById('award-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'award-container';
    container.className = 'container mt-4';
    const main = document.querySelector('main') || document.body;
    main.appendChild(container);
  }
  
  container.innerHTML = `
    <div class="alert alert-danger">
      <h4 class="alert-heading">❌ Error</h4>
      <p class="mb-0">${message}</p>
    </div>
  `;
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