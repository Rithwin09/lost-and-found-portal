const multer = require("multer");

// Define the storage configuration for uploaded files
const storage = multer.diskStorage({
  // Tell multer to save files in the 'uploads/' directory
  destination: (req, file, cb) => {
    cb(null, "./uploads/");
  },
  // Create a unique filename for each uploaded file to avoid conflicts
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

// Create the multer instance with the defined storage
const upload = multer({ storage: storage });

// Export the configured upload middleware so other files can use it
module.exports = upload;
