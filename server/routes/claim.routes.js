const controller = require("../controllers/claim.controller");
const { verifyToken } = require("../middleware/authJwt");

module.exports = function(app) {
  // All claim routes should be secure
  app.get("/api/items/:itemId/claims", [verifyToken], controller.findAllForItem);
  app.post("/api/items/:itemId/claims", [verifyToken], controller.create);
  app.put("/api/claims/:claimId", [verifyToken], controller.update);
  app.get("/api/items/:itemId/chat-access", [verifyToken], controller.checkChatAccess);
};