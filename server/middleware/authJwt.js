const jwt = require("jsonwebtoken");

// This is the new, more secure "bouncer" that checks for the token in the correct place and in the correct order.
const verifyToken = (req, res, next) => {
  let token = req.headers["x-access-token"];

  // --- THIS IS THE NEW, SMARTER LOGIC (YOUR IDEA) ---
  // If the token isn't in the old spot, check the standard "Authorization" header.
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      token = parts[1]; // Get the token part
    }
  }
  // --------------------------------------------------

  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  // Step 1: Try to verify with the ADMIN secret key first (privilege-first).
  jwt.verify(token, "a-very-secret-key-for-admins", (adminErr, adminDecoded) => {
    if (!adminErr) {
      // If it succeeds, we know this is an admin.
      req.userId = adminDecoded.id;
      req.userRole = adminDecoded.role; // This will be 'admin' or 'superadmin'
      return next(); // Let them pass and stop checking.
    }

    // Step 2: If the admin check failed, NOW try the regular USER secret key.
    jwt.verify(token, "a-very-secret-key", (userErr, userDecoded) => {
      if (userErr) {
        // If both checks fail, the token is truly invalid.
        return res.status(401).send({ message: "Unauthorized! Invalid Token." });
      }
      
      // If it succeeds, we know this is a regular user.
      req.userId = userDecoded.id;
      req.userRole = 'user'; // Assign the 'user' role
      next(); // Let them pass.
    });
  });
};

// This function is now correct because verifyToken provides the right role.
const isAdmin = (req, res, next) => {
  if (req.userRole === 'admin' || req.userRole === 'superadmin') {
    return next(); // Access granted
  }
  res.status(403).send({ message: "Require Admin Role!" });
};
const isSuperAdmin = (req, res, next) => {
  if (req.userRole === 'superadmin') {
    return next(); // Access granted
  }
  res.status(403).send({ message: "Action forbidden: Requires Super Admin privileges." });
};
module.exports = { verifyToken, isAdmin, isSuperAdmin };