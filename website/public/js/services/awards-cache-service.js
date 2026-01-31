/**
 * Awards Cache Service - Handles sessionStorage caching for API calls
 */

class AwardsCacheService {
  constructor() {
    this.baseUrl = '/api/awards';
    this.cachePrefix = 'orchid_awards_';
  }

  /**
   * Get awards for a specific year - checks cache first with timestamp validation
   * @param {number} year - The year to get awards for
   * @param {number} maxAgeMinutes - Maximum age of cached data in minutes (default: 60)
   * @returns {Promise<Object>} Awards data
   */
  async getAwardsByYear(year, maxAgeMinutes = 60) {
    console.log(`Requesting awards for year: ${year}`);
    const cacheKey = `${this.cachePrefix}${year}`;
    
    // Check session storage first
    const cachedData = sessionStorage.getItem(cacheKey);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      
      // Check if cache has timestamp and is still valid
      if (parsed.timestamp) {
        const cacheAge = (Date.now() - parsed.timestamp) / (1000 * 60); // minutes
        if (cacheAge < maxAgeMinutes) {
          console.log(`Loading awards for ${year} from cache (${Math.round(cacheAge)} minutes old)`);
          return parsed.data;
        } else {
          console.log(`Cache for ${year} expired (${Math.round(cacheAge)} minutes old), fetching fresh data`);
          sessionStorage.removeItem(cacheKey);
        }
      }
    }

    // No cache found - fetch from API
    console.log(`Fetching awards for ${year} from API`);
    try {
      const response = await fetch(`${this.baseUrl}/${year}`);  // Fixed: removed 'year/' from path
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Cache the successful response with timestamp
        const cacheData = {
          data: data,
          timestamp: Date.now(),
          year: year
        };
        sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
        console.log(`Cached awards for ${year} at ${new Date().toLocaleTimeString()}`);
        return data;
      } else {
        throw new Error(data.error || 'API returned error');
      }
    } catch (error) {
      console.error('Error fetching awards:', error);
      throw error;
    }
  }

  /**
   * Clear cache for a specific year
   * @param {number} year - The year to clear cache for
   */
  clearYearCache(year) {
    const cacheKey = `${this.cachePrefix}${year}`;
    sessionStorage.removeItem(cacheKey);
  }

  /**
   * Clear all awards cache
   */
  clearAllCache() {
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith(this.cachePrefix)) {
        sessionStorage.removeItem(key);
      }
    });
  }

  /**
   * Check if year data is cached
   * @param {number} year - The year to check
   * @returns {boolean} True if cached
   */
  isCached(year) {
    const cacheKey = `${this.cachePrefix}${year}`;
    return sessionStorage.getItem(cacheKey) !== null;
  }

  /**
   * Get detailed award info for a specific year and award number
   * Checks sessionStorage cache first, then falls back to API
   * @param {number} year - The year of the award
   * @param {string} awardNum - The award number
   * @param {number} maxAgeMinutes - Maximum age of cached data in minutes (default: 60)
   * @returns {Promise<Object>} Award data
   */
  async getDetailedAwardInfo(year, awardNum, maxAgeMinutes = 60) {
    console.log(`Requesting detailed info for award ${awardNum} from year ${year}`);
    
    // First check if we have cached year data
    const cacheKey = `${this.cachePrefix}${year}`;
    const cachedData = sessionStorage.getItem(cacheKey);
    
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      
      // Check if cache has timestamp and is still valid
      if (parsed.timestamp) {
        const cacheAge = (Date.now() - parsed.timestamp) / (1000 * 60); // minutes
        if (cacheAge < maxAgeMinutes && parsed.data && parsed.data.success) {
          // Search for the specific award in cached data
          const awards = parsed.data.data || [];
          const award = awards.find(a => a.awardNum === awardNum);
          
          if (award) {
            console.log(`Found award ${awardNum} in cache (${Math.round(cacheAge)} minutes old)`);
            return { success: true, data: award, source: 'cache' };
          } else {
            console.log(`Award ${awardNum} not found in cached data`);
          }
        } else {
          console.log(`Cache for ${year} expired (${Math.round(cacheAge)} minutes old)`);
        }
      }
    }

    // No cache or award not found in cache - fetch from API
    console.log(`Fetching detailed award ${awardNum} for ${year} from API`);
    try {
      const response = await fetch(`${this.baseUrl}/${year}/award/${awardNum}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return { success: false, error: 'Award not found' };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Fetched detailed award ${awardNum} from API`);
      return { ...data, source: 'api' };
    } catch (error) {
      console.error(`Error fetching detailed award ${awardNum}:`, error);
      throw error;
    }
  }

  /**
   * Get cache info for a specific year
   * @param {number} year - The year to check
   * @returns {Object|null} Cache info with timestamp and age
   */
  getCacheInfo(year) {
    const cacheKey = `${this.cachePrefix}${year}`;
    const cached = sessionStorage.getItem(cacheKey);
    
    if (!cached) return null;
    
    const parsed = JSON.parse(cached);
    if (!parsed.timestamp) return null;
    
    const ageMinutes = (Date.now() - parsed.timestamp) / (1000 * 60);
    
    return {
      timestamp: parsed.timestamp,
      cachedAt: new Date(parsed.timestamp).toLocaleString(),
      ageMinutes: Math.round(ageMinutes * 100) / 100,
      isExpired: ageMinutes > 60 // Default 60 minute expiry
    };
  }
}

// Export for use in other files
const awardsCacheService = new AwardsCacheService();