// Configuration file setup
const path = require("path");

module.exports = function setupViewEngine(app) {
  app.set("views", path.join(__dirname, "../views"));
  app.set("view engine", "ejs");
};
