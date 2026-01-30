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