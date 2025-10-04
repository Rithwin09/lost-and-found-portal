const controller = require("../controllers/admin.controller");
const { verifyToken, isAdmin, isSuperAdmin } = require("../middleware/authJwt");

module.exports = function(app) {
  // Public routes
  app.post("/api/admin/login", controller.login);
  app.post("/api/admin/setup", controller.setupAdminAccount);
  
  // Secure routes
  app.get("/api/admin/profile", [verifyToken, isAdmin], controller.getProfile);
  
  // Super Admin routes
  app.get("/api/admin/admins", [verifyToken, isSuperAdmin], controller.findAllAdmins);
  app.post("/api/admin/admins/invite", [verifyToken, isSuperAdmin], controller.sendAdminInvitation);
  app.delete("/api/admin/admins/:id", [verifyToken, isSuperAdmin], controller.deleteAdmin);
  
  // General Admin routes for reports
  app.get("/api/admin/reports", [verifyToken, isAdmin], controller.findAllReports);
  app.put("/api/admin/reports/:reportId/status", [verifyToken, isAdmin], controller.updateReportStatus);
  
  // General Admin routes for actions
  app.post("/api/admin/actions/moderate-user", [verifyToken, isAdmin], controller.moderateUser);
  app.post("/api/admin/actions/warn-unfreeze", [verifyToken, isAdmin], controller.warnAndUnfreeze);
  
  // General Admin routes for users
  app.get("/api/admin/users", [verifyToken, isAdmin], controller.findAllUsers);
  app.put("/api/admin/users/:userId/status", [verifyToken, isAdmin], controller.updateUserStatus);
  
  // General Admin routes for items
  app.get("/api/admin/items", [verifyToken, isAdmin], controller.findAllItems);
  app.put("/api/admin/items/:id", [verifyToken, isAdmin], controller.updateItem);
  app.delete("/api/admin/items/:id", [verifyToken, isAdmin], controller.deleteItem);
  app.put("/api/admin/items/:id/verify", [verifyToken, isAdmin], controller.verifyItem);
  app.delete("/api/admin/items/:id/claims", [verifyToken, isAdmin], controller.removeClaimsFromItem);

};