// Central route index - imports and organizes all route modules
const awardsRoutes = require('./awards');
const pagesRoutes = require('./pages');

module.exports = {
  awards: awardsRoutes,
  pages: pagesRoutes
};