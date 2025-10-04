const controller = require("../controllers/item.controller");
const { verifyToken } = require("../middleware/authJwt");
const upload = require("../middleware/upload");

module.exports = function(app) {
  // Public routes
  app.get("/api/items", controller.findAll);
  app.get("/api/items/:id", controller.findOne);
  app.post("/api/guest-items", [upload.single("image")], controller.createAsGuest);
  app.get("/api/verify-item", controller.verifyGuestItem);

  // Secure routes
  app.post("/api/items", [verifyToken, upload.single("image")], controller.create);
  app.get("/api/my-items", [verifyToken], controller.findAllForUser);
  app.put("/api/items/:id/status", [verifyToken], controller.updateStatus);
  app.delete("/api/items/:id", [verifyToken], controller.delete);
};