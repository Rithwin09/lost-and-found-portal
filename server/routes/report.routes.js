const controller = require("../controllers/report.controller");
const { verifyToken, isAdmin } = require("../middleware/authJwt");

module.exports = function(app) {
  // A secure route for any logged-in user to SUBMIT a report
  app.post("/api/reports", [verifyToken], controller.create);

  // A secure route ONLY for ADMINS to VIEW all reports
  app.get("/api/reports", [verifyToken, isAdmin], controller.findAll);
};