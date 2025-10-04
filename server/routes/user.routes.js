const controller = require("../controllers/user.controller");
const { verifyToken } = require("../middleware/authJwt");

module.exports = function(app) {
  app.post("/api/auth/register", controller.register);
  app.post("/api/auth/login", controller.login);
  app.post("/api/auth/forgot-password", controller.forgotPassword);
  app.post("/api/auth/reset-password", controller.resetPassword);
  app.get("/api/my-conversations", [verifyToken], controller.getMyConversations);
  app.get("/api/auth/profile", [verifyToken], controller.getProfile);
};