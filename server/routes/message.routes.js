const controller = require("../controllers/message.controller");
const { verifyToken } = require("../middleware/authJwt");

module.exports = function(app) {
  // All message routes should be secure
  app.get("/api/items/:itemId/messages", [verifyToken], controller.findAllForItem);
  app.post("/api/items/:itemId/messages", [verifyToken], controller.create);
  app.delete("/api/messages/:messageId", [verifyToken], controller.delete);
};