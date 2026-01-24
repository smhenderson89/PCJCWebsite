// Central route index - imports and organizes all route modules
const generalRoutes = require('./general');
const awardsPages = require('./awards');  // Awards page routes
const awardsApi = require('./awards/api'); // Awards API routes

module.exports = {
  general: generalRoutes,
  awards: {
    pages: awardsPages,
    api: awardsApi
  }
};