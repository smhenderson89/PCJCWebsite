// Central route index - imports and organizes all route modules
const generalRoutes = require('./general');
const awardsPages = require('./awards');  // Awards page routes
const awardsApi = require('./awards/api'); // Awards API routes
const adminApi = require('./admin/api'); // Admin API routes
const adminPages = require('./admin'); // Admin page routes

module.exports = {
  general: generalRoutes,
  awards: {
    pages: awardsPages,
    api: awardsApi
  },
  admin: {
    api: adminApi,
    pages: adminPages
  }
};