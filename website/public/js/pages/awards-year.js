/**
 * Awards Year Page Logic
 * Handles loading and displaying awards for a specific year with optimized images
 */

// Browser capabilities detection
const browserCapabilities = {
  supportsWebP: false,
  supportsLazyLoading: 'loading' in HTMLImageElement.prototype,
  isHighDPI: window.devicePixelRatio > 1,
  viewportWidth: window.innerWidth
};

// Initialize browser detection on load
document.addEventListener('DOMContentLoaded', async function() {
  // Detect WebP support
  await detectWebPSupport();
  
  // Get year from the page data attribute
  const yearElement = document.getElementById('awards-year-data');
  if (!yearElement) {
    console.error('Year data not found');
    showError('Page configuration error');
    return;
  }
  
  const year = parseInt(yearElement.dataset.year, 10);
  
  try {
    // Use the cache service to get awards
    const response = await awardsCacheService.getAwardsByYear(year);
    
    if (response.success) {
      displayAwards(response.data, year);
      hideLoading();
      
      // Start performance tracking
      trackImageLoadingPerformance();
    } else {
      showError(response.error || 'Failed to load awards');
    }
    
  } catch (error) {
    console.error('Error loading awards:', error);
    showError('Failed to load awards');
  }
});

// Update browser capabilities on viewport change
window.addEventListener('resize', function() {
  browserCapabilities.viewportWidth = window.innerWidth;
});

/**
 * Detect WebP support using a test image
 */
async function detectWebPSupport() {
  return new Promise(resolve => {
    const webP = new Image();
    webP.onload = webP.onerror = function () {
      browserCapabilities.supportsWebP = webP.height === 2;
      console.log('WebP support detected:', browserCapabilities.supportsWebP);
      resolve(browserCapabilities.supportsWebP);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

/**
 * Determine optimal image size based on viewport and usage context
 */
function getOptimalImageSize(context = 'card') {
  const { viewportWidth } = browserCapabilities;
  
  if (context === 'card') {
    // For card displays, use medium on larger screens, small on mobile
    return viewportWidth > 768 ? 'medium' : 'small';
  }
  
  // Default to medium for other contexts
  return 'medium';
}

/**
 * Generate optimized image HTML with loading spinner (CSP-compliant)
 */
function generateOptimizedImageHTML(award, context = 'card', additionalClasses = '') {
  if (!award.photo && (!award.thumbnail_jpeg_small && !award.thumbnail_webp_small)) {
    return ''; // No image available
  }
  
  const size = getOptimalImageSize(context);
  const { supportsWebP, supportsLazyLoading } = browserCapabilities;
  
  // Determine image sources - only use thumbnails if they exist in the database
  let webpSrc = '';
  let jpegSrc = '';
  let fallbackSrc = '';
  let hasThumbnails = false;
  
  // Check if we have thumbnail paths in the database for this award
  if (award[`thumbnail_webp_${size}`] && award[`thumbnail_jpeg_${size}`]) {
    // We have optimized thumbnails
    webpSrc = `/thumbnails/webp/${size}/${award.awardNum}.webp`;
    jpegSrc = `/thumbnails/jpeg/${size}/${award.awardNum}.jpg`;
    hasThumbnails = true;
  } 
  
  // Always have original photo as fallback
  if (award.photo) {
    fallbackSrc = award.photo.replace('database/images/', '/images/');
    if (!hasThumbnails) {
      jpegSrc = fallbackSrc; // Use original if no thumbnails
    }
  } else {
    return ''; // No image source available
  }
  
  // Generate unique IDs for this image
  const imageId = `img-${award.awardNum}-${Math.random().toString(36).substr(2, 9)}`;
  const containerId = `container-${award.awardNum}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Generate image HTML with loading spinner (no inline handlers)
  if (supportsWebP && webpSrc && hasThumbnails) {
    // WebP support with optimized thumbnails
    setTimeout(() => setupImageLoadHandlers(imageId, containerId), 0);
    
    return `
      <div id="${containerId}" class="image-container" style="position: relative; height: 200px; background: #f8f9fa; display: flex; align-items: center; justify-content: center;">
        <!-- Loading spinner -->
        <div class="spinner-border text-primary" role="status" style="width: 2rem; height: 2rem;">
          <span class="visually-hidden">Loading image...</span>
        </div>
        
        <!-- Main image with WebP support -->
        <picture style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
          <source srcset="${webpSrc}" type="image/webp">
          <img id="${imageId}"
               src="${jpegSrc}" 
               class="card-img-top ${additionalClasses}" 
               alt="Award ${award.awardNum}"
               ${supportsLazyLoading ? 'loading="lazy"' : ''}
               style="width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 0.3s ease;">
        </picture>
      </div>
    `;
  } else {
    // Standard JPEG (either thumbnail or original)
    setTimeout(() => setupImageLoadHandlers(imageId, containerId), 0);
    
    return `
      <div id="${containerId}" class="image-container" style="position: relative; height: 200px; background: #f8f9fa; display: flex; align-items: center; justify-content: center;">
        <!-- Loading spinner -->
        <div class="spinner-border text-primary" role="status" style="width: 2rem; height: 2rem;">
          <span class="visually-hidden">Loading image...</span>
        </div>
        
        <!-- Main image -->
        <img id="${imageId}"
             src="${jpegSrc}" 
             class="card-img-top ${additionalClasses}" 
             alt="Award ${award.awardNum}"
             ${supportsLazyLoading ? 'loading="lazy"' : ''}
             style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 0.3s ease;">
      </div>
    `;
  }
}

/**
 * Setup image load event handlers (CSP-compliant)
 */
function setupImageLoadHandlers(imageId, containerId) {
  const img = document.getElementById(imageId);
  const container = document.getElementById(containerId);
  
  if (!img || !container) return;
  
  const spinner = container.querySelector('.spinner-border');
  
  // Handle successful image load
  img.addEventListener('load', function() {
    this.style.opacity = '1';
    if (spinner) spinner.style.display = 'none';
  });
  
  // Handle image load error
  img.addEventListener('error', function() {
    this.style.display = 'none';
    if (spinner) {
      spinner.innerHTML = '<small class="text-muted">Image unavailable</small>';
      spinner.classList.remove('spinner-border');
      spinner.classList.add('d-flex', 'align-items-center', 'justify-content-center');
    }
  });
}

function displayAwards(awards, year) {
  const container = document.getElementById('awards-container');
  
  if (!awards || awards.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center">
        <p class="text-muted">No awards found for ${year}</p>
      </div>
    `;
  } else {
    // Group awards by date
    const groupedByDate = groupAwardsByDate(awards);
    container.innerHTML = renderAwardsGroupedByDate(groupedByDate);
  }
  
  container.classList.remove('d-none');
}

function groupAwardsByDate(awards) {
  const grouped = {};
  awards.forEach(award => {
    const date = award.date_iso || 'Unknown Date';
    if (!grouped[date]) {
      grouped[date] = {
        awards: [],
        location: award.location || 'Location Not Available'
      };
    }
    grouped[date].awards.push(award);
  });
  return grouped;
}

/**
 * Format date string without timezone conversion
 * Prevents the common issue where "2025-01-15" becomes "January 14, 2025" in local time
 */
function formatDateSafe(dateString) {
  if (!dateString) return 'Unknown Date';
  
  // Parse the date parts directly to avoid timezone issues
  const [year, month, day] = dateString.split('-');
  if (!year || !month || !day) return dateString;
  
  // Create date in local timezone (month is 0-indexed)
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toLocaleDateString();
}

function renderAwardsGroupedByDate(groupedAwards) {
  let html = '';
  
  Object.keys(groupedAwards).sort().forEach(date => {
    const dateGroup = groupedAwards[date];
    const awards = dateGroup.awards;
    const location = dateGroup.location;
    
    html += `
      <div class="col-12 mb-4">
        <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center mb-3">
          <h3 class="mb-1 mb-md-0 me-md-3">${formatDateSafe(date)}</h3>
          <span class="text-muted">${location}</span>
        </div>
        <div class="row">
          ${awards.map(award => {
            // Generate optimized image HTML with WebP support and responsive sizing
            const imageHTML = generateOptimizedImageHTML(award, 'card');
            
            return `
            <div class="col-md-3 col-sm-6 mb-3">
              <div class="card">
                ${imageHTML}
                <div class="card-body">
                  <h6 class="card-title">${award.award} ${award.awardpoints || ''}</h6>
                  <p class="card-text">${award.genus} ${award.species || ''}</p>
                  <small class="text-muted">Award #${award.awardNum}</small>
                </div>
              </div>
            </div>
          `;}).join('')}
        </div>
      </div>
    `;
  });
  
  return html;
}

function hideLoading() {
  document.getElementById('loading-indicator').classList.add('d-none');
}

function showError(message) {
  hideLoading();
  const errorDiv = document.getElementById('error-message');
  errorDiv.textContent = message;
  errorDiv.classList.remove('d-none');
}

/**
 * Diagnostic function to display browser capabilities (for debugging)
 * Can be called from browser console: window.showBrowserCapabilities()
 */
function showBrowserCapabilities() {
  console.log('🔍 Browser Capabilities Report:');
  console.log('================================');
  console.log(`WebP Support: ${browserCapabilities.supportsWebP ? '✅' : '❌'}`);
  console.log(`Lazy Loading Support: ${browserCapabilities.supportsLazyLoading ? '✅' : '❌'}`);
  console.log(`High DPI Display: ${browserCapabilities.isHighDPI ? '✅' : '❌'} (${window.devicePixelRatio}x)`);
  console.log(`Viewport Width: ${browserCapabilities.viewportWidth}px`);
  console.log(`Optimal Image Size: ${getOptimalImageSize('card')}`);
  console.log('================================');
  
  // Also show in page for visual confirmation
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-info position-fixed';
  alertDiv.style.cssText = 'top: 10px; right: 10px; z-index: 1050; max-width: 300px; font-size: 12px;';
  alertDiv.innerHTML = `
    <strong>Browser Capabilities:</strong><br>
    WebP: ${browserCapabilities.supportsWebP ? '✅' : '❌'}<br>
    Lazy Loading: ${browserCapabilities.supportsLazyLoading ? '✅' : '❌'}<br>
    High DPI: ${browserCapabilities.isHighDPI ? '✅' : '❌'}<br>
    Optimal Size: ${getOptimalImageSize('card')}<br>
    <small>Images: ${browserCapabilities.supportsWebP ? 'WebP+JPEG' : 'JPEG only'}</small>
  `;
  document.body.appendChild(alertDiv);
  
  // Auto-remove after 5 seconds
  setTimeout(() => alertDiv.remove(), 5000);
}

/**
 * Performance monitoring for image loading
 */
function trackImageLoadingPerformance() {
  let loadedImages = 0;
  let totalImages = 0;
  let loadStartTime = performance.now();
  
  // Count images on page
  setTimeout(() => {
    totalImages = document.querySelectorAll('.card-img-top').length;
    console.log(`📊 Performance: ${totalImages} images to load`);
  }, 100);
  
  // Listen for image load events
  document.addEventListener('load', function(e) {
    if (e.target.tagName === 'IMG' && e.target.classList.contains('card-img-top')) {
      loadedImages++;
      const loadTime = performance.now() - loadStartTime;
      console.log(`📈 Image ${loadedImages}/${totalImages} loaded in ${loadTime.toFixed(0)}ms`);
      
      if (loadedImages === totalImages) {
        console.log(`🎉 All images loaded in ${loadTime.toFixed(0)}ms total`);
      }
    }
  }, true);
}

// Make diagnostic functions globally available
window.showBrowserCapabilities = showBrowserCapabilities;
window.trackImageLoadingPerformance = trackImageLoadingPerformance;